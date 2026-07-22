require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  console.log(`${users.length} kullanıcı bulundu`);

  let fixed = 0;
  for (const user of users) {
    // bcrypt hash'ler $2a$ veya $2b$ ile başlar
    if (user.password && !user.password.startsWith('$2')) {
      const hash = await bcrypt.hash(user.password, 12);
      await db.collection('users').updateOne({ _id: user._id }, { $set: { password: hash } });
      console.log(`Düzeltilen: ${user.email}`);
      fixed++;
    }
  }
  console.log(`${fixed} şifre hash' olarak güncellendi`);
  process.exit(0);
}
migrate().catch(e => { console.error(e); process.exit(1); });
