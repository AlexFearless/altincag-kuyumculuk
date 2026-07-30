import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin, getDb } from './supabase';
import { getJwtSecret } from './secrets';
import { parseCookies, getTokenFromRequest } from './cookieUtils';
import { checkAccountLockout as checkLockout, recordFailedAttempt as recordAttempt, clearFailedAttempts as clearAttempts } from './rateLimit';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 365;
const ALLOWED_ALGORITHMS = ['HS256'];

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateToken(id, userType = 'user') {
  const JWT_SECRET = getJwtSecret();
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

  try {
    const db = getDb();
    await db.from('refresh_tokens').insert({
      user_id: userId,
      user_type: userType,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  } catch {}

  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') return null;

  const tokenHash = hashToken(refreshToken);
  const db = getDb();

  try {
    const { data: tokenRow } = await db
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .single();

    if (!tokenRow) return null;
    if (new Date(tokenRow.expires_at) < new Date()) {
      await db.from('refresh_tokens').delete().eq('id', tokenRow.id);
      return null;
    }

    const newAccessToken = generateToken(tokenRow.user_id, tokenRow.user_type);
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: revokeError } = await db
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('id', tokenRow.id)
      .eq('revoked', false);

    if (revokeError) return null;

    const { error: insertError } = await db.from('refresh_tokens').insert({
      user_id: tokenRow.user_id,
      user_type: tokenRow.user_type,
      token_hash: newTokenHash,
      expires_at: newExpiresAt,
    });

    if (insertError) {
      await db
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
  } catch {
    return null;
  }
}

export async function blacklistToken(token, reason = 'logout') {
  if (!token) return;
  try {
    const JWT_SECRET = getJwtSecret();
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ALLOWED_ALGORITHMS });
    if (!decoded.jti || !decoded.exp) return;

    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    const db = getDb();

    await db.from('token_blacklist').insert({
      token_jti: decoded.jti,
      user_id: decoded.id,
      user_type: decoded.userType || 'user',
      token_type: 'access',
      expires_at: expiresAt,
      reason,
    });
  } catch {}
}

export async function isTokenBlacklisted(jti) {
  if (!jti) return false;
  try {
    const db = getDb();
    const { data } = await db
      .from('token_blacklist')
      .select('id')
      .eq('token_jti', jti)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  try {
    const tokenHash = hashToken(refreshToken);
    const db = getDb();
    await db.from('refresh_tokens').update({ revoked: true }).eq('token_hash', tokenHash);
  } catch {}
}

export async function revokeAllUserTokens(userId, userType = 'user') {
  try {
    const db = getDb();
    await db.from('refresh_tokens').update({ revoked: true }).eq('user_id', userId).eq('user_type', userType);
  } catch {}
}

export async function verifyToken(token) {
  const JWT_SECRET = getJwtSecret();
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ALLOWED_ALGORITHMS });
    if (!decoded || !decoded.jti) return null;
    const blacklisted = await isTokenBlacklisted(decoded.jti);
    if (blacklisted) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyTokenWithoutBlacklist(token) {
  const JWT_SECRET = getJwtSecret();
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

    if (decoded.userType !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    try {
      const db = getDb();
      const { data: admin } = await db
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
    } catch {
      return res.status(501).json({ error: 'Veritabanı bağlantısı kurulamadı' });
    }
  };
}

export async function getAdminFromToken(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  if (decoded.userType !== 'admin') return null;

  try {
    const db = getDb();
    const { data: admin } = await db
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
  } catch {
    return null;
  }
}

export const checkAccountLockout = checkLockout;
export const recordFailedAttempt = recordAttempt;
export const clearFailedAttempts = clearAttempts;
