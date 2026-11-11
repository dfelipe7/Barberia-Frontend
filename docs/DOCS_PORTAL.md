# 🎨 Barbería VIP SaaS — Frontend Developer Hub

Bienvenido al portal oficial de **arquitectura técnica de interfaz y estado en cliente** de **Barbería VIP SaaS Frontend**, estructurado bajo los principios de **Arc42** (descomposición en capas y patrones) e **IEEE 1063** (contratos y tipos en TypeScript).

---

## 🗺️ Mapa de Capas Arquitectónicas (Frontend Layers)

Navega a través de las capas del cliente para inspeccionar contextos, hooks, servicios y validaciones:

| Capa / Módulo | Responsabilidad | Componentes & Hooks Clave |
| :--- | :--- | :--- |
| **🌐 Cliente HTTP & Tenant** | Proxy de peticiones Axios, inyección de cabecera `X-Negocio-Slug` y token Bearer aislado por sede. | `apiClient`, `obtenerNegocioSlugActivo`, `RUTAS_RESERVADAS` |
| **🔐 Autenticación & Sesión** | Gestión reactiva de tokens JWT, autenticación Google OAuth y sincronización multi-pestaña por sede. | `AuthContext`, `AuthProvider`, `useAuth` |
| **🛡️ Protección de Rutas & RBAC** | Guardián declarativo con control de membresía de personal, verificación de roles y redirecciones seguras. | `ProtectedRoute`, `puedeGestionarEstado`, `ROLES_APP` |
| **🎨 Marca & Temas Dinámicos** | Selector de 6 paletas de color con CSS Variables, favicon dinámico y sanitización contra storage poisoning. | `TenantBrandContext`, `useTenantBrand`, `resolverTemaTenant` |
| **💈 Barberos** | Consultas cacheadas con React Query, administración de staff, comisiones porcentuales y avatares. | `barberosService`, `useBarberosCatalogo`, `useBarberosGestion`, `useCrearBarbero` |
| **✂️ Servicios** | Catálogo público categorizado, asignación de profesionales por servicio y formularios reactivos. | `serviciosService`, `useServiciosCatalogo`, `useServiciosGestion`, `useCrearServicio` |
| **🗓️ Reservas & Citas** | Stepper de agendamiento cliente/invitado, tokens efímeros de autoservicio y agenda semanal. | `reservasService`, `clientesService`, `useMisReservas`, `useAgendaSemanalBarbero` |
| **📅 Horarios & Bloqueos** | Matriz de disponibilidad por franjas de tiempo, turnos semanales y excepciones de agenda. | `horariosService`, `useMiHorario`, `useGuardarMiHorario`, `useBloqueosHorario` |
| **💬 WhatsApp Status** | Polling ligero no bloqueante del estado del socket de WhatsApp Web y renderizado de código QR. | `whatsappService`, `WhatsAppStatusIndicator` |

---

## 🏛️ Flujo Arquitectónico en el Cliente (Data Flow)

Cada interacción del usuario sigue un flujo desacoplado mediante el **Patrón Facade**:

```text
[ Componente UI / Página ]
          │
          ▼
1. React Query Facade Hook    ──► Administra cache, reintentos, estado (loading/error) y stale time (30s)
          │
          ▼
2. Mapper (DTO ↔ Dominio)     ──► Transforma formatos crudos del backend a entidades puras de la UI
          │
          ▼
3. Servicio HTTP (Axios)      ──► Define llamadas REST exactas hacia los endpoints
          │
          ▼
4. Interceptor Axios Global   ──► Inyecta X-Negocio-Slug y token Bearer específico de la sede
          │
          ▼
[ Red / Backend NestJS ]
```

---

## 🛡️ Reglas de Seguridad en el Navegador

1. **Aislamiento Multitenant en LocalStorage:**  
   Los tokens y perfiles se almacenan con claves prefijadas por el slug de la barbería (`token_barberia_{slug}`), impidiendo colisiones o fuga de sesión entre pestañas de distintas barberías.
2. **Defensa contra Sesiones Huérfanas:**  
   Si el backend responde con un error `401 Unauthorized`, el interceptor de Axios purga automáticamente las credenciales locales de esa sede para evitar estados inconsistentes.
3. **Cero Exposición de Lógica Crítica:**  
   La validación de permisos en el cliente (`ProtectedRoute`) mejora la experiencia de usuario y evita accesos no deseados en la UI, pero el backend re-valida cada operación de forma autónoma.

---

*💡 **Consejo de Navegación:** Usa `Ctrl + K` para buscar rápidamente cualquier hook (ej. `useAuth`, `useCrearBarbero`, `useServiciosCatalogo`) o servicio.*
