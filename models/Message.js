import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ad zorunludur'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'E-posta zorunludur'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Konu zorunludur'],
    },
    message: {
      type: String,
      required: [true, 'Mesaj zorunludur'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    replies: [
      {
        sender: { type: String, enum: ['admin', 'user'], required: true },
        senderName: { type: String, default: '' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
