let _dompurify = null;
let _dompurifyTried = false;

function getDomPurify() {
  if (_dompurifyTried) return _dompurify;
  _dompurifyTried = true;
  try {
    _dompurify = require('isomorphic-dompurify');
  } catch {
    _dompurify = null;
  }
  return _dompurify;
}

const tagEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };

export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\0/g, '')
    .replace(/[&<>"']/g, (c) => tagEntities[c] || c);
}

export function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[key] = sanitizeObject(value);
    }
    return clean;
  }
  return obj;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[\d\s\-\+\(\)]{7,15}$/.test(phone);
}

export function stripHtml(str) {
  if (typeof str !== 'string') return str;
  const dp = getDomPurify();
  if (dp) return dp.sanitize(str, { ALLOWED_TAGS: [] });
  return str.replace(/<[^>]*>/g, '');
}

export function sanitizeForDisplay(str) {
  if (typeof str !== 'string') return str;
  const dp = getDomPurify();
  if (dp) {
    return dp.sanitize(str, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
  let prev = '';
  let s = str;
  while (s !== prev) { prev = s; s = s.replace(/<[^>]*>/g, ''); }
  return s
    .replace(/\0/g, '')
    .replace(/[&<>"']/g, (c) => tagEntities[c] || c);
}

export function sanitizeHtml(str) {
  if (typeof str !== 'string') return str;
  const dp = getDomPurify();
  if (dp) {
    return dp.sanitize(str, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    });
  }
  return sanitize(str);
}

export function sanitizeForOrFilter(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/,/g, '\\,')
    .replace(/\./g, '\\.')
    .replace(/'/g, "''")
    .replace(/"/g, '""');
}

export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.replace(/[\r\n\t]/g, '').trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|\/)/i.test(trimmed)) {
    try {
      if (/^(https?:\/\/)/i.test(trimmed)) new URL(trimmed);
      return trimmed;
    } catch { return ''; }
  }
  return '';
}

export function sanitizeFileName(name) {
  if (typeof name !== 'string') return '';
  return name
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}
