# Plan: Alineación con Mockup Stitch y Corrección de Duplicados

## User Review Required
- **Diseño de Categorías**: Se implementará un selector de "Tipo de Empaque" (Caja, Tubo, Esquinero) como tarjetas visuales, similar al mockup de Stitch. Esto filtrará los productos disponibles.
- **Jerarquía Visual**: Se moverá el resumen económico a una posición más prominente con el estilo "Industrial Premium".

## Open Questions
- ¿Rodrigo Mendoza es el único administrador o debemos obtener el nombre del usuario autenticado? (Por ahora usaré un placeholder estilizado).

## Proposed Changes

### [Acciones de Servidor]

#### [MODIFY] [quotes.ts](file:///c:/source/cencore-app/actions/quotes.ts)
- Corregir la lógica de generación de `quote_number` para usar el conteo real de la base de datos y evitar colisiones.

### [Navegación]

#### [MODIFY] [Sidebar.tsx](file:///c:/source/cencore-app/components/layout/Sidebar.tsx)
- Actualizar enlaces: "Motor de Precios" -> "/admin/products/commercial".
- Eliminar enlace muerto de "Configuración".

### [Pantalla de Nueva Cotización]

#### [MODIFY] [page.tsx](file:///c:/source/cencore-app/app/admin/quotes/new/page.tsx)
- **Header**: Agregar sección de "Consola de Operaciones" y perfil de usuario.
- **Categorías**: Implementar selector de productos por tipo (Caja, Tubo, Esquinero).
- **Layout**: Refinar el grid de dos columnas para que el resumen se vea como un "Manifiesto Industrial".
- **Estilos**: Aplicar sombras suaves (`diffusion shadow`) y bordes de alta precisión según el sistema de diseño de Stitch.

## Verification Plan

### Automated Tests
- `npm run build` para asegurar integridad de tipos.
- Crear una cotización y verificar que el `quote_number` se incremente correctamente.

### Manual Verification
- Verificar visualmente que la pantalla de nueva cotización coincida con el estilo "Vibrant Industrial" solicitado.
