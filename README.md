# CENCORE Operations Console

Sistema de gestión industrial para logística de precisión, especializado en empaque estructural.

## Características
- **Gestión de Clientes**: CRUD completo de base de datos de clientes.
- **Catálogo de Productos**: Gestión de inventario y especificaciones técnicas.
- **Motor de Cotización**: Generación de cotizaciones multi-producto con cálculos automáticos en COP.
- **Configuración Comercial**: Reglas de negocio dinámicas para recargos y descuentos.

## Requisitos
- Node.js 18+
- Supabase Project (PostgreSQL + Auth + Storage)
- PRICING_SERVICE (FastAPI microservice)

## Despliegue en Vercel
1. Clonar el repositorio.
2. Configurar variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PRICING_SERVICE_URL`
3. Ejecutar `npm run build`.

## Stack Tecnológico
- **Frontend**: Next.js 16 (App Router)
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: Supabase
- **Icons**: Lucide React
