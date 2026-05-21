# Cencore Operations Console - Memory Bank

> Este documento centraliza toda la información técnica y de negocio sobre la plataforma de Cencore SAS. Sirve como fuente de verdad para desarrollo, onboarding y contexto de IA (NotebookLM). Última actualización: 2026-05-18.

---

## 1. Visión General del Producto

El **Cencore Operations Console** es un sistema avanzado de gestión logística y cotización industrial para Cencore SAS (empaques industriales en cartón: tubos, esquineros, cajas, láminas, single face). Su propósito es permitir a los administradores gestionar clientes, catálogo de productos y generar cotizaciones multi-ítem con cálculos de costos automáticos basados en reglas industriales precisas.

El flujo de cotización completo incluye: configuración de ítems en el **Planificador de Producción** → cálculo de precio por el motor FastAPI → acumulación de ítems → generación de cotización → envío al cliente vía n8n → gestión de estados del ciclo de vida.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend & Fullstack | Next.js 16 (App Router, Server Actions, TypeScript) |
| Base de Datos & Auth | Supabase (PostgreSQL + Row Level Security) |
| Estilos | Tailwind CSS 4 |
| Motor de Precios | FastAPI (Python) — microservicio separado en `pricing-service/` |
| Automatización / Email | n8n Cloud (`jkmilo8.app.n8n.cloud`) via webhook |
| Deploy local | `npm run dev` (Next.js) + `uvicorn main:app --reload --port 8000` (FastAPI) |

---

## 3. Variables de Entorno (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xmvptbvowbxvsjomsaor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable_key>
PRICING_SERVICE_URL=http://localhost:8000
# URL del webhook de producción en n8n (no usar la URL del editor /workflow/...)
N8N_WEBHOOK_URL=https://jkmilo8.app.n8n.cloud/webhook/cencore-quotes
```

> La URL correcta del webhook tiene prefijo `/webhook/`, NO `/workflow/` (que es el editor) ni `/webhook-test/` (que es solo para pruebas manuales con el workflow abierto).

---

## 4. Arquitectura de Archivos

```
cencore-app/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          ← Layout con Sidebar + Header (ambos con clase no-print)
│   │   ├── page.tsx            ← Dashboard principal
│   │   ├── quotes/
│   │   │   ├── page.tsx        ← Lista de cotizaciones con filtros, acciones y estados
│   │   │   ├── new/page.tsx    ← Formulario nuevo cotización + PricingCalculator
│   │   │   └── [id]/page.tsx   ← Detalle de cotización (client component) con print/send/delete
│   │   ├── clients/page.tsx    ← CRUD de clientes
│   │   ├── products/page.tsx   ← Catálogo visual de productos con fotos
│   │   ├── costs/page.tsx      ← Gestión admin de papeles, pegantes, procesos
│   │   └── settings/pricing/   ← Configuración de márgenes
├── actions/
│   ├── quotes.ts               ← getQuotes, createQuoteAction, updateQuoteStatusAction,
│   │                              deleteQuoteAction, sendQuoteToClientAction, calculatePricingAction
│   ├── clients.ts              ← CRUD de clientes
│   ├── products.ts             ← CRUD de productos
│   ├── pricing_config.ts       ← Gestión de papeles, pegantes, costos indirectos
│   └── storage.ts              ← uploadProductImage (Supabase Storage)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         ← Navegación lateral (clase no-print para impresión)
│   │   └── Header.tsx          ← Barra superior (clase no-print para impresión)
│   └── PricingCalculator.tsx   ← Planificador de producción (todos los botones con type="button")
├── pricing-service/            ← Microservicio FastAPI (Python)
│   ├── main.py                 ← Endpoints /calculate
│   └── engine.py               ← Motor de precios industrial
└── types/
    └── database.ts             ← Tipos TypeScript generados de Supabase
