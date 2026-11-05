# TECH_DEBT.md — Inventario de Deuda Técnica (Frontend)

Este archivo es la **fuente de verdad** para deuda técnica aceptada, advertencias de compilador conocidas y compromisos de refactorización pendientes en `Barberia-Frontend`.

> **Regla para Agentes de IA (ver `AGENTS.md` §10):**
> 1. No resolver deuda que no haya sido solicitada explícitamente en el prompt.
> 2. No eliminar entradas sin autorización ni commit dedicado.
> 3. Si se introduce un compromiso técnico consciente, registrarlo aquí con el siguiente ID disponible.

---

## Entradas Activas

### DEBT-FRONT-001 — Advertencias de Fast Refresh en Contexts de React
- **Severidad:** BAJA
- **Área:** `frontend/context` (`AuthContext.tsx`, `ToastContext.tsx`)
- **Estado:** ACEPTADA
- **Detectada:** 2026-11-01
- **Descripción:** ESLint emite `react-refresh/only-export-components` porque en los mismos archivos de los Contexts se exportan custom hooks (`useAuth`, `useToastContext`).
- **Impacto:** Ninguno en producción. En desarrollo local, la recarga en caliente de React puede recargar el árbol completo de esos contextos en lugar de aplicar reemplazo puntual de componentes.
- **Mitigación propuesta:** Separar los tipos, providers y hooks de consumo en archivos dedicados (`useAuth.ts`, `auth.context.ts`, `AuthProvider.tsx`).
- **Criterio de cierre:** Cero advertencias de `react-refresh` en `src/auth/` y `src/shared/ui/`.

---

### DEBT-FRONT-002 — Tamaño de Chunks en Empaquetado Vite
- **Severidad:** BAJA
- **Área:** `frontend/build`
- **Estado:** ACEPTADA
- **Detectada:** 2026-11-01
- **Descripción:** Vite advierte que el chunk principal (`index-*.js`) supera los 500 kB tras minificación (~780 kB).
- **Impacto:** Ligero incremento en el tiempo de carga inicial en conexiones móviles lentas.
- **Mitigación propuesta:** Configurar `build.rollupOptions.output.manualChunks` en `vite.config.ts` para separar `react`, `react-dom`, `@tanstack/react-query` y librerías de UI en chunks vendor independientes.
- **Criterio de cierre:** Chunks individuales inferiores a 500 kB en `npm run build`.

---

## Formato para Nuevas Entradas

```markdown
### DEBT-FRONT-XXX — <Título corto>
- **Severidad:** BLOQUEANTE | ALTA | MEDIA | BAJA
- **Área:** frontend/<modulo> | ui | routing | build | api
- **Estado:** ABIERTA | EN_PROGRESO | ACEPTADA | RESUELTA
- **Detectada:** YYYY-MM-DD
- **Origen:** commit <hash> | sesión .ai/sessions/<archivo> | humano
- **Descripción:** Qué ocurre y por qué.
- **Impacto:** Consecuencias si no se atiende.
- **Mitigación propuesta:** Pasos para resolverlo.
- **Criterio de cierre:** Cómo se valida la solución.
```

