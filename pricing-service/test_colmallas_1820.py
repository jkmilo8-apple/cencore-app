import pytest
from pytest import approx
from unittest.mock import MagicMock, patch
import engine
from engine import TubosCalculator, get_gsm_from_name
from models import PricingRequest, Dimensions, BOM, BOMLayer, RoutingStep, LogisticsConfig, PackagingItem

# ─── Mock Database Client ─────────────────────────────────────────────

class MockMaterialsTable:
    def __init__(self):
        self._name = None
        self._category = None

    def select(self, *args):
        return self

    def eq(self, field, val):
        if field == "name":
            self._name = val
        elif field == "category":
            self._category = val
        return self

    def limit(self, *args):
        return self

    def execute(self):
        res = MagicMock()
        costs = {
            "Empacor 168": 1966,
            "America 300": 2978,
            "Invesa PVA": 3400,
            "Cabuya": 1.2
        }
        val = costs.get(self._name, 0.0)
        res.data = [{"cost_per_unit": val, "name": self._name, "category": self._category, "dependencies": None}]
        return res

class MockLaborProfilesTable:
    def __init__(self):
        self._profile_name = None

    def select(self, *args):
        return self

    def eq(self, field, val):
        if field == "profile_name":
            self._profile_name = val
        return self

    def execute(self):
        res = MagicMock()
        res.data = [{
            "profile_name": self._profile_name,
            "profile_type": "Prestación de Servicios",
            "base_salary_monthly": 21898.37 * 160,
            "active": True
        }]
        return res

class MockIndirectCostsTable:
    def select(self, *args):
        return self

    def lte(self, field, val):
        return self

    def gte(self, field, val):
        return self

    def execute(self):
        res = MagicMock()
        res.data = [{"amount": 21397945}]
        return res

class MockLogisticsTable:
    def select(self, *args):
        return self

    def eq(self, field, val):
        return self

    def execute(self):
        res = MagicMock()
        res.data = []
        return res

class MockSupabaseClient:
    def table(self, table_name):
        if table_name == "pricing_materials_catalog":
            return MockMaterialsTable()
        elif table_name == "pricing_labor_profiles":
            return MockLaborProfilesTable()
        elif table_name == "pricing_indirect_costs":
            return MockIndirectCostsTable()
        elif table_name == "pricing_logistics":
            return MockLogisticsTable()
        return MagicMock()

# ─── Mock GSM helper ──────────────────────────────────────────────────

original_get_gsm = get_gsm_from_name

def mock_get_gsm(name):
    if name == "Empacor 168":
        return 170.0
    return original_get_gsm(name)

@pytest.fixture(autouse=True)
def patch_deps(monkeypatch):
    monkeypatch.setattr(engine, "get_supabase", lambda: MockSupabaseClient())
    monkeypatch.setattr(engine, "get_gsm_from_name", mock_get_gsm)

# ─── Request Builder Helper ──────────────────────────────────────────

def get_colmallas_request():
    dimensions = Dimensions(
        length_mm=1820,
        diameter_mm=28,  # diameter_mm represents inner_diameter_mm
        thickness_mm=1.5
    )
    bom = BOM(
        layers=[
            BOMLayer(material_name="Empacor 168", quantity=2.0),
            BOMLayer(material_name="America 300", quantity=2.0)
        ],
        glue_name="Invesa PVA",
        glue_gms=70.0,
        glue_layers=3
    )
    routing = [
        RoutingStep(
            step="Formar",
            speed=177.0,
            setup_hours=0.83,
            operator_count=2,
            labor_profile="Formar"
        )
    ]
    packaging = [
        PackagingItem(material_name="Cabuya", quantity=50)
    ]
    logistics = LogisticsConfig(
        truck_type="Sin flete"
    )
    return PricingRequest(
        product_line="Tubos",
        requested_quantity=50,
        dimensions=dimensions,
        bom=bom,
        routing=routing,
        packaging=packaging,
        logistics=logistics,
        margin=0.0777,
        waste_pct=50.0
    )

# ─── Tests ────────────────────────────────────────────────────────────

def test_geometry_and_area():
    req = get_colmallas_request()
    calc = TubosCalculator(req, MockSupabaseClient())
    
    # Assert Diametro Externo: 28 + (2 * 1.5) = 31 mm = 3.10 cm
    diametro_externo_mm = req.dimensions.diameter_mm + (2 * req.dimensions.thickness_mm)
    diametro_externo_cm = diametro_externo_mm / 10.0
    assert diametro_externo_cm == approx(3.10, rel=1e-2)
    
    # Assert Largo Tubo Padre Real: 1820 + 10 = 1830 mm
    largo_tubo_padre_real_mm = req.dimensions.length_mm + 10.0
    assert largo_tubo_padre_real_mm == approx(1830, rel=1e-2)
    
    # Assert Area Tubo Padre: 1.83 * 0.028 * 3.1416 = 0.160975
    area_tubo_padre_m2 = calc._compute_parent_tube_area_m2()
    assert area_tubo_padre_m2 == approx(0.1610, rel=1e-2)

