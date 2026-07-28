import { createClient } from '@supabase/supabase-js';

let supabaseUrl, supabaseAnonKey, supabaseServiceKey;
try {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
} catch (e) {
  console.error('Supabase env error:', e.message);
}

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client requires service role key - NEVER fall back to anon
if (isConfigured && !supabaseServiceKey) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.');
}

export const supabaseAdmin = (isConfigured && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export function getDb() {
  if (!supabaseAdmin) {
    throw new Error('VERITABANI_HATASI: Service Role Key yapılandırılmamış. Admin veritabanı erişimi başarısız.');
  }
  return supabaseAdmin;
}

export function getDbPublic() {
  if (!supabase) {
    throw new Error('VERITABANI_HATASI: Supabase anon key yapılandırılmamış.');
  }
  return supabase;
}
