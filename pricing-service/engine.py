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
    BOMLayer, BOMAccessory, RoutingStep
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

    # ── Motor de Materiales (BOM) ─────────────────────────────────────
    @abstractmethod
    def calculate_materials(self) -> dict:
        """Retorna {'raw_materials': float, 'accessories_cost': float}"""
        pass

    # ── Motor Logístico ───────────────────────────────────────────────
    def calculate_freight(self) -> dict:
        """Calcula flete proporcional al cubicaje del pedido."""
        if not self.req.logistics:
            return {"freight_cost": 0.0, "capacity_used_pct": 0.0}

        truck = (
            self.db.table("pricing_logistics")
            .select("*")
            .eq("truck_type", self.req.logistics.truck_type)
            .eq("active", True)
            .execute()
        )
        if not truck.data:
            return {"freight_cost": 0.0, "capacity_used_pct": 0.0}

        t = truck.data[0]
        d = self.req.dimensions
        # Volumen en m³ (dimensiones en mm → convertir a m)
        l_m = (d.length_mm or 0) / 1000
        w_m = (d.width_mm or 0) / 1000
        h_m = (d.height_mm or 0) / 1000
        vol_unit_m3 = l_m * w_m * h_m if l_m * w_m * h_m > 0 else 0.0001

        vol_order_m3 = vol_unit_m3 * self.req.requested_quantity
        capacity_pct = min(vol_order_m3 / float(t["volume_m3"]), 1.0)
        freight_total = float(t["freight_cost"]) * capacity_pct
        freight_per_unit = freight_total / self.req.requested_quantity

        return {
            "freight_cost": round(freight_per_unit * self.req.requested_quantity, 2),
            "capacity_used_pct": round(capacity_pct * 100, 2)
        }

    # ── Motor MOD + CIF + NIF ─────────────────────────────────────────
    def calculate_labor_and_overheads(self) -> dict:
        """Itera routing steps y distribuye CIF/NIF proporcional al tiempo."""
        # Tarifa horaria desde pricing_labor_provisions o default
        labor = self.db.table("pricing_labor_provisions").select("*").limit(1).execute()
        if labor.data:
            l = labor.data[0]
            monthly_cost = (
                l.get("base_salary", 0) +
                l.get("cesantias", 0) +
                l.get("prima", 0) +
                l.get("eps", 0) +
                l.get("pension", 0) +
                l.get("arl", 0) +
                l.get("transport_subsidy", 0)
            )
            hourly_rate = monthly_cost / 160
        else:
            hourly_rate = 15000  # fallback

        # Sumar horas de todos los pasos del routing
        total_hours = 0.0
        direct_labor = 0.0
        for step in self.req.routing:
            prod_hours = self.req.requested_quantity / step.speed if step.speed > 0 else 0
            step_hours = prod_hours + step.setup_hours
            total_hours += step_hours
            direct_labor += step_hours * hourly_rate * step.operator_count

        # CIF y NIF desde costos indirectos
        date_q = self.req.quote_date or "2026-01-01"
        indirect = (
            self.db.table("pricing_indirect_costs")
            .select("*")
            .lte("start_date", date_q)
            .gte("end_date", date_q)
            .execute()
        )
        indirect_data = indirect.data or []

        participation = total_hours / 160.0  # fracción del mes utilizada

        var_monthly = sum(float(i.get("amount", 0)) for i in indirect_data if i.get("cost_type") == "variable")
        fix_monthly = sum(float(i.get("amount", 0)) for i in indirect_data if i.get("cost_type") == "fixed")

        # Si no hay separación por cost_type usa suma completa para NIF
        if not var_monthly and not fix_monthly:
            total_indirect_monthly = sum(float(i.get("amount", 0)) for i in indirect_data)
            fix_monthly = total_indirect_monthly

        factory_overheads = var_monthly * participation if var_monthly else direct_labor * 0.15
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
        for pkg_name in self.req.packaging:
            res = (
                self.db.table("pricing_materials_catalog")
                .select("cost_per_unit")
                .eq("name", pkg_name)
                .eq("category", "Empaque")
                .execute()
            )
            if res.data:
                total += float(res.data[0]["cost_per_unit"])
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

        return PricingResponse(
            unit_price=round(unit_price, 2),
            total_price=round(total_price, 2),
            breakdown=breakdown,
        )

    # ── Helpers ───────────────────────────────────────────────────────
    def _get_material_cost(self, name: str) -> float:
        res = (
            self.db.table("pricing_materials_catalog")
            .select("cost_per_unit, unit_measure")
            .eq("name", name)
            .eq("active", True)
            .execute()
        )
        return float(res.data[0]["cost_per_unit"]) if res.data else 0.0


# ── TubosCalculator ───────────────────────────────────────────────────
class TubosCalculator(BasePricingCalculator):
    """
    Calcula materias primas sumando capas de papel en rollo.
    Área del tubo padre × gramaje de cada capa → kg exactos de papel + pegante.
    """
    def calculate_materials(self) -> dict:
        d = self.req.dimensions
        bom = self.req.bom

        # Área lateral del tubo en mm² → cm²
        diameter_mm = d.diameter_mm or (d.width_mm or 50)
        thickness_mm = d.thickness_mm or 5
        length_mm = d.length_mm or 100

        r_int = diameter_mm / 2
        r_ext = r_int + thickness_mm
        area_cm2 = math.pi * (r_ext**2 - r_int**2) * (length_mm / 10) / 100

        raw_materials = 0.0
        if bom.layers:
            for layer in bom.layers:
                cost_kg = self._get_material_cost(layer.material_name)
                # Gramaje estimado: área × 0.0006 kg/cm² × capas
                kg = area_cm2 * 0.0006 * layer.quantity * self.req.requested_quantity
                raw_materials += kg * cost_kg

            # Pegante
            if bom.glue_name and bom.glue_grams:
                glue_cost_kg = self._get_material_cost(bom.glue_name)
                total_glue_kg = (bom.glue_grams / 1000) * self.req.requested_quantity
                raw_materials += total_glue_kg * glue_cost_kg
            else:
                # Fallback: ~10% del peso total en papel
                total_kg = area_cm2 * 0.0006 * sum(l.quantity for l in bom.layers) * self.req.requested_quantity
                glue_res = self.db.table("pricing_materials_catalog").select("cost_per_unit").eq("category", "Pegante").limit(1).execute()
                glue_cost = float(glue_res.data[0]["cost_per_unit"]) if glue_res.data else 8500
                raw_materials += total_kg * 0.10 * glue_cost

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
