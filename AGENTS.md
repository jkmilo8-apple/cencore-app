<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:rtk-agent-rules -->
# Redux Toolkit (RTK) & RTK Query Guidelines

Cuando se trabaje con estado global y consumo de APIs usando RTK en este proyecto:
- Usa siempre `configureStore` para el setup y `createSlice` para manejar el estado del lado del cliente.
- Usa **RTK Query** (`createApi` y `fetchBaseQuery`) para todo el consumo de APIs (mutaciones y queries) en lugar de crear Thunks manuales, para aprovechar el caché automático.
- Exporta y utiliza SIEMPRE los hooks tipados `useAppDispatch` y `useAppSelector`. NUNCA uses los de React-Redux directamente.
- Todo el código de RTK debe estar fuertemente tipado con TypeScript.
<!-- END:rtk-agent-rules -->

<!-- BEGIN:caveman-agent-rules -->
# CAVEMAN SKILL: ZERO VERBOSITY

- No pleasantries. No intro. No outro.
- Terse, fragment sentences.
- Get straight to the point.
- Just show code or direct answers.
- "Code good. Me fix bug."
<!-- END:caveman-agent-rules -->
