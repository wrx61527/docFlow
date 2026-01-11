const mongoose = require('mongoose');

module.exports = mongoose.model('Document', new mongoose.Schema({
  filename: String,
  path: String,
  category: String,
  status: { type: String, default: 'Szkic' },
  createdAt: { type: Date, default: Date.now }
}));
