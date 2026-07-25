function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set it in .env.local`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  return process.env[name] || fallback;
}

export function getSupabaseUrl() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey() {
  return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function getSupabaseServiceKey() {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function getJwtSecret() {
  return requireEnv('JWT_SECRET');
}

export function getSendgridApiKey() {
  return requireEnv('SENDGRID_API_KEY');
}

export function getSendgridFromEmail() {
  return optionalEnv('SENDGRID_FROM_EMAIL', 'info@altincagkuyumculuk.com');
}
