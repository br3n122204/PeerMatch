const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  message: { type: String, required: true, trim: true, maxlength: 10000 },
  timestamp: { type: Date, default: Date.now, index: true },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent',
    index: true,
  },
  seenAt: { type: Date, default: null, index: true },
  unsent: { type: Boolean, default: false, index: true },
  removedForUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  /** Viewer hid an incoming message — omitted from their thread entirely (no tombstone). */
  vanishedForUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      emoji: { type: String, required: true, trim: true, maxlength: 8 },
    },
  ],
  replyToMessageId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  replyPreview: { type: String, default: '', trim: true, maxlength: 500 },
  forwardedFromPreview: { type: String, default: '', trim: true, maxlength: 500 },
});

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, status: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);
