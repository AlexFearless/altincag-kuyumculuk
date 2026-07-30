const JWT_SECRET = process.env.JWT_SECRET;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'info@altincagkuyumculuk.com';

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getJwtSecret() {
  return JWT_SECRET;
}

export function getSendgridApiKey() {
  return SENDGRID_API_KEY;
}

export function getSendgridFromEmail() {
  return SENDGRID_FROM_EMAIL;
}
