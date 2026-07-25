const rateLimitStore = new Map();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const ips = xff.split(',').map(ip => ip.trim());
    const lastIp = ips[ips.length - 1];
    if (lastIp && /^\d{1,3}(\.\d{1,3}){3}$/.test(lastIp)) {
      return lastIp;
    }
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp && /^\d{1,3}(\.\d{1,3}){3}$/.test(realIp)) {
    return realIp;
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function rateLimit({ windowMs = 60000, max = 10, message = 'Çok fazla deneme. Lütfen bekleyin.' } = {}) {
  return (req, res) => {
    const ip = getClientIp(req);
    const key = `${ip}:${req.url}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const record = rateLimitStore.get(key);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return true;
    }

    record.count++;
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({ error: message, retryAfter });
      return false;
    }
    return true;
  };
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) rateLimitStore.delete(key);
    }
  }, 60000);
}
