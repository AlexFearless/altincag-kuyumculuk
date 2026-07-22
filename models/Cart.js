import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const CartSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: String,
    items: [CartItemSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CartSchema.index({ guestId: 1 });
CartSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema);