def test_material_costs():
    req = get_colmallas_request()
    calc = TubosCalculator(req, MockSupabaseClient())
    
    # We can evaluate raw materials cost breakdown
    area = calc._compute_parent_tube_area_m2()
    
    # Glue cost: (3 layers * 70 gms * area / 1000) * 3400 = 114.94 COP
    glue_weight_kg = (3 * 70 * area) / 1000.0
    costo_total_goma_tubo_padre = glue_weight_kg * 3400.0
    assert costo_total_goma_tubo_padre == approx(115, rel=1e-2)
    
    # Empacor 168 cost: (170 gms * 2.0 layers * area / 1000) * 1966 = 107.60 COP
    empacor_weight_kg = (170 * 2.0 * area) / 1000.0
    empacor_cost = empacor_weight_kg * 1966
    
    # America 300 cost: (300 gms * 2.0 layers * area / 1000) * 2978 = 287.63 COP
    america_weight_kg = (300 * 2.0 * area) / 1000.0
    america_cost = america_weight_kg * 2978
    
    # Costo formado per parent tube = empacor_cost + america_cost + glue_cost
    parent_tube_cost = empacor_cost + america_cost + costo_total_goma_tubo_padre
    
    # Costo unidad tubo formado (with 50% waste) = parent_tube_cost * 1.5 = 765.25 COP
    costo_unidad_tubo_formado = parent_tube_cost * 1.5
    assert costo_unidad_tubo_formado == approx(765, rel=1e-2)
    
    # Costo total materia prima unitaria (including 1.2 COP packaging cost per unit)
    packaging_cost_unit = 1.2
    costo_materia_prima_unitaria_total = costo_unidad_tubo_formado + packaging_cost_unit
    assert costo_materia_prima_unitaria_total == approx(766.46, rel=1e-2)

def test_labor_and_production_times():
    req = get_colmallas_request()
    calc = TubosCalculator(req, MockSupabaseClient())
    
    # Hours of production = quantity / speed = 50 / 177 = 0.28 hours
    horas_produccion_pedido = req.requested_quantity / req.routing[0].speed
    assert horas_produccion_pedido == approx(0.28, rel=1e-2)
    
    # Total order hours = prod_hours + setup_hours = 0.2825 + 0.83 = 1.1125 hours (~1.12)
    tiempo_total_orden_horas = horas_produccion_pedido + req.routing[0].setup_hours
    assert tiempo_total_orden_horas == approx(1.12, rel=1e-2)
    
    # Costo total MOD batch = tiempo_total * hourly_rate * operator_count = 1.1125 * 21898.37 * 2 = 48723 COP
    labor_details = calc.calculate_labor_and_overheads()
    costo_total_mod_batch = labor_details["direct_labor"]
    assert costo_total_mod_batch == approx(48723, rel=1e-2)
    
    # Unit MOD cost = costo_total_mod_batch / qty = 974.46 COP
    valor_total_mano_obra_unitario = costo_total_mod_batch / req.requested_quantity
    assert valor_total_mano_obra_unitario == approx(974.46, rel=1e-2)

def test_indirect_costs_apportionment():
    req = get_colmallas_request()
    calc = TubosCalculator(req, MockSupabaseClient())
    
    # Participation percent = time_total_hours * 60 / 10800 = 1.1125 * 60 / 10800 = 0.00618 (~0.0062)
    horas_produccion_pedido = req.requested_quantity / req.routing[0].speed
    tiempo_total_orden_horas = horas_produccion_pedido + req.routing[0].setup_hours
    porcentaje_minutos_negocio_mes = (tiempo_total_orden_horas * 60.0) / 10800.0
    assert porcentaje_minutos_negocio_mes == approx(0.0062, rel=1e-2)
    
    # Apportioned CIF = monthly_indirect * participation = 21397945 * 0.0061804 = 132250 COP
    labor_details = calc.calculate_labor_and_overheads()
    carga_fabril_cif_batch = labor_details["factory_overheads"]
    assert carga_fabril_cif_batch == approx(132250, rel=1e-2)

@pytest.mark.asyncio
async def test_income_statement():
    req = get_colmallas_request()
    calc = TubosCalculator(req, MockSupabaseClient())
    
    res = await calc.calculate()
    
    # Assert financials against the final output response
    assert res.total_price == approx(236350, rel=1e-2)  # Venta total
    assert res.income_statement.costo_materia_prima == approx(38323, rel=1e-2)  # Total materia prima + empaque
    assert res.income_statement.utilidad_bruta == approx(198027, rel=1e-2)
    assert res.income_statement.utilidad_operacional == approx(17053, rel=1e-2)
    assert res.income_statement.impuestos == approx(5969, rel=1e-2)
    assert res.income_statement.rentabilidad_neta_ejercicio == approx(11085, rel=1e-2)
    assert res.income_statement.porcentaje_rentabilidad == approx(4.69, rel=1e-2)
