"""
Motor de Precios V2 — Cencore SAS
Patrón Strategy: cada línea de producto tiene su calculadora especializada.
"""
import os
import math
from abc import ABC, abstractmethod
from supabase import create_client, Client
from dotenv import load_dotenv
from models import (
    PricingRequest, PricingResponse, PricingBreakdown,
    BOMLayer, BOMAccessory, RoutingStep, IncomeStatement
)

load_dotenv()

# ── Cliente Supabase ─────────────────────────────────────────────────
def get_supabase() -> Client:
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )


# ── Clase Base Abstracta ──────────────────────────────────────────────
class BasePricingCalculator(ABC):
    DEFAULT_MARGIN = 0.25

    def __init__(self, request: PricingRequest, db: Client):
        self.req = request
        self.db = db

    # ── Helper: costo unitario desde catálogo ─────────────────────────
    def _get_material_cost(self, material_name: str) -> float:
        try:
            res = (
                self.db.table("pricing_materials_catalog")
                .select("cost_per_unit")
                .eq("name", material_name)
                .execute()
            )
            if res.data:
                return float(res.data[0]["cost_per_unit"])
        except Exception:
            pass
        return 0.0

    # ── Motor de Materiales (BOM) ─────────────────────────────────────
    @abstractmethod
    def calculate_materials(self) -> dict:
        """Retorna {'raw_materials': float, 'accessories_cost': float}"""
        pass

    # ── Motor Logístico ───────────────────────────────────────────────
    # ── Motor Logístico ───────────────────────────────────────────────
    def calculate_freight(self) -> dict:
        """Calcula flete basándose en cubicaje con tolerancia de 10mm."""
        d = self.req.dimensions
        tolerance = 10.0 # mm
        
        # Determinar volumen unitario ajustado en mm³
        if self.req.product_line in ["Tubos", "Envases"]:
            diameter_mm = d.diameter_mm or 50.0
            thickness_mm = d.thickness_mm or 5.0
            length_mm = d.length_mm or 100.0
            r_ext_adj = ((diameter_mm + 2 * thickness_mm) + tolerance) / 2
            vol_unit_mm3 = math.pi * (r_ext_adj ** 2) * (length_mm + tolerance)
        elif self.req.product_line == "Corrugado":
            l_adj = (d.length_mm or 100.0) + tolerance
            w_adj = (d.width_mm or 100.0) + tolerance
            h_adj = (d.height_mm or 100.0) + tolerance
            vol_unit_mm3 = l_adj * w_adj * h_adj
        elif self.req.product_line == "Esquineros":
            l_adj = (d.length_mm or 100.0) + tolerance
            w1_adj = (d.wing_1_mm or 50.0) + tolerance
            w2_adj = (d.wing_2_mm or 50.0) + tolerance
            t_mm = d.thickness_mm or 5.0
            vol_unit_mm3 = (w1_adj + w2_adj - t_mm) * t_mm * l_adj
        else:
            vol_unit_mm3 = 100000.0 # fallback

        # Convertir mm³ a m³
        vol_unit_m3 = vol_unit_mm3 / 1e9
        total_vol_m3 = vol_unit_m3 * self.req.requested_quantity
        
        # Consultar vehículos activos
        vehicles = self.db.table("pricing_logistics").select("*").eq("active", True).execute()
        if not vehicles.data:
            return {"freight_cost": 0.0, "capacity_used_pct": 0.0, "truck_type": "Ninguno"}
        
        # Ordenar por costo de flete ascendente
        sorted_vehicles = sorted(vehicles.data, key=lambda x: float(x.get("freight_cost", 0)))
        
        # Encontrar el vehículo óptimo
        assigned_vehicle = None
        for v in sorted_vehicles:
            if float(v.get("volume_m3", 0)) >= total_vol_m3:
                assigned_vehicle = v
                break
                
        # Si ningún vehículo es lo suficientemente grande, usamos el más grande y calculamos múltiplos
        if not assigned_vehicle:
            largest_vehicle = max(vehicles.data, key=lambda x: float(x.get("volume_m3", 0)))
            largest_vol = float(largest_vehicle.get("volume_m3", 1.0))
            num_trucks = math.ceil(total_vol_m3 / largest_vol)
            freight_total = float(largest_vehicle.get("freight_cost", 0)) * num_trucks
            capacity_pct = (total_vol_m3 / (largest_vol * num_trucks)) * 100
            truck_name = f"{num_trucks}x {largest_vehicle.get('truck_type')}"
        else:
            freight_total = float(assigned_vehicle.get("freight_cost", 0))
            capacity_pct = (total_vol_m3 / float(assigned_vehicle.get("volume_m3", 1.0))) * 100
            truck_name = assigned_vehicle.get("truck_type")
            
            # Lógica híbrida para fletes en vehículos asignados
            smallest_vehicle = min(vehicles.data, key=lambda x: float(x.get("volume_m3", 1.0)))
            smallest_vol = float(smallest_vehicle.get("volume_m3", 1.0))
            smallest_cost = float(smallest_vehicle.get("freight_cost", 0.0))
            smallest_capacity_pct = (total_vol_m3 / smallest_vol) * 100.0
            
            if smallest_capacity_pct < 15.0:
                prorated = (smallest_capacity_pct / 100.0) * smallest_cost
                flat_minimum = 45000.0
                freight_total = max(flat_minimum, prorated)
                truck_name = f"Consolidado ({truck_name})"
            
        # Si en la solicitud no se requiere logística, el flete es 0
        if not self.req.logistics or self.req.logistics.truck_type == "Sin flete" or self.req.logistics.truck_type == "":
            return {"freight_cost": 0.0, "capacity_used_pct": 0.0, "truck_type": "Sin flete"}
            
        # Sobrescribir si se proporciona flete manual
        if self.req.logistics and self.req.logistics.manual_freight_cost is not None:
            freight_total = self.req.logistics.manual_freight_cost
            truck_name = f"Manual ({self.req.logistics.truck_type or 'Personalizado'})"
            
        return {
            "freight_cost": round(freight_total, 2),
            "capacity_used_pct": round(min(capacity_pct, 100.0), 2),
            "truck_type": truck_name
        }

    # ── Motor MOD + CIF + NIF ─────────────────────────────────────────
    def calculate_labor_and_overheads(self) -> dict:
        """Itera routing steps y distribuye CIF/NIF proporcional al tiempo.
        
        Prorrateo real: los costos fijos mensuales se asignan según los
        minutos que esta orden consume de la capacidad estándar de planta
        (10,800 minutos/mes = 22.5 días x 8 horas x 60 minutos).
        """
        PLANT_CAPACITY_MINUTES = 10800.0  # Capacidad estándar mensual de planta
        
        total_hours = 0.0
        direct_labor = 0.0
        
        # Cache para perfiles laborales
        profiles_cache = {}
        
        for step in self.req.routing:
            # Si el paso tiene 0 operarios, se omite completamente del cálculo
            if step.operator_count == 0:
                continue

            prod_hours = self.req.requested_quantity / step.speed if step.speed > 0 else 0
            step_hours = prod_hours + step.setup_hours
            total_hours += step_hours
            
            profile_name = step.labor_profile
            hourly_rate = 15000.0  # Fallback por defecto
            
            if profile_name:
                if profile_name in profiles_cache:
                    hourly_rate = profiles_cache[profile_name]
                else:
                    try:
                        profile_res = (
                            self.db.table("pricing_labor_profiles")
                            .select("*")
                            .eq("profile_name", profile_name)
                            .eq("active", True)
                            .execute()
                        )
                        if profile_res.data:
                            prof = profile_res.data[0]
                            base_salary = float(prof.get("base_salary_monthly", 0))
                            
                            if prof.get("profile_type") == "Prestación de Servicios":
                                monthly_cost = base_salary
                            else:
                                eps = float(prof.get("eps_pct", 8.5))
                                pension = float(prof.get("pension_pct", 12.0))
                                arl = float(prof.get("arl_pct", 0.522))
                                cesantias = float(prof.get("cesantias_pct", 8.33))
                                prima = float(prof.get("prima_pct", 8.33))
                                vacaciones = float(prof.get("vacaciones_pct", 4.17))
                                intereses = float(prof.get("intereses_cesantias_pct", 1.0))
                                ccf = float(prof.get("ccf_pct", 4.0))
                                icbf = float(prof.get("icbf_pct", 0.0))
                                sena = float(prof.get("sena_pct", 0.0))
                                
                                pct_sum = eps + pension + arl + cesantias + prima + vacaciones + intereses + ccf + icbf + sena
                                transport_sub = float(prof.get("transport_subsidy", 162000.0))
                                
                                monthly_cost = base_salary + (base_salary * (pct_sum / 100.0)) + transport_sub
                                
                            hourly_rate = monthly_cost / 160.0
                            profiles_cache[profile_name] = hourly_rate
                        else:
                            raise ValueError("Profile not found, falling back")
                    except Exception:
                        # Fallback a la tabla legacy
                        try:
                            labor_legacy = self.db.table("pricing_labor_provisions").select("*").limit(1).execute()
                            if labor_legacy.data:
                                l = labor_legacy.data[0]
                                monthly_cost = (
                                    l.get("base_salary", 0) +
                                    l.get("cesantias", 0) +
                                    l.get("prima", 0) +
                                    l.get("eps", 0) +
                                    l.get("pension", 0) +
                                    l.get("arl", 0) +
                                    l.get("transport_subsidy", 0)
                                )
                                hourly_rate = monthly_cost / 160.0
                                profiles_cache[profile_name] = hourly_rate
                        except Exception:
                            pass
            else:
                try:
                    labor_legacy = self.db.table("pricing_labor_provisions").select("*").limit(1).execute()
                    if labor_legacy.data:
                        l = labor_legacy.data[0]
                        monthly_cost = (
                            l.get("base_salary", 0) +
                            l.get("cesantias", 0) +
                            l.get("prima", 0) +
                            l.get("eps", 0) +
                            l.get("pension", 0) +
                            l.get("arl", 0) +
                            l.get("transport_subsidy", 0)
                        )
                        hourly_rate = monthly_cost / 160.0
                except Exception:
                    pass
                
            direct_labor += step_hours * hourly_rate * step.operator_count

        # ── CIF y NIF: prorrateo real por minutos vs capacidad estándar de planta
        date_q = self.req.quote_date or "2026-01-01"
        indirect = (
            self.db.table("pricing_indirect_costs")
            .select("*")
            .lte("start_date", date_q)
            .gte("end_date", date_q)
            .execute()
        )
        indirect_data = indirect.data or []

        # Factor de participación = minutos de esta orden / capacidad mensual estándar
        order_minutes = total_hours * 60.0
        participation = order_minutes / PLANT_CAPACITY_MINUTES

        var_monthly = sum(float(i.get("amount", 0)) for i in indirect_data if i.get("cost_type") == "variable")
        fix_monthly = sum(float(i.get("amount", 0)) for i in indirect_data if i.get("cost_type") == "fixed")

        if not var_monthly and not fix_monthly:
            total_indirect_monthly = sum(float(i.get("amount", 0)) for i in indirect_data)
            fix_monthly = total_indirect_monthly

        # CIF variables: prorateados por participación (ej. energía, mantenimiento variable)
        factory_overheads = var_monthly * participation
        # NIF (costos fijos: arriendo, contador, etc.) prorateados por participación
        indirect_costs = fix_monthly * participation

        return {
            "direct_labor": round(direct_labor, 2),
            "factory_overheads": round(factory_overheads, 2),
            "indirect_costs": round(indirect_costs, 2),
            "production_hours": round(total_hours, 4),
        }

    # ── Empaque ───────────────────────────────────────────────────────
    def calculate_packaging(self) -> float:
        if not self.req.packaging:
            return 0.0
        total = 0.0
        import re
        for pkg_item in self.req.packaging:
            res = (
                self.db.table("pricing_materials_catalog")
                .select("*")
                .eq("name", pkg_item.material_name)
                .eq("category", "Empaque")
                .execute()
            )
            if not res.data:
                continue
            
            row = res.data[0]
            unit_cost = float(row.get("cost_per_unit", 0))
            
            # Check if name contains dimensions (e.g. 420x420x600)
            dims_match = re.search(r'(\d+)\s*[xX]\s*(\d+)\s*[xX]\s*(\d+)', pkg_item.material_name)
            
            if dims_match and self.req.product_line in ["Tubos", "Envases"]:
                box_l = float(dims_match.group(1))
                box_w = float(dims_match.group(2))
                box_h = float(dims_match.group(3))
                vol_box = box_l * box_w * box_h
                
                # Single tube volume
                d = self.req.dimensions
                diameter_mm = d.diameter_mm or 50.0
                thickness_mm = d.thickness_mm or 5.0
                length_mm = d.length_mm or 100.0
                r_ext = (diameter_mm + 2 * thickness_mm) / 2
                vol_tube = math.pi * (r_ext ** 2) * length_mm
                
                tubes_per_box = max(1, math.floor(vol_box / vol_tube))
                qty_needed = math.ceil(self.req.requested_quantity / tubes_per_box)
            else:
                qty_needed = pkg_item.quantity if pkg_item.quantity is not None else 1.0
            
            total += qty_needed * unit_cost
            
            # Resolve dependencies if any
            deps = row.get("dependencies")
            if deps:
                import json
                if isinstance(deps, str):
                    try:
                        deps = json.loads(deps)
                    except Exception:
                        deps = []
                if isinstance(deps, list):
                    for dep in deps:
                        dep_name = dep.get("material_name")
                        ratio = float(dep.get("quantity_ratio", 1.0))
                        dep_res = (
                            self.db.table("pricing_materials_catalog")
                            .select("cost_per_unit")
                            .eq("name", dep_name)
                            .execute()
                        )
                        if dep_res.data:
                            dep_cost = float(dep_res.data[0]["cost_per_unit"])
                            total += (qty_needed * ratio) * dep_cost
                            
        return round(total, 2)

    # ── Cálculo final ─────────────────────────────────────────────────
    async def calculate(self) -> PricingResponse:
        materials = self.calculate_materials()
        labor_data = self.calculate_labor_and_overheads()
        freight_data = self.calculate_freight()
        packaging_cost = self.calculate_packaging()

        total_cost = (
            materials["raw_materials"] +
            materials["accessories_cost"] +
            labor_data["direct_labor"] +
            labor_data["factory_overheads"] +
            labor_data["indirect_costs"] +
            packaging_cost +
            freight_data["freight_cost"]
        )

        margin = self.req.margin if self.req.margin else self.DEFAULT_MARGIN
        margin_amount = total_cost * margin
        total_price = total_cost + margin_amount
        unit_price = total_price / self.req.requested_quantity if self.req.requested_quantity > 0 else 0

        breakdown = PricingBreakdown(
            raw_materials=materials["raw_materials"],
            accessories_cost=materials["accessories_cost"],
            direct_labor=labor_data["direct_labor"],
            factory_overheads=labor_data["factory_overheads"],
            indirect_costs=labor_data["indirect_costs"],
            packaging_cost=packaging_cost,
            freight_cost=freight_data["freight_cost"],
            total_production_cost=round(total_cost, 2),
            margin_amount=round(margin_amount, 2),
            production_hours=labor_data["production_hours"],
            capacity_used_pct=freight_data["capacity_used_pct"],
        )

        # Estado de Resultados exacto (Regla Financiera)
        venta_total = total_price
        costo_materia_prima = materials["raw_materials"] + materials["accessories_cost"] + packaging_cost
        utilidad_bruta = venta_total - costo_materia_prima
        gastos_operacionales = labor_data["indirect_costs"] + freight_data["freight_cost"]
        carga_fabril_cif = labor_data["factory_overheads"]
        mano_de_obra = labor_data["direct_labor"]
        
        utilidad_operacional = utilidad_bruta - gastos_operacionales - carga_fabril_cif - mano_de_obra
        impuestos = max(0.0, utilidad_operacional * 0.35)
        rentabilidad_neta_ejercicio = utilidad_operacional - impuestos
        porcentaje_rentabilidad = (rentabilidad_neta_ejercicio / venta_total * 100) if venta_total > 0 else 0.0

        income_statement = IncomeStatement(
            venta_total=round(venta_total, 2),
            costo_materia_prima=round(costo_materia_prima, 2),
            utilidad_bruta=round(utilidad_bruta, 2),
            gastos_operacionales=round(gastos_operacionales, 2),
            carga_fabril_cif=round(carga_fabril_cif, 2),
            mano_de_obra=round(mano_de_obra, 2),
            utilidad_operacional=round(utilidad_operacional, 2),
            impuestos=round(impuestos, 2),
            rentabilidad_neta_ejercicio=round(rentabilidad_neta_ejercicio, 2),
            porcentaje_rentabilidad=round(porcentaje_rentabilidad, 2),
        )

        return PricingResponse(
            unit_price=round(unit_price, 2),
            total_price=round(total_price, 2),
            breakdown=breakdown,
            income_statement=income_statement,
            currency="COP"
        )

