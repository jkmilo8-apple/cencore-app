from pydantic import BaseModel
from typing import Optional, Dict

class Dimensions(BaseModel):
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    diameter: Optional[float] = None
    thickness: Optional[float] = None
    wing_1: Optional[float] = None
    wing_2: Optional[float] = None

class PricingRequest(BaseModel):
    category: str  # "Tubos", "Esquineros", "Cajas", "Envases"
    material: str
    dimensions: Dimensions
    quantity: int
    reference_id: Optional[str] = None  # Para las 4 referencias de Envases Tradicional
    quote_date: Optional[str] = None   # YYYY-MM-DD para vigencia de costos NIF/CIF
    machine_id: Optional[str] = None   # Máquina específica

class PricingBreakdown(BaseModel):
    raw_materials: float
    direct_labor: float
    factory_overheads: float  # CIF
    indirect_costs: float     # NIF (Arriendos, etc)
    participation_percentage: float # % de participación temporal
    total_cost: float
    margin_amount: float

class PricingResponse(BaseModel):
    unit_price: float
    total_price: float
    breakdown: PricingBreakdown
    currency: str = "COP"
