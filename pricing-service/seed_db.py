import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../.env.local")

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("No Supabase URL or Key found.")
    exit(1)

supabase: Client = create_client(url, key)

materials = [
    {"name": "America 300", "category": "Papel", "unit_measure": "kg", "cost_per_unit": 2991, "active": True},
    {"name": "Empacor 168", "category": "Papel", "unit_measure": "kg", "cost_per_unit": 2134, "active": True},
    {"name": "Kraft", "category": "Papel", "unit_measure": "kg", "cost_per_unit": 2500, "active": True},
    {"name": "Foil", "category": "Papel", "unit_measure": "kg", "cost_per_unit": 4000, "active": True},
    
    {"name": "Lámina Madre 131,5 cm x 111,5 cm", "category": "Corrugado", "unit_measure": "unidad", "cost_per_unit": 1500, "active": True},
    
    {"name": "Invesa PVA", "category": "Pegante", "unit_measure": "kg", "cost_per_unit": 3570, "active": True},
    {"name": "Dextrina", "category": "Pegante", "unit_measure": "kg", "cost_per_unit": 2500, "active": True},
    
    {"name": "Fondo Metálico/Plástico", "category": "Accesorio", "unit_measure": "unidad", "cost_per_unit": 500, "active": True},
    {"name": "Tapas", "category": "Accesorio", "unit_measure": "unidad", "cost_per_unit": 527, "active": True},
    
    {"name": "Zuncho", "category": "Empaque", "unit_measure": "unidad", "cost_per_unit": 200, "active": True},
    {"name": "Cabuya", "category": "Empaque", "unit_measure": "unidad", "cost_per_unit": 100, "active": True},
    {"name": "Stretch Film", "category": "Empaque", "unit_measure": "rollo", "cost_per_unit": 15000, "active": True},
    {"name": "Cajas Corrugadas", "category": "Empaque", "unit_measure": "unidad", "cost_per_unit": 2000, "active": True},
    {"name": "Cinta Adhesiva", "category": "Empaque", "unit_measure": "unidad", "cost_per_unit": 3000, "active": True},
]

routes = [
    # Tubos/Envases (We'll add for both since they share "Formar")
    {"product_line": "Tubos", "process_name": "Formar", "nominal_speed_hr": 1019, "setup_hours": 0.58, "operator_count": 1, "active": True},
    {"product_line": "Envases", "process_name": "Formar", "nominal_speed_hr": 1019, "setup_hours": 0.58, "operator_count": 1, "active": True},
    
    # Envases specifics
    {"product_line": "Envases", "process_name": "Engargolar", "nominal_speed_hr": 128, "setup_hours": 1.0, "operator_count": 1, "active": True},
    {"product_line": "Envases", "process_name": "Etiquetar", "nominal_speed_hr": 500, "setup_hours": 0.5, "operator_count": 1, "active": True},
    {"product_line": "Envases", "process_name": "Poner Círculos", "nominal_speed_hr": 600, "setup_hours": 0.5, "operator_count": 1, "active": True},
    
    # Corrugados
    {"product_line": "Corrugado", "process_name": "Troquelar", "nominal_speed_hr": 180, "setup_hours": 1.0, "operator_count": 1, "active": True},
]

def seed():
    # Insert materials
    print("Inserting materials...")
    for item in materials:
        # Check if exists to avoid duplicates
        existing = supabase.table("pricing_materials_catalog").select("*").eq("name", item["name"]).eq("category", item["category"]).execute()
        if not existing.data:
            supabase.table("pricing_materials_catalog").insert(item).execute()
            print(f"Inserted material: {item['name']}")
        else:
            print(f"Material {item['name']} already exists.")
            
    print("Inserting routes...")
    for item in routes:
        existing = supabase.table("pricing_labor_routes").select("*").eq("product_line", item["product_line"]).eq("process_name", item["process_name"]).execute()
        if not existing.data:
            supabase.table("pricing_labor_routes").insert(item).execute()
            print(f"Inserted route: {item['product_line']} - {item['process_name']}")
        else:
            print(f"Route {item['product_line']} - {item['process_name']} already exists.")

if __name__ == "__main__":
    seed()