# TubosCalculator ───────────────────────────────────────────────────────────
class TubosCalculator(BasePricingCalculator):
    """
    Cálculo de materias primas basado en el Área Lateral del Tubo Padre.
    El refile se calcula automáticamente desde la Cabida y la configuración de la máquina.
    Peso Papel = Área_m² × GMS_capa / 1000 × cantidad
    Peso Pegante = Área_m² × GMS_pegante × capas_pegante / 1000 × cantidad
    """
    # Defaults de configuración de máquina (pueden sobreescribirse por request)
    DEFAULT_MARGEN_PUNTAS_MM = 10.0
    DEFAULT_GROSOR_CUCHILLA_MM = 5.0

    @staticmethod
    def _compute_refile_mm(cabida: int, margen_puntas_mm: float, grosor_cuchilla_corte_mm: float) -> float:
        """Calcula los milímetros de refile según cabida y configuración de máquina.

        Cabida == 1 (colmalla): solo margen de puntas.
        Cabida > 1 (múltiples cortes): margen de puntas + (cabida - 1) × grosor de cuchilla.
        """
        if cabida <= 1:
            return margen_puntas_mm
        return margen_puntas_mm + (cabida - 1) * grosor_cuchilla_corte_mm

    def _compute_parent_tube_area_m2(self) -> float:
        """Calcula el área lateral del Tubo Padre en m² POR UNIDAD.

        Fórmula exacta (Excel Cencore):
          Refile = f(cabida, máquina) — automático
          Largo_Tubo_Padre_m = ((Largo_Unidad_mm × Cabida) + Refile) / 1000
          Area_m2 = (D_ext_mm / 1000) × π × Largo_Tubo_Padre_m
        """
        d = self.req.dimensions
        diameter_mm = d.diameter_mm or (d.width_mm or 50.0)
        thickness_mm = d.thickness_mm or 5.0
        length_mm = d.length_mm or 100.0

        # Cabida automatizada según largo unidad (máx. 2000mm)
        max_largo_tubo_padre = 2000.0
        cabida = math.floor(max_largo_tubo_padre / length_mm) if length_mm > 0 else 1
        if cabida < 1:
            cabida = 1

        margen_puntas = self.req.margen_puntas_mm or self.DEFAULT_MARGEN_PUNTAS_MM
        grosor_cuchilla = self.req.grosor_cuchilla_corte_mm or self.DEFAULT_GROSOR_CUCHILLA_MM

        refile_mm = self._compute_refile_mm(cabida, margen_puntas, grosor_cuchilla)

        # Diámetro externo en mm
        diameter_ext_mm = diameter_mm + 2.0 * thickness_mm

        # Largo tubo padre en metros (incluye múltiples cortes por cabida + refile)
        largo_padre_m = ((length_mm * cabida) + refile_mm) / 1000.0

        # Área lateral: D_ext(m) × π × Largo(m)
        area_m2 = (diameter_ext_mm / 1000.0) * math.pi * largo_padre_m
        return area_m2

    def calculate_materials(self) -> dict:
        bom = self.req.bom
        waste_factor = 1.0 + (self.req.waste_pct or 0.0) / 100.0
        qty = self.req.requested_quantity

        # Área del tubo padre por unidad (m²)
        area_m2_unit = self._compute_parent_tube_area_m2()

        raw_materials = 0.0

        if bom.layers:
            for layer in bom.layers:
                cost_kg = self._get_material_cost(layer.material_name)
                # GMS del papel: el campo `layer.quantity` se reutiliza como GMS/m²
                # (Convenio: en el BOM, `quantity` de una capa = GMS del papel, ej. 168, 300, 400)
                gms = layer.quantity  # GMS/m²
                kg_per_unit = (area_m2_unit * gms) / 1000.0
                raw_materials += kg_per_unit * qty * cost_kg * waste_factor

            # ── Pegante ───────────────────────────────────────────────
            if bom.glue_name:
                glue_cost_kg = self._get_material_cost(bom.glue_name)
                if bom.glue_gms and bom.glue_gms > 0 and bom.glue_layers and bom.glue_layers > 0:
                    # Método nuevo: GMS/m² × capas de pegante × área tubo padre
                    kg_glue_per_unit = (area_m2_unit * bom.glue_gms * bom.glue_layers) / 1000.0
                    raw_materials += kg_glue_per_unit * qty * glue_cost_kg * waste_factor
                elif bom.glue_grams and bom.glue_grams > 0:
                    # Método legacy: gramos fijos por unidad
                    total_glue_kg = (bom.glue_grams / 1000.0) * qty
                    raw_materials += total_glue_kg * glue_cost_kg * waste_factor
                else:
                    # Auto-fallback: ~10% del peso total de papel
                    total_paper_kg = sum(
                        (area_m2_unit * l.quantity / 1000.0) * qty
                        for l in bom.layers
                    )
                    raw_materials += total_paper_kg * 0.10 * glue_cost_kg * waste_factor
            else:
                # Sin pegante especificado: estimado en 10% del peso de papel
                try:
                    glue_res = self.db.table("pricing_materials_catalog").select("cost_per_unit").eq("category", "Pegante").limit(1).execute()
                    glue_cost = float(glue_res.data[0]["cost_per_unit"]) if glue_res.data else 3570
                except Exception:
                    glue_cost = 3570
                total_paper_kg = sum(
                    (area_m2_unit * l.quantity / 1000.0) * qty
                    for l in bom.layers
                )
                raw_materials += total_paper_kg * 0.10 * glue_cost * waste_factor

        return {"raw_materials": round(raw_materials, 2), "accessories_cost": 0.0}


