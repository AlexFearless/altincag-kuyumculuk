const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'POST', headers }, res => {
      let c = '';
      res.on('data', d => c += d);
      res.on('end', () => resolve(JSON.parse(c)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET', headers }, res => {
      let c = '';
      res.on('data', d => c += d);
      res.on('end', () => resolve(JSON.parse(c)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // 1. Admin login
  const login = await post('/api/admin/login', { email: 'admin@altincag.com', password: 'Admin123!' });
  console.log('1. Admin login:', login.success ? 'OK' : 'FAIL');
  if (!login.success) { console.log('  Error:', login); return; }
  const token = login.token;

  // 2. Get users
  const users = await get('/api/admin/users', token);
  console.log('2. Users:', users.total, 'kullanıcı');
  if (users.users) users.users.forEach(u => console.log('  -', u.name, u.email, 'active:', u.isActive));

  // 3. Get products
  const products = await get('/api/products?limit=50', token);
  console.log('3. Products:', products.total, 'ürün');
  if (products.products) products.products.forEach(p => console.log('  -', p.name, p.price + '₺', p.category));

  // 4. Get messages
  const messages = await get('/api/messages', token);
  console.log('4. Messages:', (messages.messages || []).length, 'mesaj');

  // 5. Get logs
  const logs = await get('/api/admin/logs', token);
  console.log('5. Logs:', logs.total, 'log');
}

main().catch(e => console.error(e));
