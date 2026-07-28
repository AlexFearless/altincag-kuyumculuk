import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase';
import { parseCookies, getTokenFromRequest } from './cookieUtils';
import { checkAccountLockout as checkLockout, recordFailedAttempt as recordAttempt, clearFailedAttempts as clearAttempts } from './rateLimit';

let JWT_SECRET;
try {
  JWT_SECRET = process.env.JWT_SECRET;
} catch (e) {
  console.error('JWT_SECRET not configured');
}

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Token verification will fail.');
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ALLOWED_ALGORITHMS = ['HS256'];

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getLockoutFingerprint(req) {
  const ip = req?.socket?.remoteAddress?.replace(/^::ffff:/, '') || 'unknown';
  const ua = req?.headers?.['user-agent'] || '';
  return `${ip}:${crypto.createHash('sha256').update(ua).digest('hex').substring(0, 8)}`;
}

export function generateToken(id, userType = 'user') {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ id, userType, jti }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export async function generateTokenPair(userId, userType = 'user') {
  const accessToken = generateToken(userId, userType);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin.from('refresh_tokens').insert({
    user_id: userId,
    user_type: userType,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') return null;

  const tokenHash = hashToken(refreshToken);

  const { data: tokenRow } = await supabaseAdmin
    .from('refresh_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('revoked', false)
    .single();

  if (!tokenRow) return null;
  if (new Date(tokenRow.expires_at) < new Date()) {
    await supabaseAdmin.from('refresh_tokens').delete().eq('id', tokenRow.id);
    return null;
  }

  const newAccessToken = generateToken(tokenRow.user_id, tokenRow.user_type);
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: revokeError } = await supabaseAdmin
    .from('refresh_tokens')
    .update({ revoked: true })
    .eq('id', tokenRow.id)
    .eq('revoked', false);

  if (revokeError) return null;

  const { error: insertError } = await supabaseAdmin.from('refresh_tokens').insert({
    user_id: tokenRow.user_id,
    user_type: tokenRow.user_type,
    token_hash: newTokenHash,
    expires_at: newExpiresAt,
  });

  if (insertError) {
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: false })
      .eq('id', tokenRow.id);
    return null;
  }

  return {
    accessToken: newAccessToken,
    newRefreshToken,
    user_type: tokenRow.user_type,
    user_id: tokenRow.user_id,
  };
}

export async function blacklistToken(token, reason = 'logout') {
  if (!token) return;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ALLOWED_ALGORITHMS });
    if (!decoded.jti || !decoded.exp) return;

    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    await supabaseAdmin.from('token_blacklist').insert({
      token_jti: decoded.jti,
      user_id: decoded.id,
      user_type: decoded.userType || 'user',
      token_type: 'access',
      expires_at: expiresAt,
      reason,
    });
  } catch {
    // Token already invalid, no need to blacklist
  }
}

export async function isTokenBlacklisted(jti) {
  if (!jti) return false;
  const { data } = await supabaseAdmin
    .from('token_blacklist')
    .select('id')
    .eq('token_jti', jti)
    .single();
  return !!data;
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await supabaseAdmin.from('refresh_tokens').update({ revoked: true }).eq('token_hash', tokenHash);
}

export async function revokeAllUserTokens(userId, userType = 'user') {
  await supabaseAdmin.from('refresh_tokens').update({ revoked: true }).eq('user_id', userId).eq('user_type', userType);
}

export async function verifyToken(token) {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ALLOWED_ALGORITHMS });
    if (!decoded || !decoded.jti) return null;

    // Check blacklist
    const blacklisted = await isTokenBlacklisted(decoded.jti);
    if (blacklisted) return null;

    return decoded;
  } catch {
    return null;
  }
}

export async function verifyTokenWithoutBlacklist(token) {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ALLOWED_ALGORITHMS });
  } catch {
    return null;
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    req.admin = { id: decoded.id, userType: decoded.userType };
    return handler(req, res);
  };
}

export function withAdminRole(allowedRoles = ['super_admin', 'admin']) {
  return (handler) => async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    // Verify this is an admin token
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (!admin || !admin.is_active) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    if (!allowedRoles.includes(admin.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    req.admin = { id: admin.id, role: admin.role };
    return handler(req, res);
  };
}

export async function getAdminFromToken(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  if (decoded.userType !== 'admin') return null;

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, email, name, role, is_active')
    .eq('id', decoded.id)
    .single();

  if (!admin || !admin.is_active) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.is_active,
  };
}

// Re-export Supabase-based lockout functions
export const checkAccountLockout = checkLockout;
export const recordFailedAttempt = recordAttempt;
export const clearFailedAttempts = clearAttempts;