# ── EnvasesCalculator ─────────────────────────────────────────────────
class EnvasesCalculator(TubosCalculator):
    """
    Hereda el cálculo de papel de TubosCalculator.
    Agrega accesorios (tapas, fondos, etiquetas).
    """
    def calculate_materials(self) -> dict:
        base = super().calculate_materials()

        accessories_cost = 0.0
        if self.req.bom.accessories:
            for acc in self.req.bom.accessories:
                unit_cost = self._get_material_cost(acc.material_name)
                accessories_cost += unit_cost * acc.quantity * self.req.requested_quantity

        return {
            "raw_materials": base["raw_materials"],
            "accessories_cost": round(accessories_cost, 2)
        }


# ── CorrugadoCalculator ───────────────────────────────────────────────
class CorrugadoCalculator(BasePricingCalculator):
    """
    Parte del costo de la lámina madre (precio por m²).
    Tiempos basados en golpes/hora del troquelado.
    """
    def calculate_materials(self) -> dict:
        d = self.req.dimensions
        bom = self.req.bom

        raw_materials = 0.0
        if bom.lamina_madre:
            cost_m2 = self._get_material_cost(bom.lamina_madre)
            # Área en m²: largo × ancho en mm → m²
            area_m2 = ((d.length_mm or 0) / 1000) * ((d.width_mm or 0) / 1000)
            raw_materials = cost_m2 * area_m2 * self.req.requested_quantity * 1.10  # 10% merma

        return {"raw_materials": round(raw_materials, 2), "accessories_cost": 0.0}


# ── Factory / Strategy Selector ───────────────────────────────────────
CALCULATOR_MAP: dict = {
    "Tubos":     TubosCalculator,
    "Envases":   EnvasesCalculator,
    "Corrugado": CorrugadoCalculator,
}


class PricingEngine:
    @staticmethod
    async def calculate_pricing(request: PricingRequest) -> PricingResponse:
        db = get_supabase()
        calculator_cls = CALCULATOR_MAP.get(request.product_line, TubosCalculator)
        calculator = calculator_cls(request, db)
        return await calculator.calculate()
