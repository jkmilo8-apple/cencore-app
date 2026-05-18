# Guía de Ejecución Local: Cencore Operations Console & Pricing Service

Esta guía te explicará cómo levantar de manera paralela ambos ecosistemas (Frontend en Next.js y Backend en FastAPI) para que puedas probar el "Motor de Precios Industrial" en tu entorno local.

## Prerrequisitos

Asegúrate de tener instalado en tu sistema:
- **Node.js** (v18 o superior)
- **Python** (v3.10 o superior)
- **Git** (opcional, para control de versiones)

---

## 1. Levantar el Backend (FastAPI)

El backend en Python (FastAPI) es el cerebro encargado de procesar la Matriz de Costos Industriales.

1. **Abre una terminal** (PowerShell o CMD).
2. **Navega a la carpeta del microservicio**:
   ```bash
   cd C:\source\cencore-app\pricing-service
   ```
3. **Crea un entorno virtual** (recomendado para mantener las dependencias aisladas):
   ```bash
   python -m venv venv
   ```
4. **Activa el entorno virtual**:
   - En Windows (PowerShell/CMD):
     ```bash
     .\venv\Scripts\activate
     ```
   - En Mac/Linux (por si acaso):
     ```bash
     source venv/bin/activate
     ```
5. **Instala las dependencias**:
   ```bash
   pip install -r requirements.txt
   ```
6. **Inicia el servidor de FastAPI**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *El flag `--reload` permite que el servidor se reinicie automáticamente si haces cambios en el código Python.*

> [!TIP]
> El backend estará corriendo en `http://localhost:8000`. Puedes ver la documentación interactiva de la API y probar los endpoints directamente visitando `http://localhost:8000/docs` en tu navegador.

---

## 2. Levantar el Frontend (Next.js)

El frontend en Next.js aloja la interfaz de administración y el cotizador rápido.

1. **Abre una SEGUNDA terminal** (mantén la primera del backend corriendo).
2. **Navega a la carpeta raíz del proyecto**:
   ```bash
   cd C:\source\cencore-app
   ```
3. **Instala las dependencias de Node.js**:
   ```bash
   npm install
   ```
   *Solo necesitas hacer esto la primera vez o cuando se añadan nuevas librerías.*
4. **Verifica las Variables de Entorno (`.env.local`)**:
   Asegúrate de tener un archivo `.env.local` en la raíz de `cencore-app` con al menos estas variables para que Next.js sepa dónde buscar a Supabase y al microservicio:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   PRICING_SERVICE_URL=http://localhost:8000
   ```
5. **Inicia el servidor de desarrollo de Next.js**:
   ```bash
   npm run dev
   ```

> [!NOTE]
> El frontend estará corriendo en `http://localhost:3000`. 
> - Puedes visitar `http://localhost:3000/admin/costs` para gestionar la configuración de la matriz.
> - Puedes visitar `http://localhost:3000/admin/cotizador-rapido` para ver el Motor de Precios Industrial en acción.

---

## Resumen del Flujo de Trabajo Local

Siempre que vayas a trabajar en el proyecto de manera local, necesitarás **dos terminales activas**:
- **Terminal 1**: Corriendo `uvicorn main:app --reload` en `/pricing-service`
- **Terminal 2**: Corriendo `npm run dev` en `/cencore-app`

Cualquier cambio que realices en el código se reflejará casi de inmediato gracias al "Hot Reload" de ambos frameworks.


## Inicio de sesion 

- Email: admin@cencore.com
- Contraseña: password123