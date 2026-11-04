# AGENTS.md — Reglas para agentes de IA en este repositorio (Frontend)

> **Alcance**: aplica a cualquier agente de IA (Antigravity, Claude Code, GitHub Copilot, Cursor, OpenCode, ChatGPT, Gemini, subagentes invocados por otro agente, etc.) que reciba instrucciones sobre este repositorio (`Barberia-Frontend`).
>
> **Ubicación**: este archivo vive en la raíz del repositorio y se versiona. Cualquier agente que lo ignore no está autorizado a operar aquí.
>
> **Idioma de trabajo**: español. Nombres de componentes, rutas, archivos y comandos: inglés o convención del framework cuando el ecosistema React/Vite lo exige.

---

## 1. Principios no negociables (Human-in-the-Loop)

1. **Nunca** hacer `commit`, `push`, `merge`, `rebase`, `tag`, `release` ni `deploy` de forma automática. Cada uno exige confirmación explícita y por escrito del humano responsable.
2. **Nunca** asumir el rol de autor. El **autor** del commit es siempre el humano; la IA es herramienta de asistencia técnica, no coautora.
3. **Nunca** modificar el autor ni el email de un commit existente.
4. **Nunca** ocultar la intervención de la IA. Todo commit con asistencia de IA declara herramienta, modelo y sesión.
5. **Nunca** operar sobre `main`, `master`, `release/*` ni ramas protegidas sin autorización explícita.
6. **Nunca** reescribir historial publicado (`push --force`, `filter-branch`, `rebase` sobre ramas compartidas).
7. **Nunca** modificar archivos críticos de CI/CD, configuración de bundling o despliegue sin revisión humana (`.github/workflows/`, `vite.config.ts`, `tsconfig*.json`, `.env*`, `package.json`).
8. **Nunca** violar el aislamiento multitenant del frontend: no compartir almacenamiento entre pestañas con slugs diferentes (`sessionStorage` es obligatorio para aislamiento por pestaña), no ignorar la cabecera `X-Negocio-Slug` en Axios y respetar siempre el prefijo de ruta `/:slug`.
9. **Siempre** detenerse si el alcance excede lo acotado en la instrucción original (ver §6).
10. **Nunca** usar `git commit --no-verify` ni `git push --no-verify`.

---

## 2. Flujo obligatorio por tarea

Cada vez que el humano envíe una instrucción que implique **acción** (no solo consulta o explicación), el agente debe seguir este flujo en orden:

### 2.1 Revisar guías, arquitectura y contexto
- Leer `AGENTS.md`, `TECH_DEBT.md` y la documentación relevante en `docs/`.
- Revisar el estado real de Git: `git status`, `git branch --show-current`, `git log -3 --oneline`.
- Entender el patrón arquitectónico del frontend:
  - **Features modulares:** `src/features/<modulo>/` (pages, components, api, types).
  - **Patrón Facade:** custom hooks sobre TanStack Query en `*.facade.ts`.
  - **Capa HTTP:** `apiClient` Axios en `src/shared/lib/http/axios.ts` con interceptores de tenant y token por pestaña.
  - **Identidad visual multitenant:** `TenantBrandContext` y selector de temas (`TenantThemeSelector`).

### 2.2 Auditar antes de actuar
- Leer el **código real**, interfaces TypeScript y componentes existentes antes de modificar.
- Verificar que los archivos mencionados existan y no basarse en suposiciones.
- Identificar impacto: contratos API de backend involucrados, hooks de TanStack Query afectados, rutas en React Router, estilos y accesibilidad.
- Reportar hallazgos al humano **antes** de proponer cambios.

### 2.3 Proponer, no imponer
- Presentar un plan de acción concreto antes de escribir código.
- Si el plan requiere más de 3 archivos no listados o toca áreas sensibles (§6), detenerse y pedir confirmación.
- Esperar confirmación explícita (`"ok"`, `"dale"`, `"procede"`, `"adelante"`) **antes de realizar escrituras**.

### 2.4 Ejecutar acotado
- Modificar únicamente los archivos autorizados para la tarea.
- No reformatear archivos ajenos al cambio.
- No instalar librerías npm ni añadir dependencias sin autorización explícita.
- No romper contratos con el backend ni modificar firmas de endpoints arbitrariamente.

### 2.5 Verificar
- `npm run build` (`tsc -b && vite build`): debe compilar con 0 errores de tipado TypeScript y 0 errores de bundling.
- `npm run lint` (sin `--fix` masivo no solicitado): verificar que no se introduzcan errores nuevos.
- Reportar el resultado de la compilación. Si algo falla, corregir dentro del alcance antes de dar por buena la tarea.

