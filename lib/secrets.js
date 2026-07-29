export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABase_URL .env.local dosyasında tanımlı değil');
  return url;
}

export function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local dosyasında tanımlı değil');
  return key;
}

export function getSupabaseServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY .env.local dosyasında tanımlı değil');
  return key;
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET .env.local dosyasında tanımlı değil');
  return secret;
}

export function getSendgridApiKey() {
  return process.env.SENDGRID_API_KEY || '';
}

export function getSendgridFromEmail() {
  return process.env.SENDGRID_FROM_EMAIL || 'info@altincagkuyumculuk.com';
}
