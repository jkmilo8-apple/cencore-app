from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import PricingRequest, PricingResponse
from engine import PricingEngine, get_supabase

app = FastAPI(
    title="Cencore Pricing Microservice",
    description="Motor de cálculos de costos industriales V2 — BOM + Routing + Logística",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "online", "service": "Cencore Pricing Engine", "version": "2.0.0"}


@app.post("/calculate", response_model=PricingResponse)
async def calculate_pricing(request: PricingRequest):
    try:
        result = await PricingEngine.calculate_pricing(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/catalog/materials")
async def get_materials(category: str = None):
    """Catalogo de materiales para el frontend (papeles, pegantes, accesorios, empaque)."""
    db = get_supabase()
    query = db.table("pricing_materials_catalog").select("*").eq("active", True)
    if category:
        query = query.eq("category", category)
    res = query.order("category").order("name").execute()
    return res.data


@app.get("/catalog/routes")
async def get_routes(product_line: str = None):
    """Rutas de produccion disponibles por linea de producto."""
    db = get_supabase()
    query = db.table("pricing_labor_routes").select("*").eq("active", True)
    if product_line:
        query = query.eq("product_line", product_line)
    res = query.order("product_line").order("process_name").execute()
    return res.data


@app.get("/catalog/logistics")
async def get_logistics():
    """Tipos de camion disponibles para el calculo de fletes."""
    db = get_supabase()
    res = db.table("pricing_logistics").select("*").eq("active", True).execute()
    return res.data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
