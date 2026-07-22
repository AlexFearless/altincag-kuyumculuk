require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/altincag_kuyumculuk';

const AdminSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  isActive: Boolean,
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  isActive: Boolean,
  ipAddress: String,
  lastLoginIp: String,
  address: {
    street: String,
    city: String,
    district: String,
    zipCode: String,
  },
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
const User = mongoose.model('User', UserSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    const adminEmail = 'admin@altincag.com';
    const adminPlainPassword = 'Admin123!';

    const admin = await Admin.findOne({ email: adminEmail });
    if (admin) {
      admin.password = adminPlainPassword;
      await admin.save();
      console.log('Admin şifresi düz metin olarak güncellendi');
    } else {
      await Admin.create({
        email: adminEmail,
        password: adminPlainPassword,
        name: 'Admin',
        role: 'superadmin',
        isActive: true,
      });
      console.log('Admin kullanıcısı oluşturuldu (düz metin şifre)');
    }

    const users = await User.find({});
    console.log(`${users.length} kullanıcı bulundu`);

    process.exit(0);
  } catch (error) {
    console.error('Migration hatası:', error);
    process.exit(1);
  }
}

migrate();
