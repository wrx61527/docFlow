/* ===== KATEGORIE - POPRAWIONE ===== */

const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// Middleware autoryzacji
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Brak tokena');
  next();
};

// CREATE - DODAJ KATEGORIĘ
router.post('/', auth, async (req, res) => {
  try {
    const { name, keywords } = req.body;

    if (!name || !keywords || keywords.length === 0) {
      return res.status(400).json({ error: 'Nazwa i słowa kluczowe są wymagane' });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ error: 'Kategoria już istnieje' });
    }

    const cat = new Category({ name, keywords });
    await cat.save();
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - POBIERZ WSZYSTKIE KATEGORIE
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - EDYTUJ KATEGORIĘ
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, keywords } = req.body;

    if (!name || !keywords || keywords.length === 0) {
      return res.status(400).json({ error: 'Nazwa i słowa kluczowe są wymagane' });
    }

    const existing = await Category.findOne({
      name: name,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.status(400).json({ error: 'Kategoria o tej nazwie już istnieje' });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, keywords },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Kategoria nie znaleziona' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - USUŃ KATEGORIĘ
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Kategoria nie znaleziona' });
    }

    res.json({ message: 'Kategoria usunięta' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;