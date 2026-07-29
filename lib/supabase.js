import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mjyghchbqlwqxorfgkvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_24FBPXk55YzgXyzqmwIltQ_sDj9N1IW';
const SUPABASE_SERVICE_KEY = 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';

let _supabase = null;
let _supabaseAdmin = null;

function initClients() {
  if (_supabase) return;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabase) throw new Error('Supabase yapılandırılmamış.');
    return _supabase[prop];
  },
});

export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    initClients();
    if (!_supabaseAdmin) throw new Error('Supabase admin yapılandırılmamış.');
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
