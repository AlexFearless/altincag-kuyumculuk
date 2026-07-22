const rateLimitStore = new Map();

export function rateLimit({ windowMs = 60000, max = 10, message = 'Çok fazla deneme. Lütfen bekleyin.' } = {}) {
  return (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
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
      res.status(429).json({ error: message });
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
  }, 300000);
}