```

---

## 5. Modelos de Datos (Supabase Schema)

### Entidades Principales

| Tabla | Campos clave |
|---|---|
| `clients` | id, name, contact_name, email, phone, address, city, nit |
| `products` | id, name, description, category, image_url, status |
| `quotes` | id, quote_number, client_id, status, total_amount, urgent_delivery, valid_until, notes |
| `quote_items` | id, quote_id, product_id, quantity, unit_price, total_price, configuration (JSONB) |

> **Nota importante:** El módulo de `products` fue refactorizado a catálogo visual de referencia. NO contiene stock ni precio base — el precio se calcula siempre por el motor FastAPI. El campo `configuration` en `quote_items` almacena el JSONB de la receta industrial (dimensiones, papeles, pegante).

### Entidades de Configuración de Precios

| Tabla                       | Descripción                                                                                                                                                          |
| -----------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `pricing_labor_profiles`    | Perfiles laborales dinámicos con salario base mensual, recargos/factores parafiscales (EPS, Pensión, ARL, Cesantías, Prima, Vacaciones, CCF) y auxilio de transporte |
| `pricing_materials_catalog` | Catálogo centralizado de materiales e insumos (Papel, Corrugado, Pegante, Accesorio, Empaque) con columna `dependencies` (JSONB) para enlazar insumos dependientes   |
| `pricing_labor_routes`      | Velocidades nominales (unidades/hora) y tiempos de alistamiento (setup_hours) por proceso de fabricación                                                             |
| `pricing_logistics`         | Flota de vehículos de despacho con volumen útil en m³ y costo de flete asociado                                                                                      |
| `pricing_indirect_costs`    | Costos fijos y variables mensuales (vigentes por rango de fechas) para cálculo de tasa NIF / CIF variable                                                            |
| `pricing_labor_provisions`  | (Legacy) Provisiones de nómina estáticas usadas como fallback                                                                                                        |

---

## 6. Motor de Precios (FastAPI — `engine.py`)

El motor de precios de Cencore implementa la arquitectura **V2 con Estado de Resultados Proyectado**, soportando las siguientes reglas de negocio:

### 1. Liquidación Laboral Dinámica (MOD)

El costo de mano de obra directa para cada operación del ruteo se liquida dinámicamente según el perfil laboral seleccionado:

- **Costo Mensual**: $S_{mensual} = \text{base\_salary} \times (1 + \sum \text{parafiscales\_pct}) + \text{transport\_subsidy}$
- **Valor Hora**: $\text{rate\_hr} = S_{mensual} / 160$
- **MOD Step**: $\text{step\_hours} \times \text{rate\_hr} \times \text{operator\_count}$

### 2. Desperdicio / Refile Condicional

Para `Tubos` y `Envases`, se añade un factor de desperdicio (`waste_pct`) configurable por el usuario. Multiplica directamente el costo final de las materias primas (papel y pegante):

- $\text{Costo Papeles y Pegantes} \times (1 + \text{waste\_pct} / 100)$

### 3. Cubicación Volumétrica de Empaques (Cajas)

Si el insumo de empaque secundario contiene dimensiones en su nombre (ej: `Caja 420x420x600`), el motor calcula automáticamente la cantidad requerida para `Tubos` y `Envases`:

- $V_{tubo} = \pi \times (\frac{\text{diámetro\_ext}}{2})^2 \times \text{largo}$
- $V_{caja} = \text{largo} \times \text{ancho} \times \text{alto}$
- $\text{unidades\_por\_caja} = \lfloor V_{caja} / V_{tubo} \rfloor$
- $\text{cajas\_totales} = \lceil \text{cantidad\_solicitada} / \text{unidades\_por\_caja} \rceil$

### 4. Dependencias Automáticas de Insumos

Si un insumo seleccionado en empaque (ej: `Zuncho`) tiene dependencias configuradas en la base de datos (ej: `[{"material_name": "Grapas para Zuncho", "quantity_ratio": 1.0}]`), el motor de precios carga y totaliza automáticamente el costo del insumo dependiente.

### 5. Selección de Vehículo Óptimo con Tolerancia

Al calcular el flete, el motor añade una tolerancia de $10\text{mm}$ al largo y al diámetro exterior de los tubos/envases antes de estimar el volumen de despacho total. Asigna automáticamente el camión más económico donde quepa la carga; si sobrepasa el vehículo más grande, calcula múltiplos del mismo.

### 6. Estructura del Estado de Resultados (Income Statement)

El motor de precios retorna un objeto estructurado con las siguientes relaciones matemáticas exactas:

- **Venta Total** = Precio de venta final cotizado (con el margen deseado)
- **Costo Materia Prima** = Materias primas directas + Accesorios + Insumos de Empaque
- **Utilidad Bruta** = Venta Total - Costo Materia Prima
- **Gastos Operacionales** = Costos Indirectos (NIF) + Fletes de Despacho
- **Carga Fabril CIF** = Costos Indirectos Variables (CIF)
- **Mano de Obra** = Costo de Mano de Obra Directa (MOD) liquidada
- **Utilidad Operacional (EBIT)** = Utilidad Bruta - Gastos Operacionales - Carga Fabril CIF - Mano de Obra
- **Impuesto de Renta** = Utilidad Operacional × 35% (si la utilidad es positiva, de lo contrario 0)
- **Rentabilidad Neta del Ejercicio** = Utilidad Operacional - Impuesto de Renta
- **Porcentaje de Rentabilidad** = (Rentabilidad Neta / Venta Total) × 100

---

## 7. Flujo de Cotización (End-to-End)

```
1. [Nueva Cotización]
   └── Seleccionar cliente
   └── Configurar ítem en PricingCalculator (categoría, dimensiones, receta)
       └── Botón "Calcular" (type="button") → POST /calculate al FastAPI
       └── Botón "Añadir Ítem" (type="button") → acumula en lista
   └── Repetir para más ítems
   └── Botón "Generar Cotización" → createQuoteAction() → Supabase

