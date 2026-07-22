require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MONGODB_URI = process.env.MONGODB_URI;

async function fix() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const admin = await db.collection('admins').findOne({ email: 'admin@altincag.com' });
  if (!admin) { console.log('Admin yok'); process.exit(1); }
  console.log('Mevcut sifre (ilk 20):', admin.password.substring(0, 20));
  const hash = await bcrypt.hash('Admin123!', 12);
  await db.collection('admins').updateOne({ email: 'admin@altincag.com' }, { $set: { password: hash } });
  const updated = await db.collection('admins').findOne({ email: 'admin@altincag.com' });
  const match = await bcrypt.compare('Admin123!', updated.password);
  console.log('Sifre eslesmesi:', match);
  process.exit(0);
}
fix();
