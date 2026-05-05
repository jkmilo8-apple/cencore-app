from fastapi import FastAPI, HTTPException
from models import PricingRequest, PricingResponse
from engine import PricingEngine

app = FastAPI(
    title="Cencore Pricing Microservice",
    description="Motor de cálculos de costos industriales para Cencore SAS",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"status": "online", "service": "Cencore Pricing Engine"}

@app.post("/calculate", response_model=PricingResponse)
async def calculate_pricing(request: PricingRequest):
    try:
        result = await PricingEngine.calculate_pricing(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