2. [Lista Cotizaciones /admin/quotes]
   └── Filtrar por estado, fecha, búsqueda
   └── Cambiar estado desde dropdown inline
   └── Botón 🗑 Eliminar (solo borradores)
   └── Botón ✉ Enviar (llama sendQuoteToClientAction → n8n webhook)
   └── Botón 👁 Ver detalle

3. [Detalle Cotización /admin/quotes/[id]]
   └── Badge de estado con ícono
   └── Información completa del cliente e ítems
   └── Botón "Imprimir / PDF" → window.print() con CSS @media print
   └── Botón "Enviar al Cliente" → n8n webhook → status cambia a "sent"
   └── Botón "Eliminar" (solo si status = draft)
```

---

## 8. Ciclo de Vida de Cotizaciones (Status Flow)

```
draft ──→ sent ──→ approved
               └──→ rejected
```

| Estado | Descripción | Acciones disponibles |
|---|---|---|
| `draft` | Borrador editable | Enviar, Eliminar, Imprimir |
| `sent` | Enviada al cliente vía n8n | Cambiar estado manualmente |
| `review` | En revisión por el cliente | Cambiar estado manualmente |
| `approved` | Aprobada | — |
| `rejected` | Rechazada | — |

> Solo las cotizaciones en estado `draft` pueden eliminarse. `deleteQuoteAction` verifica el estado antes de borrar los `quote_items` (FK) y luego el `quotes`.

---

## 9. Integración n8n (Envío de Email)

### Workflow activo en n8n Cloud

- **URL workflow editor:** `https://jkmilo8.app.n8n.cloud/workflow/VIYwruF8YaXtFPmO`
- **Webhook production URL:** `https://jkmilo8.app.n8n.cloud/webhook/cencore-quotes`
- **Nodos:** `Webhook (POST)` → `Send an Email` *(el nodo "Respond to Webhook" debe eliminarse o estar conectado al final)*

### Payload enviado al webhook

```json
{
  "quote_number": "QT-2026-001",
  "client": {
    "name": "Empresa SAS",
    "email": "contacto@empresa.com",
    "contact_name": "Juan Reyes",
    "phone": "3202701682",
    "city": "Bogotá"
  },
  "items": [
    {
      "product": "Caja Corrugada Single Wall B-Flute",
      "quantity": 200,
      "unit_price": 8500,
      "total_price": 1700000
    }
  ],
  "subtotal": 1700000,
  "tax": 323000,
  "total": 2023000,
  "valid_until": "2026-06-02",
  "urgent_delivery": false,
  "notes": "...",
  "created_at": "2026-05-18T..."
}
```

### Comportamiento del código

- Si n8n responde `200 OK` → cotización marcada como `sent` ✓
- Si n8n retorna error `"Unused Respond to Webhook"` → se trata como éxito igual (el email SÍ se envía, es un warning de configuración de n8n)
- Si error real de red → toast rojo con mensaje descriptivo

