# Barbería VIP SaaS — Frontend Web App (Portal & Dashboard Multitenant)

> **Especificación de Arquitectura de Software Frontend bajo estándar Arc42 e IEEE 1063**  
> **Versión:** `2.0.0` · **Estado:** `Producción / Railway` · **Build:** `Vite 8 Clean (1.6s)`

[![React](https://img.shields.io/badge/Framework-React%2019-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646cff?logo=vite)](https://vitejs.dev/)
[![React Query](https://img.shields.io/badge/State-TanStack_Query_5-ff4154?logo=reactquery)](https://tanstack.com/query)
[![Bootstrap](https://img.shields.io/badge/UI_Base-Bootstrap_5.3%20+%20CSS_Tokens-7952b3?logo=bootstrap)](https://getbootstrap.com/)
[![Lucide](https://img.shields.io/badge/Icons-Lucide_React-f59e0b)](https://lucide.dev/)

---

## 1. Introducción y Objetivos de Experiencia de Usuario (Arc42 §1)

El frontend de **Barbería VIP SaaS** es una Single Page Application (SPA) moderna, responsiva y altamente modular diseñada para operar simultáneamente como **portal público de agendamiento para clientes finales** y como **panel de control administrativo (*Dashboard*) para dueños de sede, administradores y barberos**.

### 1.1 Metas de Experiencia de Usuario (UX Goals)
1. **Resolución Multitenant Transparente:** La aplicación deduce automáticamente la sede activa a través del subdominio (`barberia-demo-2.tudominio.com`) o la ruta base (`/:slug`), sin requerir selección manual por parte del cliente.
2. **Sistema de Theming Reactivo en Vivo:** Soporta 7 personalidades estéticas de marca configurables por barbería (`data-tenant-theme`), con soporte dual para **Modo Claro** y **Modo Oscuro** cumpliendo con los estándares de contraste accesible WCAG AA.
3. **Agendamiento sin Fricción (Mobile-First):** Flujo de reserva optimizado en 4 pasos táctiles con tiempos de carga inferiores a 2 segundos y confirmación digital sin contraseñas obligatorias.
4. **Controles de UI Nativos y Desacoplados:** Componentes interactivos como switches de visibilidad (`.redes-switch`), modales de confirmación (`ConfirmDialog`) y selectores de plataforma vectorial inmunes a colapsos de librerías externas.

---

## 2. Restricciones Técnicas de Frontend (Arc42 §2)

* **Ecosistema:** React 19 con arquitectura basada exclusivamente en Componentes Funcionales y Hooks.
* **Tipado Estricto:** TypeScript 5.9 con comprobación exhaustiva de tipos (`tsc -b`), interfaces de dominio sincronizadas con los contratos del backend y 0 `any` en capas de datos.
* **Empaquetado y Rendimiento:** Vite 8 con Rolldown/ESBuild, división de código por rutas dinámicas (*code splitting*) y reintentos automáticos de chunks desactualizados (`lazyWithRetry`).
* **Comunicación HTTP:** Cliente `Axios` singleton con interceptores de solicitud para inyectar automáticamente el encabezado `X-Negocio-Slug` derivado del contexto activo.

---

## 3. Flujos Principales de Usuario (User Journeys) (Arc42 §3)

```mermaid
flowchart TD
    Inicio([Usuario ingresa a /:slug]) --> EsCliente{¿Tipo de Usuario?}
    
    %% Flujo Cliente
    EsCliente -->|Cliente / Invitado| PortalPublico[Portada Pública de la Barbería]
    PortalPublico --> RadarGPS[Radar de Ubicación Maps/OSM]
    PortalPublico --> RedesFooter[Canales Oficiales en Footer]
    PortalPublico --> FlujoReserva[Agendamiento /:slug/reservar]
    FlujoReserva --> Stepper[1. Servicio -> 2. Barbero -> 3. Fecha/Hora -> 4. Confirmación]
    Stepper --> VoucherDigital[Comprobante con Token Seguro]
    
    %% Flujo Personal / Admin
    EsCliente -->|Personal / Admin| Login[Inicio de Sesión /:slug/iniciar-sesion]
    Login --> GoogleAuth[Google OAuth2 Anti-Takeover]
    GoogleAuth --> Dashboard[Panel Operativo /:slug/dashboard]
    
    Dashboard --> ModuloCitas[Agenda Diaria del Barbero]
    Dashboard --> ModuloConfig[Configuración de la Barbería]
    
    ModuloConfig --> Tab1[1. Info Comercial & GPS]
    ModuloConfig --> Tab2[2. Diseño & Temas de Marca]
    ModuloConfig --> Tab3[3. Redes Sociales Oficiales]
```

### Detalle de Vistas y Módulos:
1. **Portada Pública (`/:slug`):** Cabecera panorámica, radar geográfico pulsante sobre mapas, tarjetas de servicios destacados y pie de página con redes sociales dinámicas.
2. **Motor de Reservas (`/:slug/reservar`):** Selección de profesional, consulta de horas libres de 60 min en tiempo real y confirmación con nombre/teléfono.
3. **Portal del Cliente VIP (`/:slug/cliente/mi-cuenta`):** Historial de turnos, estados en vivo y botón de cancelación de 1 clic mediante token criptográfico.
4. **Panel Operativo del Barbero (`/:slug/dashboard`):** Lista de turnos asignados por fecha, visualización de clientes y acciones rápidas ("Completar cita", "No asistió").
5. **Configuración de Sede SaaS (`/:slug/configuracion`):**
   * **Pestaña 1 · Información Comercial y GPS:** Asistente interactivo con `navigator.geolocation` para autocompletar coordenadas y parser de enlaces de Google Maps.
   * **Pestaña 2 · Diseño y Recursos de Marca:** Galería de 7 temas visuales con persistencia inmediata y gestor de subida de archivos SVG/PNG.
   * **Pestaña 3 · Redes Sociales Oficiales:** Selector visual (Instagram, WhatsApp, TikTok, Facebook, Otro), control de visibilidad mediante switch ON/OFF y eliminación con `ConfirmDialog`.
6. **Hub Central de Plataforma (`/plataforma` y `/explorar`):** Catálogo de todas las barberías registradas en el SaaS con métricas consolidadas.

---

## 4. Estructura Modular del Proyecto (Arc42 §5)

El código sigue una arquitectura modular orientada a dominios (*Feature-Sliced Design*):

```
src/
├── assets/               # Recursos estáticos (logos, fuentes, ilustraciones)
├── config/               # Configuración de temas (tenantTheme.ts) y rutas
├── features/             # Módulos de dominio independientes
│   ├── auth/             # Login, guardián de sesión, Google OAuth callback
│   ├── barberos/         # Catálogo y administración de barberos por sede
│   ├── horarios/         # Gestión de horario semanal, excepciones y bloqueos
│   ├── negocio/          # Configuración de sede, recursos de marca y Redes Sociales
│   ├── plataforma/       # Hub global de barberías y onboarding
│   ├── reservas/         # Wizard de agendamiento, portal cliente y administración
│   ├── servicios/        # Catálogo de servicios y asignación de precios
│   ├── usuarios/         # Gestión de administradores y roles de personal
│   └── whatsapp/         # Configuración de plantillas y estado del servicio
├── pages/                # Vistas principales de primer nivel (Home, NotFound)
├── shared/               # Componentes transversales reutilizables
│   ├── api/              # Cliente Axios configurado con interceptores multitenant
│   ├── context/          # Contextos de React (ThemeContext, TenantBrandContext)
│   ├── layout/           # Sidebar, Navbar, Footer, Layout de Dashboard
│   ├── styles/           # Tokens CSS de marca, temas tenant y temas claro/oscuro
│   └── ui/               # Componentes atómicos (Button, Modal, ConfirmDialog, Spinner)
└── App.tsx               # Enrutador principal y proveedores globales
```

---

## 5. Theming Multitenant y Sistema de Diseño (Arc42 §8)

El diseño visual es dinámico y reactivo a nivel de nodo raíz (`<html data-tenant-theme="..." data-theme="...">`):

| Identificador de Tema | Nombre de la Personalidad | Color Primario | Tipografía de Marca |
| :--- | :--- | :--- | :--- |
| `clasico-azul` | Azul Zafiro Clásico | `#0071BC` | Barlow Condensed |
| `cyber-lime` | Cyber Lime Urbano | `#22c55e` | Outfit / Sans-serif |
| `sunset-amber` | Sunset Amber Cálido | `#ff6b35` | Plus Jakarta Sans |
| `midnight-cyan` | Midnight Cyan Neón | `#00d2ff` | Orbitron / Futurista |
| `crimson-velvet` | Crimson Velvet Rubí | `#ef233c` | Playfair Display / Editorial |
| `monochrome-noir` | Monochrome Noir B&W | `#000000` / `#ffffff` | Inter / Minimalista |

### Blindaje de Contraste Dual (Modo Claro vs Modo Oscuro)
Cada tema incluye reglas dedicadas en `tenant-themes.css` que aseguran que controles como `.btn-outline-secondary`, botones de geolocalización, tablas de reservas y pestañas de administración mantengan una relación de contraste **superior a 4.5:1 (WCAG AA)** tanto en modo oscuro como en modo claro sobre fondos blancos.

---

## 6. Guía de Instalación y Puesta en Marcha (IEEE 1063)

### 6.1 Requisitos del Sistema
* **Node.js:** `>= 20.x`
* **Gestor de paquetes:** `npm` o `pnpm`

### 6.2 Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/dfelipe7/Barberia-Frontend.git
   cd Barberia-Frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`):**
   ```env
   # URL del Backend NestJS
   VITE_API_URL=http://localhost:3000

   # Client ID de Google Identity Services (OAuth2)
   VITE_GOOGLE_CLIENT_ID=tu-cliente-id.apps.googleusercontent.com
   ```

4. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

5. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Genera la carpeta `dist/` optimizada y lista para servir vía Nginx o Railway.

---

## 7. Decisiones de Arquitectura de Frontend (ADRs)

* **ADR-F01 · Inyección Automática de Contexto Multitenant:** En lugar de pasar manualmente el `slug` en cada llamada a la API, el interceptor de Axios extrae el `slug` de la URL actual o subdominio y añade la cabecera `X-Negocio-Slug`, manteniendo el código de componentes limpio y desacoplado.
* **ADR-F02 · Gestión de Estado del Servidor con React Query:** Se adoptó TanStack Query para el manejo de consultas y mutaciones con cacheo inteligente, eliminación de peticiones duplicadas y sincronización mediante eventos desacoplados (`window.dispatchEvent(new Event('tenant-perfil-actualizado'))`).
* **ADR-F03 · Componentes de Interacción Puros:** Se reemplazaron llamadas intrusivas del navegador (`window.confirm`) por el componente reactivo `ConfirmDialog`, y el switch de activación de redes sociales se rediseñó en CSS puro (`.redes-switch`) para eliminar dependencias frágiles de Bootstrap en producción.

---

## 8. Gobernanza y Human-in-the-Loop (HITL)

Este repositorio aplica las directrices de gobernanza asistida por IA documentadas en:
* [`AGENTS.md`](./AGENTS.md): Principios operativos y limitaciones del asistente de desarrollo.
* [`TECH_DEBT.md`](./TECH_DEBT.md): Registro vivo de mejoras pendientes y deuda técnica controlada.
* `.githooks/`: Hooks de pre-commit que auditan que todo commit cuente con autorización humana expresa y trailers de trazabilidad (`AI-Assisted-By`, `AI-Model`, `AI-Session`).

---
*Documento mantenido de conformidad con las directrices de Ingeniería de Software, Arc42 e IEEE 1063.*
