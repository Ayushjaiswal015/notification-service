const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['email', 'sms', 'in-app'], required: true },
  message: { type: String, required: true },
  recipient: { type: String }, // <-- Added for email/SMS
  title: { type: String },     // <-- Optional, for email/in-app
  status: { type: String, default: 'pending' },
  metadata: { type: Object },  // <-- Optional, for extra info/errors
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Notification', notificationSchema);