### Probar el webhook manualmente (PowerShell)

```powershell
$body = @{ quote_number = "QT-TEST"; client = @{ email = "jkmilo8@gmail.com"; name = "Test" }; total = 100000 } | ConvertTo-Json
Invoke-RestMethod -Uri "https://jkmilo8.app.n8n.cloud/webhook/cencore-quotes" -Method POST -ContentType "application/json" -Body $body
```

---

## 10. Impresión / PDF

Se usa `window.print()` nativo del browser desde el botón "Imprimir / PDF" en el detalle de cotización.

### CSS `@media print` en `globals.css`

- Clase `.no-print` → `display: none !important` (oculta sidebar, header, botones de acción)
- Clase `.print-only` → `display: flex !important` (muestra encabezado corporativo solo en impresión)
- `@page { size: A4; margin: 1.5cm; }`
- `-webkit-print-color-adjust: exact` para colores corporativos

### Componentes con clase `no-print`

- `components/layout/Sidebar.tsx` → div raíz
- `app/admin/layout.tsx` → wrapper de `<Sidebar>` y `<Header>`
- `app/admin/quotes/[id]/page.tsx` → div de botones de acción

---

## 11. Módulo de Productos (Catálogo Visual)

El módulo `/admin/products` es un **catálogo de referencia visual**, no un inventario con precios. Características:

- Muestra foto del producto (subida a Supabase Storage o URL externa)
- Categorías: `Tubos`, `Esquineros`, `Cajas`, `Láminas`, `Single Face`
- Estado: `activo` / `inactivo`
- **NO tiene**: stock, precio base, SKU (el precio siempre lo genera el motor FastAPI)
- Banner informativo explica que para cotizar hay que ir a **Cotizaciones → Nueva Cotización → Planificador de Producción**

---

## 12. Bugs Corregidos e Historial de Cambios

| Hito / Bug | Causa / Requerimiento | Fix / Implementación |
|---|---|---|
| Al añadir ítem, redirigía a cotización generada | Botones sin `type="button"` dentro de `<form>` | Añadido `type="button"` a "Calcular", "Añadir Ítem" y todos los botones de selección de papeles en `PricingCalculator.tsx` |
| Sidebar aparecía en impresión | Div del Sidebar no tenía clase `no-print` | Añadida clase `no-print` al div raíz de `Sidebar.tsx` y wrappers en `layout.tsx` |
| Error n8n `Cannot POST /workflow/...` | URL del editor usada en lugar de URL del webhook | Corregido: usar `/webhook/cencore-quotes` no `/workflow/VIYwruF8YaXtFPmO` |
| Error n8n `Unused Respond to Webhook` | Nodo desconectado en workflow | Manejado en código como warning no-fatal; el email se envía igual |
| **Actualización Precios V2 e Income Statement** | Implementar las 10 reglas de negocio exactas de Cencore (MOD dinámico, desperdicio, flete con tolerancia, cubicación de cajas, dependencias de empaque y Estado de Resultados) | Modificado microservicio FastAPI (`engine.py`, `models.py`) y frontend Next.js (`PricingCalculator.tsx`, `pricing_config.ts`). Migrado el esquema en Supabase vía MCP. |

---

## 13. Credenciales y Accesos (Desarrollo)

| Servicio | Detalle |
|---|---|
| Supabase proyecto | `xmvptbvowbxvsjomsaor` |
| n8n Cloud | `jkmilo8.app.n8n.cloud` |
| FastAPI local | `http://localhost:8000` |
| Next.js local | `http://localhost:3000` |
| Usuario de prueba | `admin@cencore.com` / `password123` |

---

## 14. Próximos Pasos Sugeridos

- [ ] Adjuntar PDF de la cotización al email enviado por n8n (requiere generación server-side con `puppeteer` o ruta API `/api/quotes/[id]/pdf`)
- [ ] Persistir configuración JSONB completa del PricingCalculator en `quote_items.configuration` para reproducir el desglose de costos en el detalle
- [ ] Implementar firma/aceptación digital por parte del cliente (link de aprobación en el email)
- [ ] Dashboard de métricas: cotizaciones por estado, tasa de aprobación, valor promedio
