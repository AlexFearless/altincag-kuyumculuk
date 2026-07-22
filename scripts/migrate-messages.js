const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

async function migrateMessages() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false, timestamps: true }));

  const messages = await Message.find({});
  let fixed = 0;
  for (const msg of messages) {
    const update = {};
    if (!Array.isArray(msg.replies)) update.replies = [];
    if (!msg.status) update.status = 'open';
    if (Object.keys(update).length > 0) {
      await Message.updateOne({ _id: msg._id }, { $set: update });
      fixed++;
    }
  }
  console.log(`${fixed} mesaj düzeltildi (replies + status eklendi)`);
  process.exit(0);
}

migrateMessages().catch(e => { console.error(e); process.exit(1); });
