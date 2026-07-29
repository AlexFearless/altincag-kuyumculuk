import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

let _cachedConfig = null;

function loadConfigFile() {
  if (_cachedConfig) return _cachedConfig;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      _cachedConfig = JSON.parse(raw);
      return _cachedConfig;
    }
  } catch {
    _cachedConfig = {};
  }
  return _cachedConfig || {};
}

export function saveConfig(config) {
  const current = loadConfigFile();
  const merged = { ...current, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
  _cachedConfig = merged;
}

export function isSetupComplete() {
  const envOk = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.JWT_SECRET);
  if (envOk) return true;
  const cfg = loadConfigFile();
  return !!(cfg.supabaseUrl && cfg.supabaseServiceKey && cfg.jwtSecret);
}

export function getConfig() {
  const cfg = loadConfigFile();
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || cfg.supabaseUrl || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || cfg.supabaseAnonKey || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || cfg.supabaseServiceKey || '',
    jwtSecret: process.env.JWT_SECRET || cfg.jwtSecret || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || cfg.sendgridApiKey || '',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || cfg.sendgridFromEmail || 'info@altincagkuyumculuk.com',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || cfg.siteUrl || 'http://localhost:3000',
    paytrMerchantId: process.env.PAYTR_MERCHANT_ID || cfg.paytrMerchantId || '',
    paytrMerchantKey: process.env.PAYTR_MERCHANT_KEY || cfg.paytrMerchantKey || '',
    paytrMerchantSalt: process.env.PAYTR_MERCHANT_SALT || cfg.paytrMerchantSalt || '',
    adminEmail: process.env.ADMIN_EMAIL || cfg.adminEmail || '',
    adminPassword: process.env.ADMIN_PASSWORD || cfg.adminPassword || '',
  };
}

export function getJwtSecret() {
  const cfg = getConfig();
  if (!cfg.jwtSecret) {
    const fallback = crypto.randomBytes(64).toString('hex');
    saveConfig({ jwtSecret: fallback });
    return fallback;
  }
  return cfg.jwtSecret;
}
