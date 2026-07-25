import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

let JWT_SECRET;
try {
  JWT_SECRET = process.env.JWT_SECRET;
} catch (e) {
  console.error('JWT_SECRET not configured');
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 365;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateToken(id) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export async function generateTokenPair(userId, userType = 'user') {
  const accessToken = generateToken(userId);
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

  const newAccessToken = jwt.sign({ id: tokenRow.user_id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

  return {
    accessToken: newAccessToken,
    user_type: tokenRow.user_type,
    user_id: tokenRow.user_id,
  };
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await supabaseAdmin.from('refresh_tokens').update({ revoked: true }).eq('token_hash', tokenHash);
}

export async function revokeAllUserTokens(userId, userType = 'user') {
  await supabaseAdmin.from('refresh_tokens').update({ revoked: true }).eq('user_id', userId).eq('user_type', userType);
}

export function verifyToken(token) {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Yetkilendirme başarısız' });
    }

    req.admin = { id: decoded.id };
    return handler(req, res);
  };
}

export async function getAdminFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, email, name, role, is_active')
    .eq('id', decoded.id)
    .single();

  if (!admin || !admin.is_active) return null;

  return {
    _id: admin.id,
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.is_active,
  };
}
