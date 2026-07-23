import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseAdmin = isConfigured
  ? supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase
  : null;

export function getDb() {
  if (!supabaseAdmin) {
    throw new Error('VERITABANI_HATASI: Veritabani baglantisi kurulamadi. .env.local dosyasini kontrol edin.');
  }
  return supabaseAdmin;
}

export function getDbPublic() {
  if (!supabase) {
    throw new Error('VERITABANI_HATASI: Veritabani baglantisi kurulamadi. .env.local dosyasini kontrol edin.');
  }
  return supabase;
}
