import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
