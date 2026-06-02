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


def get_gsm_from_name(name: str) -> float:
    import re
    match = re.search(r'(\d+)', name)
    if match:
        return float(match.group(1))
    name_lower = name.lower()
    if "periodico" in name_lower:
        return 50.0
    if "foil" in name_lower:
        return 80.0
    if "kraft" in name_lower:
        return 300.0
    return 300.0  # general fallback


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

        # Sum of all active registers regardless of fixed/variable type
        total_indirect_monthly = sum(float(i.get("amount", 0)) for i in indirect_data)

        # The formula Suma_Total_Costos_Fijos * (Minutos_Orden / 10800) executed over the grand total of the month
        factory_overheads = total_indirect_monthly * participation
        indirect_costs = 0.0

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
    DEFAULT_MARGEN_PUNTAS_MM = 10.0
    DEFAULT_GROSOR_CUCHILLA_MM = 5.0

    def _compute_refile_mm(self, cabida: int, margen_puntas: float, grosor_cuchilla: float) -> float:
        if cabida == 1:
            return margen_puntas
        else:
            return margen_puntas + (cabida - 1) * grosor_cuchilla

    def _get_dynamic_glue_gms(self, thickness_mm: float) -> float:
        """Asigna automáticamente el gramaje de pegante según el espesor ingresado."""
        if thickness_mm <= 1.8:
            return 55.0
        elif thickness_mm <= 2.9:
            return 65.0
        elif thickness_mm <= 5.0:
            return 70.0
        elif thickness_mm <= 7.5:
            return 80.0
        elif thickness_mm <= 12.0:
            return 100.0
        else:
            return 120.0

    def _compute_parent_tube_area_m2(self) -> float:
        """Calcula el área lateral del Tubo Padre en m² POR UNIDAD.

        Fórmula según 'Reglas Matriz tubo' (y validada por auditoría Colmallas):
          Largo_Tubo_Padre_mm = Largo_Unidad_mm + 10
          Area_Tubo_Padre_m2 = (Largo_Tubo_Padre_mm / 1000) * (Diametro_Interno_mm / 1000) * 3.1416
        """
        d = self.req.dimensions
        diameter_mm = d.diameter_mm or (d.width_mm or 50.0)
        length_mm = d.length_mm or 100.0

        largo_tubo_padre_mm = length_mm + 10

        area_m2 = (largo_tubo_padre_mm / 1000.0) * (diameter_mm / 1000.0) * 3.1416
        return area_m2

    def calculate_materials(self) -> dict:
        bom = self.req.bom
        qty = self.req.requested_quantity
        d = self.req.dimensions
        thickness_mm = d.thickness_mm or 5.0

        # Área del tubo padre por unidad (m²)
        area_m2_unit = self._compute_parent_tube_area_m2()

        # Determinar desperdicio de tubos padres fijos (Merma)
        if thickness_mm <= 6.0:
            tubes_waste_qty = 35
        else:
            tubes_waste_qty = 45

        # 1. Calcular costo de 1 Tubo Padre completo (papel + pegante para 1 unidad)
        paper_cost_1 = 0.0
        total_paper_kg_1 = 0.0
        
        if bom.layers:
            for layer in bom.layers:
                cost_kg = self._get_material_cost(layer.material_name)
                # Determinación de GSM y cantidad de capas
                if layer.quantity >= 50.0:
                    gms_capa = layer.quantity
                    numero_capas = 1.0
                else:
                    gms_capa = get_gsm_from_name(layer.material_name)
                    numero_capas = layer.quantity
                
                peso_capa_kg = area_m2_unit * (gms_capa * numero_capas) / 1000.0
                paper_cost_1 += peso_capa_kg * cost_kg
                total_paper_kg_1 += peso_capa_kg

        # Costo de pegante para 1 tubo padre
        glue_cost_1 = 0.0
        if bom.layers:
            if bom.glue_name:
                glue_cost_kg = self._get_material_cost(bom.glue_name)
                # Asignar GMS de pegante dinámicamente según espesor, o usar el provisto
                glue_gms = bom.glue_gms if (bom.glue_gms and bom.glue_gms > 0) else self._get_dynamic_glue_gms(thickness_mm)
                
                # Las capas de pegante suelen ser Capas de Papel - 1, o usar el provisto
                if bom.glue_layers and bom.glue_layers > 0:
                    glue_layers = bom.glue_layers
                else:
                    total_paper_layers = sum(1.0 if l.quantity >= 50.0 else l.quantity for l in bom.layers)
                    glue_layers = max(1.0, total_paper_layers - 1.0)
                
                # Fórmula final pegante: (Capas_de_Pegante * GMS_Asignado) * Area_Tubo_Padre_m2
                kg_glue_per_unit = ((glue_layers * glue_gms) * area_m2_unit) / 1000.0
                glue_cost_1 = kg_glue_per_unit * glue_cost_kg
            else:
                # Auto-fallback: ~10% del peso total de papel
                try:
                    glue_res = self.db.table("pricing_materials_catalog").select("cost_per_unit").eq("category", "Pegante").limit(1).execute()
                    glue_cost_kg = float(glue_res.data[0]["cost_per_unit"]) if glue_res.data else 3570
                except Exception:
                    glue_cost_kg = 3570
                glue_cost_1 = total_paper_kg_1 * 0.10 * glue_cost_kg

        cost_1_parent_tube = paper_cost_1 + glue_cost_1

        # 2. El costo total de la materia prima del pedido
        if self.req.waste_pct and self.req.waste_pct > 0:
            # Cálculo porcentual (legacy / auditoría Excel)
            waste_factor = 1.0 + (self.req.waste_pct / 100.0)
            raw_materials = qty * cost_1_parent_tube * waste_factor
        else:
            # Cálculo automatizado por cantidad de tubos padres perdidos
            total_waste_cost = tubes_waste_qty * cost_1_parent_tube
            raw_materials = (qty * cost_1_parent_tube) + total_waste_cost

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
