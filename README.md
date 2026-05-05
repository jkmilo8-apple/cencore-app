# Cencore Operations Console

Sistema avanzado de gestión logística y cotización industrial para **Cencore SAS**. Esta plataforma permite la gestión de clientes, productos y la generación de cotizaciones multi-ítem con cálculos automáticos basados en reglas comerciales.

## Tecnologías

- **Framework:** Next.js (App Router)
- **Base de Datos & Auth:** Supabase
- **Estilos:** Tailwind CSS 4
- **Diseño:** Estética industrial "Stitch" de alta fidelidad

## Configuración del Entorno

Para ejecutar el proyecto localmente o desplegarlo en producción (Vercel), es necesario configurar las siguientes variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
PRICING_SERVICE_URL=url-del-microservicio-de-precios
```

## Despliegue en Vercel

1. **Conectar Repositorio:** Conecte este repositorio a su proyecto en Vercel.
2. **Variables de Entorno:** Configure las variables mencionadas arriba en la sección "Environment Variables" de Vercel.
3. **Build:** Vercel detectará automáticamente Next.js y ejecutará `npm run build`.

## Seguridad (Supabase)

**IMPORTANTE:** Antes de pasar a producción, asegúrese de:
1. Habilitar **Row Level Security (RLS)** en todas las tablas de Supabase.
2. Configurar las políticas de acceso para restringir la edición de configuraciones comerciales solo a administradores.

## Estructura del Proyecto

- `actions/`: Acciones de servidor para mutaciones de datos.
- `app/admin/`: Panel de administración industrial.
- `components/`: Componentes de interfaz reutilizables.
- `repositories/`: Capa de abstracción de base de datos.
- `services/`: Lógica de negocio y servicios externos.
- `types/`: Definiciones de TypeScript.
