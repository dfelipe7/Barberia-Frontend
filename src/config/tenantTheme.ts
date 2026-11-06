export type TenantThemeId = 'clasico-azul' | 'cyber-lime' | 'sunset-amber' | 'midnight-cyan' | 'crimson-velvet' | 'monochrome-noir';

export interface TenantThemeConfig {
  id: TenantThemeId;
  nombre: string;
  descripcion: string;
  colorPrimario: string;
  colorHover: string;
  colorTextoBoton: string;
  glow: string;
  formaBotones: 'pill' | 'rounded' | 'sharp';
  badge: string;
}

export const TEMAS_TENANT: Record<TenantThemeId, TenantThemeConfig> = {
  'clasico-azul': {
    id: 'clasico-azul',
    nombre: 'Azul Zafiro (Kyrios)',
    descripcion: 'Elegante, corporativo y de alta confianza',
    colorPrimario: '#0071BC',
    colorHover: '#005fa0',
    colorTextoBoton: '#ffffff',
    glow: 'rgba(0, 113, 188, 0.3)',
    formaBotones: 'rounded',
    badge: '💎 Oficial',
  },
  'cyber-lime': {
    id: 'cyber-lime',
    nombre: 'Cyber Lime (Urban)',
    descripcion: 'Moderno, verde neón eléctrico con botones píldora deportivos',
    colorPrimario: '#22c55e',
    colorHover: '#16a34a',
    colorTextoBoton: '#000000',
    glow: 'rgba(34, 197, 94, 0.45)',
    formaBotones: 'pill',
    badge: '⚡ Deportivo VIP',
  },
  'sunset-amber': {
    id: 'sunset-amber',
    nombre: 'Sunset Coral (Warm Studio)',
    descripcion: 'Cálido, naranja sunset y ámbar con botones píldora modernos y estética pulida',
    colorPrimario: '#ff6b35',
    colorHover: '#ea580c',
    colorTextoBoton: '#ffffff',
    glow: 'rgba(255, 107, 53, 0.45)',
    formaBotones: 'pill',
    badge: '🔥 Sunset Warm',
  },
  'midnight-cyan': {
    id: 'midnight-cyan',
    nombre: 'Midnight Cyan (Cyber Tech)',
    descripcion: 'Azul medianoche profundo con cian eléctrico neón, cápsulas luminosas e interfaz futurista',
    colorPrimario: '#00d2ff',
    colorHover: '#0099ff',
    colorTextoBoton: '#ffffff',
    glow: 'rgba(0, 210, 255, 0.55)',
    formaBotones: 'pill',
    badge: '🌐 Cyber Tech',
  },
  'crimson-velvet': {
    id: 'crimson-velvet',
    nombre: 'Crimson Velvet (Red Luxury)',
    descripcion: 'Rojo carmesí rubí y terciopelo oscuro con tipografía de alta costura y acabado glassmorphism',
    colorPrimario: '#ef233c',
    colorHover: '#d90429',
    colorTextoBoton: '#ffffff',
    glow: 'rgba(239, 35, 60, 0.55)',
    formaBotones: 'pill',
    badge: '🍷 Red Luxury',
  },
  'monochrome-noir': {
    id: 'monochrome-noir',
    nombre: 'Monochrome Noir (Studio B&W)',
    descripcion: 'Inspirado en John\'s Barbershop: minimalismo nórdico, alto impacto y contraste blanco y negro serio',
    colorPrimario: '#ffffff',
    colorHover: '#e4e4e7',
    colorTextoBoton: '#000000',
    glow: 'rgba(255, 255, 255, 0.45)',
    formaBotones: 'pill',
    badge: '✂️ Studio B&W',
  },
};

/**
 * Resuelve el tema visual correspondiente a la sede activa:
 * 1. Preferencia personalizada en localStorage ('tema_negocio_<slug>')
 * 2. Si el slug es 'barberia-demo-2', por defecto usa 'cyber-lime' (el tema verde neón)
 * 3. Fallback general: 'clasico-azul' (Kyrios)
 */
export function resolverTemaTenant(slug?: string | null): TenantThemeId {
  if (slug) {
    const guardado = localStorage.getItem(`tema_negocio_${slug}`) as TenantThemeId | null;
    if (guardado && TEMAS_TENANT[guardado]) {
      return guardado;
    }
  }
  const guardadoActivo = localStorage.getItem('tema_negocio_activo') as TenantThemeId | null;
  if (guardadoActivo && TEMAS_TENANT[guardadoActivo]) {
    return guardadoActivo;
  }
  if (slug && slug.toLowerCase().includes('demo-2')) {
    return 'cyber-lime';
  }
  return 'clasico-azul';
}

export function guardarTemaTenant(slug: string, temaId: TenantThemeId) {
  if (!slug) return;
  localStorage.setItem(`tema_negocio_${slug}`, temaId);
  localStorage.setItem('tema_negocio_activo', temaId);
  document.documentElement.dataset.tenantTheme = temaId;
  document.documentElement.setAttribute('data-tenant-theme', temaId);
  window.dispatchEvent(new CustomEvent('tenant-tema-cambiado', { detail: { slug, temaId } }));
}

