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
    glue_grams: Optional[float] = 0.0                # (Legacy) Gramos de pegante por unidad
    glue_gms: Optional[float] = 0.0                  # Gramaje del pegante en GMS/m² (Ej. PVA = 70)
    glue_layers: Optional[int] = 0                   # Número de capas de pegante (generalmente capas_papel - 1)
    lamina_madre: Optional[str] = None               # Corrugado
    accessories: Optional[List[BOMAccessory]] = None  # Envases


# ── Routing (Ruta de Producción) ─────────────────────────────────────
class RoutingStep(BaseModel):
    step: str                   # 'formar', 'refilar', 'engargolar', 'troquelar'
    speed: float                # unidades / hora
    setup_hours: float = 0.0
    operator_count: int = 1     # Numero de operarios por proceso
    labor_profile: Optional[str] = None  # Nombre del perfil laboral de pricing_labor_profiles


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
    truck_type: str             # 'Chalupa', 'Turbo Grande', 'Camión NPR' or empty for auto-selection
    manual_freight_cost: Optional[float] = None


# ── Empaque con cantidad ──────────────────────────────────────────────
class PackagingItem(BaseModel):
    material_name: str
    quantity: Optional[float] = 1.0


# ── Request principal ─────────────────────────────────────────────────
class PricingRequest(BaseModel):
    product_line: str           # 'Tubos', 'Envases', 'Corrugado'
    requested_quantity: int
    dimensions: Dimensions
    bom: BOM
    routing: List[RoutingStep]
    packaging: Optional[List[PackagingItem]] = None
    logistics: Optional[LogisticsConfig] = None
    margin: Optional[float] = 0.25          # Margen por defecto 25%
    waste_pct: Optional[float] = 0.0        # % Desperdicio Formado
    cabida: Optional[int] = 1               # Cortes por pase de máquina (cabida)
    margen_puntas_mm: Optional[float] = 10.0   # Margen de puntas por defecto
    grosor_cuchilla_corte_mm: Optional[float] = 5.0  # Grosor de cuchilla de corte
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


class IncomeStatement(BaseModel):
    venta_total: float
    costo_materia_prima: float
    utilidad_bruta: float
    gastos_operacionales: float
    carga_fabril_cif: float
    mano_de_obra: float
    utilidad_operacional: float
    impuestos: float
    rentabilidad_neta_ejercicio: float
    porcentaje_rentabilidad: float


class PricingResponse(BaseModel):
    unit_price: float
    total_price: float
    breakdown: PricingBreakdown
    income_statement: IncomeStatement
    currency: str = "COP"
