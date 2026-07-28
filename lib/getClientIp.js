/**
 * Get real client IP address.
 * In serverless (Vercel), req.socket.remoteAddress is the load balancer IP.
 * We use it instead of X-Forwarded-For which can be spoofed by the client.
 */
export function getClientIp(req) {
  // In Vercel/serverless, remoteAddress is the load balancer
  const raw = req.socket?.remoteAddress;
  if (raw) {
    const ip = raw.replace(/^::ffff:/, '');
    if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
    if (ip === '127.0.0.1' || ip === '::1') return '127.0.0.1';
  }
  return 'unknown';
}
