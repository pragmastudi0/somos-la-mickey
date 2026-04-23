/** Debe coincidir con el valor que evalúa handle_new_user en Supabase (y con slug_app en configuración). */
export const SOMOS_LA_MICKEY_SLUG_APP =
  typeof import.meta.env.VITE_APP_SLUG === 'string' && import.meta.env.VITE_APP_SLUG.trim()
    ? import.meta.env.VITE_APP_SLUG.trim()
    : 'somos-la-mickey';
