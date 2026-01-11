const mongoose = require('mongoose');

// Schemat dokumentu - przechowuje metadane pliku i informacje o jego statusie
const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    default: 'Nieprzypisane'
  },
  status: {
    type: String,
    enum: ['Szkic', 'Do akceptacji', 'Zatwierdzony', 'Zarchiwizowany'],
    default: 'Szkic'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indeks dla szybszego wyszukiwania dokumentów danego użytkownika
DocumentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', DocumentSchema);