const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  encryptedTitle: { type: String, required: true },
  encryptedContent: { type: String, required: true },

  // Title encryption params
  iv: { type: String, required: true },
  salt: { type: String, required: true },

  // Content encryption params (separate IV, same password)
  contentIv: { type: String, required: true },
  contentSalt: { type: String, required: true },

  color: { type: String, default: '#3fb950' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);