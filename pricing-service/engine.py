import os
from supabase import create_client, Client
from dotenv import load_dotenv
from models import PricingRequest, PricingResponse, PricingBreakdown

load_dotenv()

class PricingEngine:
    # Supabase Client
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )

    FACTORY_OVERHEAD_RATE_DEFAULT = 0.15
    DEFAULT_MARGIN = 0.25

    @classmethod
    async def calculate_pricing(cls, request: PricingRequest) -> PricingResponse:
        # 0. Cargar Configuración desde Supabase
        config = await cls._fetch_full_config(request)
        
        # 1. Materias Primas con factor de desperdicio
        material_cost_per_kg = config["material_cost"]
        weight = cls._calculate_weight(request)
        total_raw_materials = weight * material_cost_per_kg * request.quantity * config["ref"]["waste_factor"]
        
        # 2. Mano de Obra Directa (MOD) + Tiempo de Alistamiento
        hourly_rate = config["labor_rate"]
        units_per_hour = config["product_config"]["machine_speed"]
        production_hours = request.quantity / units_per_hour
        total_hours = (production_hours + config["ref"]["setup_time"]) * config["ref"]["labor_multiplier"]
        total_labor = total_hours * hourly_rate
        
        # 3. Cargas Fabriles (CIF)
        overhead_rate = config["product_config"].get("overhead_rate", cls.FACTORY_OVERHEAD_RATE_DEFAULT)
        total_overheads = total_labor * overhead_rate
        
        # 4. Costos Indirectos (NIF) por rango de fechas y participación
        ind = config["indirect"]
        monthly_total_indirect = (
            ind.get("rent", 0) + 
            ind.get("utilities", 0) + 
            ind.get("administration", 0) + 
            ind.get("maintenance", 0) + 
            ind.get("payroll", 0) + 
            ind.get("others", 0)
        )
        
        # Porcentaje de participación temporal (basado en 160h laborales al mes)
        participation_percentage = (total_hours / 160.0) * 100
        total_indirect = monthly_total_indirect * (participation_percentage / 100)
        
        # Costo Total de Producción
        total_cost = total_raw_materials + total_labor + total_overheads + total_indirect
        
        # Margen y Precio Final
        margin_amount = total_cost * cls.DEFAULT_MARGIN
        total_price = total_cost + margin_amount
        unit_price = total_price / request.quantity if request.quantity > 0 else 0
        
        breakdown = PricingBreakdown(
            raw_materials=round(total_raw_materials, 2),
            direct_labor=round(total_labor, 2),
            factory_overheads=round(total_overheads, 2),
            indirect_costs=round(total_indirect, 2),
            participation_percentage=round(participation_percentage, 4),
            total_cost=round(total_cost, 2),
            margin_amount=round(margin_amount, 2)
        )
        
        return PricingResponse(
            unit_price=round(unit_price, 2),
            total_price=round(total_price, 2),
            breakdown=breakdown
        )

    @classmethod
    async def _fetch_full_config(cls, request: PricingRequest) -> dict:
        """Centraliza la obtención de datos de configuración de Supabase."""
        # 1. Labor Rate
        labor_res = cls.supabase.table("pricing_labor_rates").select("hourly_rate").eq("category", request.category).execute()
        labor_rate = labor_res.data[0]["hourly_rate"] if labor_res.data else 10000.0

        # 2. Material Cost
        mat_res = cls.supabase.table("pricing_material_costs").select("cost_per_kg").eq("material_name", request.material.lower()).execute()
        mat_cost = mat_res.data[0]["cost_per_kg"] if mat_res.data else 2000.0

        # 3. Product Config (Speed, Overhead)
        prod_res = cls.supabase.table("pricing_product_configs").select("*").eq("category", request.category).execute()
        prod_config = prod_res.data[0] if prod_res.data else {"machine_speed": 50, "overhead_rate": 0.15}

        # 4. Indirect Costs (NIF/CIF)
        date_query = request.quote_date or "2024-01-01"
        ind_res = cls.supabase.table("pricing_indirect_costs")\
            .select("*")\
            .lte("start_date", date_query)\
            .gte("end_date", date_query)\
            .execute()
        indirect = ind_res.data[0] if ind_res.data else {
            "rent": 5000000, "utilities": 1500000, 
            "administration": 0, "maintenance": 0, 
            "payroll": 0, "others": 0
        }

        # 5. References
        ref_id = request.reference_id or "DEFAULT"
        ref_res = cls.supabase.table("pricing_references").select("*").eq("reference_id", ref_id).execute()
        ref = ref_res.data[0] if ref_res.data else {"labor_multiplier": 1.0, "waste_factor": 1.0, "setup_time": 0.0}

        return {
            "labor_rate": labor_rate,
            "material_cost": mat_cost,
            "product_config": prod_config,
            "indirect": indirect,
            "ref": ref
        }

    @classmethod
    def _calculate_weight(cls, request: PricingRequest) -> float:
        """Calculates unit weight in kg based on dimensions and category."""
        d = request.dimensions
        if request.category == "Tubos":
            r_int = (d.diameter or 0) / 2
            r_ext = r_int + (d.thickness or 0)
            area = 3.14159 * (r_ext**2 - r_int**2)
            volume_cm3 = area * (d.length or 0)
            return (volume_cm3 * 0.0006)
            
        elif request.category == "Esquineros":
            surface = ((d.wing_1 or 0) + (d.wing_2 or 0)) * (d.length or 0)
            volume_cm3 = surface * (d.thickness or 1)
            return (volume_cm3 * 0.0006)
            
        elif request.category == "Cajas":
            surface = 2 * ((d.length or 0)*(d.width or 0) + 
                           (d.length or 0)*(d.height or 0) + 
                           (d.width or 0)*(d.height or 0))
            return (surface * 0.5 * 0.0006)
            
        elif request.category == "Laminas":
            surface = (d.length or 0) * (d.width or 0)
            return (surface * 0.1 * 0.0006)

        elif request.category == "Single face":
            return (d.length or 0) * (d.width or 0) * 0.0004
            
        return 0.5
