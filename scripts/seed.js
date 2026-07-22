require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/altincag_kuyumculuk';

const AdminSchema = new mongoose.Schema({
  email: String, password: String, name: String, role: String, isActive: Boolean,
}, { timestamps: true });

AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String, price: Number, discountedPrice: Number,
  category: String, images: [String], stock: Number, isActive: Boolean, isFeatured: Boolean,
  karat: String, weight: Number, material: String, discountPercent: Number, discountType: String,
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
const Product = mongoose.model('Product', ProductSchema);

const sampleProducts = [
  { name: '22 Ayar Altın Nişan Yüzüğü', slug: '22-ayar-altin-nisan-yuzugu', description: 'Zarif tasarımıyla 22 ayar altın nişan yüzüğü.', price: 45000, category: 'yuzuk', stock: 15, karat: '22', weight: 8.5, material: 'Altın', isFeatured: true, discountPercent: 0, discountType: '', isActive: true, images: [] },
  { name: '18 Ayar Altın Kolye', slug: '18-ayar-altin-kolye', description: 'Zarif 18 ayar altın kolye.', price: 32000, category: 'kolye', stock: 20, karat: '18', weight: 6.2, material: 'Altın', isFeatured: true, discountPercent: 5, discountType: 'real', isActive: true, images: [] },
  { name: 'Altın Bileklik', slug: 'altin-bileklik', description: 'Zarif altın bileklik.', price: 28000, category: 'bileklik', stock: 12, karat: '18', weight: 7.8, material: 'Altın', isFeatured: true, discountPercent: 0, discountType: '', isActive: true, images: [] },
  { name: 'Altın Kelepçe Bileklik', slug: 'altin-kelepce-bileklik', description: 'Modern tasarımlı altın kelepçe bileklik.', price: 35000, category: 'kelepce', stock: 8, karat: '22', weight: 12.5, material: 'Altın', isFeatured: true, discountPercent: 10, discountType: 'fake', isActive: true, images: [] },
  { name: 'Altın Küpe', slug: 'altin-kupe', description: 'Zarif altın küpe.', price: 18000, category: 'kupe', stock: 25, karat: '18', weight: 3.2, material: 'Altın', isFeatured: true, discountPercent: 0, discountType: '', isActive: true, images: [] },
  { name: '22 Ayar Altın Zincir', slug: '22-ayar-altin-zincir', description: 'Sağlıklı ve dayanıklı 22 ayar altın zincir.', price: 42000, category: 'zincir', stock: 10, karat: '22', weight: 15.0, material: 'Altın', isFeatured: false, discountPercent: 0, discountType: '', isActive: true, images: [] },
  { name: 'Altın Takı Seti', slug: 'altin-taki-seti', description: 'Tamamlayıcı parçalardan oluşan altın takı seti.', price: 95000, category: 'set', stock: 5, karat: '22', weight: 28.0, material: 'Altın', isFeatured: true, discountPercent: 5, discountType: 'real', isActive: true, images: [] },
  { name: '14 Ayar Altın Yüzük', slug: '14-ayar-altin-yuzuk', description: 'Bütçe dostu 14 ayar altın yüzük.', price: 15000, category: 'yuzuk', stock: 30, karat: '14', weight: 4.5, material: 'Altın', isFeatured: false, discountPercent: 0, discountType: '', isActive: true, images: [] },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@altincag.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Admin.create({ email: adminEmail, password: adminPassword, name: 'Admin', role: 'superadmin', isActive: true });
      console.log('Admin kullanıcısı oluşturuldu');
    } else {
      console.log('Admin kullanıcısı zaten mevcut');
    }

    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
      await Product.insertMany(sampleProducts);
      console.log(`${sampleProducts.length} örnek ürün eklendi`);
    } else {
      console.log(`${existingProducts} ürün zaten mevcut`);
    }

    console.log('Seed tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('Seed hatası:', error);
    process.exit(1);
  }
}
seed();
