from pydantic import BaseModel
from typing import Optional, List, Dict, Any


# ── BOM (Lista de Materiales) ─────────────────────────────────────────
class BOMLayer(BaseModel):
    """Una capa de papel en rollo (para Tubos y Envases)."""
    material_name: str          # Nombre en pricing_materials_catalog
    quantity: float = 1         # Número de capas / vueltas


class BOMAccessory(BaseModel):
    """Accesorios por unidad (tapas, fondos, etiquetas)."""
    material_name: str
    quantity: float = 1         # Unidades por producto terminado


class BOM(BaseModel):
    layers: Optional[List[BOMLayer]] = None          # Tubos / Envases
    glue_name: Optional[str] = None                  # Nombre del pegante
    glue_grams: Optional[float] = 0.0                # Gramos de pegante por unidad
    lamina_madre: Optional[str] = None               # Corrugado
    accessories: Optional[List[BOMAccessory]] = None  # Envases


# ── Routing (Ruta de Producción) ─────────────────────────────────────
class RoutingStep(BaseModel):
    step: str                   # 'formar', 'refilar', 'engargolar', 'troquelar'
    speed: float                # unidades / hora
    setup_hours: float = 0.0
    operator_count: int = 1     # Numero de operarios por proceso


# ── Dimensiones ───────────────────────────────────────────────────────
class Dimensions(BaseModel):
    length_mm: Optional[float] = None
    width_mm: Optional[float] = None
    height_mm: Optional[float] = None
    diameter_mm: Optional[float] = None
    thickness_mm: Optional[float] = None
    wing_1_mm: Optional[float] = None
    wing_2_mm: Optional[float] = None


# ── Logística ─────────────────────────────────────────────────────────
class LogisticsConfig(BaseModel):
    truck_type: str             # 'Chalupa', 'Turbo Grande', 'Camión NPR'


# ── Request principal ─────────────────────────────────────────────────
class PricingRequest(BaseModel):
    product_line: str           # 'Tubos', 'Envases', 'Corrugado'
    requested_quantity: int
    dimensions: Dimensions
    bom: BOM
    routing: List[RoutingStep]
    packaging: Optional[List[str]] = None   # Nombres de empaques seleccionados
    logistics: Optional[LogisticsConfig] = None
    margin: Optional[float] = 0.25          # Margen por defecto 25%
    quote_date: Optional[str] = None


# ── Response ──────────────────────────────────────────────────────────
class PricingBreakdown(BaseModel):
    raw_materials: float         # Materias primas (papeles, pegante)
    accessories_cost: float      # Tapas, fondos, etiquetas
    direct_labor: float          # MOD (mano de obra directa)
    factory_overheads: float     # CIF proporcional al tiempo
    indirect_costs: float        # NIF (costos fijos)
    packaging_cost: float        # Empaque y despacho
    freight_cost: float          # Flete
    total_production_cost: float
    margin_amount: float
    production_hours: float
    capacity_used_pct: float     # % del camión utilizado


class PricingResponse(BaseModel):
    unit_price: float
    total_price: float
    breakdown: PricingBreakdown
    currency: str = "COP"
