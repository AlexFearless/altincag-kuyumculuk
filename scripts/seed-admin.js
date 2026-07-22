require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const admin = await db.collection('admins').findOne({ email: 'admin@altincag.com' });

  if (admin) {
    const hash = await bcrypt.hash('Admin123!', 12);
    await db.collection('admins').updateOne(
      { email: 'admin@altincag.com' },
      { $set: { password: hash } }
    );
    console.log('Admin sifresi guncellendi');
  } else {
    const hash = await bcrypt.hash('Admin123!', 12);
    await db.collection('admins').insertOne({
      email: 'admin@altincag.com',
      password: hash,
      name: 'Admin',
      createdAt: new Date(),
    });
    console.log('Admin olusturuldu');
  }

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
