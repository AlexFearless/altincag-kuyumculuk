import { createClient } from '@supabase/supabase-js';
import { getConfig } from './config';

let _supabase = null;
let _supabaseAdmin = null;

function initClients() {
  if (_supabase) return;
  const cfg = getConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    _supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }
  if (cfg.supabaseUrl && cfg.supabaseServiceKey) {
    _supabaseAdmin = createClient(cfg.supabaseUrl, cfg.supabaseServiceKey);
  }
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabase) throw new Error('Supabase yapılandırılmamış. Lütfen /setup sayfasından ayarları tamamlayın.');
    return _supabase[prop];
  },
});

export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabaseAdmin) throw new Error('Supabase admin yapılandırılmamış. Lütfen /setup sayfasından ayarları tamamlayın.');
    return _supabaseAdmin[prop];
  },
});

export function getDb() {
  initClients();
  if (!_supabaseAdmin) {
    throw new Error('VERITABANI_HATASI: Supabase yapılandırılmamış.');
  }
  return _supabaseAdmin;
}

export function getDbPublic() {
  initClients();
  if (!_supabase) {
    throw new Error('VERITABANI_HATASI: Supabase yapılandırılmamış.');
  }
  return _supabase;
}
