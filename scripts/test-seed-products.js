const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5YTk1M2U5LTEyNWItNDBkNy05ZmJjLWI3MzU1NGM0OGFkMyIsImlhdCI6MTc4NDc2NTkyMCwiZXhwIjoxNzg3MzU3OTIwfQ.96QhRkcn5nLIfRy69TddEta5fCkDpQABU3ZmyU2SM70';

const products = [
  { name: 'Altın Yüzük 14 Ayar', price: 4500, category: 'yuzuk', stock: 15, karat: '14', description: 'Zarif altın yüzük', material: 'Altın', weight: 3.2, isFeatured: true },
  { name: 'Gümüş Kolye', price: 850, category: 'kolye', stock: 25, karat: '', description: 'Zarif gümüş kolye', material: 'Gümüş', weight: 5.0, isFeatured: true },
  { name: 'Altın Bileklik', price: 6200, category: 'bileklik', stock: 8, karat: '14', description: 'Zarif altın bileklik', material: 'Altın', weight: 7.5, isFeatured: true },
  { name: 'Altın Kelepçe', price: 5800, category: 'kelepce', stock: 12, karat: '14', description: 'Altın kelepçe bileklik', material: 'Altın', weight: 6.0, isFeatured: true },
  { name: 'Altın Kupe', price: 2200, category: 'kupe', stock: 20, karat: '14', description: 'Zarif altın küpe', material: 'Altın', weight: 1.8, isFeatured: true },
  { name: 'Altın Zincir', price: 3500, category: 'zincir', stock: 18, karat: '14', description: 'Altın kolye zinciri', material: 'Altın', weight: 4.5, isFeatured: true },
  { name: '18 Ayar Yüzük', price: 7500, category: 'yuzuk', stock: 5, karat: '18', description: '18 ayar altın yüzük', material: 'Altın', weight: 4.0 },
  { name: 'Taşlı Kolye', price: 3200, category: 'kolye', stock: 10, karat: '14', description: 'Taşlı altın kolye', material: 'Altın', weight: 3.5 },
];

let done = 0;
for (const p of products) {
  const data = JSON.stringify(p);
  const req = http.request({
    hostname: 'localhost', port: 3000, path: '/api/admin/products', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(data) },
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      done++;
      console.log(`[${done}/${products.length}] ${p.name}: ${res.statusCode}`);
      if (done === products.length) process.exit(0);
    });
  });
  req.on('error', (e) => { console.error(`Error: ${p.name}`, e.message); done++; if (done === products.length) process.exit(1); });
  req.write(data);
  req.end();
}
