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

async function main() {
  // 1. Login al
  const login = await post('/api/admin/login', { email: 'admin@altincag.com', password: 'Admin123!' });
  console.log('1. Login:', login.success ? 'OK' : 'FAIL - ' + JSON.stringify(login));
  if (!login.success) return;

  // 2. Token ile verify et
  const verify = await post('/api/admin/verify', { token: login.token });
  console.log('2. Verify:', verify.success ? 'OK' : 'FAIL - ' + JSON.stringify(verify));
}

main().catch(e => console.error(e));