### 2.6 Reportar (ver §5)
- Entregar el reporte estructurado de cierre.
- Esperar confirmación del humano antes de cualquier operación Git.

---

## 3. Commits — formato y atribución

### 3.1 Autor del commit
- **Autor**: siempre el humano responsable.
- La IA **nunca** se configura como autor ni como committer.

### 3.2 Trailers obligatorios (fin del mensaje de commit)
Todo commit con asistencia de IA termina con estos trailers, separados del cuerpo por una línea en blanco:
```git
AI-Assisted-By: <herramienta>
AI-Model: <modelo>
AI-Session: <id-o-fecha-iso-8601>
```

Ejemplo:
```git
feat(negocio): agregar modulo de redes sociales en configuracion

Permite gestionar enlaces de Instagram, WhatsApp, TikTok y Facebook
por sede con persistencia aislada en backend.

AI-Assisted-By: Antigravity
AI-Model: gemini-2.5-pro
AI-Session: 2026-11-03T16:55:00-05:00
```

### 3.3 Prohibiciones explícitas
- **No** usar `Co-authored-by:` para IA.
- **No** atribuir a IA commits realizados 100% por un humano sin asistencia.
- **No** inventar nombres de modelos ni sesiones falsas.

### 3.4 Hooks del repositorio
- `git config --local core.hooksPath .githooks`
- `git config --local commit.template .gitmessage.txt`
- El hook `prepare-commit-msg` inyecta automáticamente los trailers si están exportadas las variables `AI_TOOL`, `AI_MODEL`, `AI_SESSION`.
- El hook `commit-msg` valida que el trailer exista si se detecta asistencia de IA.

---

## 4. Si el prompt es ambiguo

Detenerse y preguntar **antes** de asumir:
- *"agrega este botón"* → ¿dónde? ¿qué acción desencadena? ¿requiere permisos de rol específicos?
- *"cambia los colores"* → ¿aplica al tema actual o a todos los tenants?
- *"conecta el endpoint"* → ¿cuál es el contrato DTO del backend? ¿qué estados de carga/error manejar?

---

## 5. Reporte que el agente entrega al cerrar una tarea

Estructura obligatoria:
1. **Resumen**: qué se implementó en 2-3 líneas.
2. **Archivos tocados**: lista con balance (+líneas / -líneas).
3. **Verificaciones**:
   - `☑ build (tsc -b && vite build)`: 0 errores.
   - `☑ lint`: estado de validación.
4. **Riesgos / Suposiciones**: notas técnicas relevantes.
5. **IA utilizada**:
   - Herramienta: `<Antigravity | OpenCode | Claude Code | Cursor>`
   - Modelo: `<identificador-modelo>`
   - Sesión: `<id-o-timestamp>`
6. **Pendiente de confirmación humana**:
   - `[ ] Commit`
   - `[ ] Push`

---

## 6. Escalado — detenerse y pedir confirmación si:

- El cambio excede **3 archivos** no contemplados en la instrucción original.
- Requiere modificar **contextos globales** (`AuthContext`, `TenantBrandContext`, `ThemeContext`).
- Requiere modificar **interceptores de red** (`axios.ts`), manejo de tokens o lógica multitenant de sesión.
- Requiere **instalar o actualizar paquetes en `package.json`**.
- La compilación falla dos veces consecutivas por causas no triviales.

---

## 7. Comandos prohibidos sin autorización explícita

- `git push` / `git push --force`
- `git reset --hard`
- `git rebase`
- `git commit --amend` (sobre commits ya publicados)
- `npm publish` / `vercel deploy` / `netlify deploy`

---

## 8. Trazabilidad de la sesión (versionado)

Cada tarea completada deja una entrada de bitácora en:
`.ai/sessions/<YYYY-MM-DD>/<HHMM>-<slug>.md`

Contenido:
- Herramienta, modelo y versión.
- Hash de commit resultante (o "sin commit").
- Prompt original del humano.
- Resumen del plan ejecutado.
- Resultado de compilación y pruebas.

---

## 9. Deuda técnica (`TECH_DEBT.md`)

- Consultar [`TECH_DEBT.md`](./TECH_DEBT.md) antes de proponer refactorizaciones o tocar módulos endeudados.
- **No arreglar deuda fuera de alcance** salvo solicitud expresa.
- Si una tarea introduce un compromiso técnico temporal (ej. `any`, fallback provisional), debe registrarse en `TECH_DEBT.md`.

---

**Última actualización**: 2026-11-03  
**Ecosistema**: Barberia SaaS Platform (Frontend)

