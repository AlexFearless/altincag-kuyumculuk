import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  adminEmail: { type: String, required: true },
  targetType: { type: String, enum: ['user', 'product', 'order', 'message', 'discount', 'system'] },
  targetId: String,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
}, { timestamps: true });

LogSchema.index({ createdAt: -1 });
LogSchema.index({ adminEmail: 1 });

export default mongoose.models.Log || mongoose.model('Log', LogSchema);
