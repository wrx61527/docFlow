const mongoose = require('mongoose');

// Schemat kategorii dokumentów - definiuje kategorie oraz słowa kluczowe
// używane w procesie automatycznej klasyfikacji treści dokumentów
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  keywords: [
    {
      type: String,
      lowercase: true,
      trim: true
    }
  ],
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook do czyszczenia słów kluczowych
CategorySchema.pre('save', function(next) {
  this.keywords = this.keywords.filter(k => k && k.length > 0);
  next();
});

module.exports = mongoose.model('Category', CategorySchema);