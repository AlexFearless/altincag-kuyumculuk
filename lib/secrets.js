import { getConfig, getJwtSecret as getConfigJwtSecret } from './config';

export function getSupabaseUrl() {
  const cfg = getConfig();
  if (!cfg.supabaseUrl) throw new Error('Supabase URL yapılandırılmamış');
  return cfg.supabaseUrl;
}

export function getSupabaseAnonKey() {
  const cfg = getConfig();
  if (!cfg.supabaseAnonKey) throw new Error('Supabase anon key yapılandırılmamış');
  return cfg.supabaseAnonKey;
}

export function getSupabaseServiceKey() {
  const cfg = getConfig();
  if (!cfg.supabaseServiceKey) throw new Error('Supabase service key yapılandırılmamış');
  return cfg.supabaseServiceKey;
}

export function getJwtSecret() {
  return getConfigJwtSecret();
}

export function getSendgridApiKey() {
  const cfg = getConfig();
  return cfg.sendgridApiKey || '';
}

export function getSendgridFromEmail() {
  const cfg = getConfig();
  return cfg.sendgridFromEmail || 'info@altincagkuyumculuk.com';
}
