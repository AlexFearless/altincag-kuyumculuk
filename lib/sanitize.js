const tagEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };

export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, (char) => tagEntities[char] || char);
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
  return str.replace(/<[^>]*>/g, '');
}

export function sanitizeForDisplay(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[&<>"']/g, (char) => tagEntities[char] || char)
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '');
}

export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return trimmed;
  return '';
}

export function sanitizeFileName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
}
