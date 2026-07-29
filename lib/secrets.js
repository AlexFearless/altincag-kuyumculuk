const JWT_SECRET = process.env.JWT_SECRET || 'ecb5a24ab737f1a9ec23b24b3ce5834c2d49ba2aad912c75692ce497b2eb93be1343cfdbf80f1301bcdf203262a4745dbf7ec460a812f01d8b5f70eb15983a22';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'info@altincagkuyumculuk.com';

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjyghchbqlwqxorfgkvj.supabase.co';
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_24FBPXk55YzgXyzqmwIltQ_sDj9N1IW';
}

export function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_qU1cUequqxCCLRZChd-UDA_m81hZc8b';
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || JWT_SECRET;
}

export function getSendgridApiKey() {
  return process.env.SENDGRID_API_KEY || SENDGRID_API_KEY;
}

export function getSendgridFromEmail() {
  return process.env.SENDGRID_FROM_EMAIL || SENDGRID_FROM_EMAIL;
}
