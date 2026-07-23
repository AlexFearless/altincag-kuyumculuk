import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_24FBPXk55YzgXyzqmwIltQ_sDj9N1IW';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';

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
    throw new Error('VERITABANI_HATASI: Veritabani baglantisi kurulamadi.');
  }
  return supabaseAdmin;
}

export function getDbPublic() {
  if (!supabase) {
    throw new Error('VERITABANI_HATASI: Veritabani baglantisi kurulamadi.');
  }
  return supabase;
}
