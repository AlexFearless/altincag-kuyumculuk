import { createClient } from '@supabase/supabase-js';

let _supabase = null;
let _supabaseAdmin = null;

function initClients() {
  if (_supabase) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && anonKey) {
    _supabase = createClient(url, anonKey);
  }
  if (url && serviceKey) {
    _supabaseAdmin = createClient(url, serviceKey);
  }
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabase) throw new Error('Supabase yapılandırılmamış. .env.local dosyasındaki Supabase ayarlarını kontrol edin.');
    return _supabase[prop];
  },
});

export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabaseAdmin) throw new Error('Supabase admin yapılandırılmamış. .env.local dosyasındaki ayarları kontrol edin.');
    return _supabaseAdmin[prop];
  },
});

export function getDb() {
  initClients();
  if (!_supabaseAdmin) {
    throw new Error('VERITABANI_HATASI: Supabase yapılandırılmamış. .env.local dosyasındaki SUPABASE_SERVICE_ROLE_KEY ayarını kontrol edin.');
  }
  return _supabaseAdmin;
}

export function getDbPublic() {
  initClients();
  if (!_supabase) {
    throw new Error('VERITABANI_HATASI: Supabase yapılandırılmamış. .env.local dosyasındaki Supabase ayarlarını kontrol edin.');
  }
  return _supabase;
}
