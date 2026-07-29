import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ürün adı zorunludur'],
      trim: true,
      maxlength: [200, 'Ürün adı 200 karakterden uzun olamaz'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Açıklama 2000 karakterden uzun olamaz'],
    },
    price: {
      type: Number,
      required: [true, 'Fiyat zorunludur'],
      min: [0, 'Fiyat negatif olamaz'],
    },
    discountedPrice: {
      type: Number,
      default: 0,
      min: [0, 'İndirimli fiyat negatif olamaz'],
    },
    category: {
      type: String,
      required: [true, 'Kategori zorunludur'],
      enum: [
        'yuzuk',
        'kolye',
        'bileklik',
        'kelepce',
        'kupe',
        'zincir',
        'set',
      ],
    },
    images: [
      {
        type: String,
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stok negatif olamaz'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    karat: {
      type: String,
      enum: ['14', '18', '22', '24', ''],
      default: '',
    },
    weight: {
      type: Number,
      default: 0,
    },
    material: {
      type: String,
      default: '',
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountType: {
      type: String,
      enum: ['real', 'fake', ''],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (this.discountPercent > 0 && this.discountType === 'real') {
    this.discountedPrice = this.price * (1 - this.discountPercent / 100);
  } else {
    this.discountedPrice = 0;
  }
  next();
});

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
