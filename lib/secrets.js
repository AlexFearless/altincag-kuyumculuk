export function getSupabaseUrl() {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error('NEXT_PUBLIC_SUPABASE_URL tanımlı değil');
  return v;
}

export function getSupabaseAnonKey() {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil');
  return v;
}

export function getSupabaseServiceKey() {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v) throw new Error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil');
  return v;
}

export function getJwtSecret() {
  const v = process.env.JWT_SECRET;
  if (!v) throw new Error('JWT_SECRET tanımlı değil');
  return v;
}

export function getSendgridApiKey() {
  return process.env.SENDGRID_API_KEY || '';
}

export function getSendgridFromEmail() {
  return process.env.SENDGRID_FROM_EMAIL || 'info@altincagkuyumculuk.com';
}

export function getBrevoApiKey() {
  return process.env.BREVO_API_KEY || '';
}

export function getBrevoFromEmail() {
  return process.env.BREVO_FROM_EMAIL || 'info@altincagkuyumculuk.com';
}
