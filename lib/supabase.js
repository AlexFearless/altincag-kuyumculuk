import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceKey } from './secrets';

let _supabase = null;
let _supabaseAdmin = null;

function initClients() {
  if (_supabase) return;
  try {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    const serviceKey = getSupabaseServiceKey();
    _supabase = createClient(url, anonKey);
    _supabaseAdmin = createClient(url, serviceKey);
  } catch (e) {
    console.error('Supabase yapılandırma hatası:', e.message);
  }
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabase) throw new Error('Supabase yapılandırılmamış. .env.local dosyasını kontrol edin.');
    return _supabase[prop];
  },
});

export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabaseAdmin) throw new Error('Supabase admin yapılandırılmamış. .env.local dosyasını kontrol edin.');
    return _supabaseAdmin[prop];
  },
});

export function getDb() {
  initClients();
  if (!_supabaseAdmin) {
    throw new Error('VERITABANI_HATASI: Supabase yapılandırılmamış. .env.local dosyasını kontrol edin.');
  }
  return _supabaseAdmin;
}

export function getDbPublic() {
  initClients();
  if (!_supabase) {
    throw new Error('VERITABANI_HATASI: Supabase yapılandırılmamış. .env.local dosyasını kontrol edin.');
  }
  return _supabase;
}
