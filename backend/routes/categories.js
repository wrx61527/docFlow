const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

/* ====================================================== TWORZENIE NOWEJ KATEGORII ====================================================== */
router.post('/', async (req, res) => {
  try {
    const { name, keywords, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nazwa kategorii jest wymagana' });
    }

    // Sprawdzenie czy kategoria już istnieje
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ error: 'Kategoria o tej nazwie już istnieje' });
    }

    // Tworzenie nowej kategorii
    const newCategory = new Category({
      name,
      keywords: keywords || [],
      description: description || ''
    });

    await newCategory.save();

    res.status(201).json({
      message: 'Kategoria została utworzona',
      category: newCategory
    });
  } catch (error) {
    console.error('Błąd tworzenia kategorii:', error);
    res.status(500).json({ error: 'Błąd serwera podczas tworzenia kategorii' });
  }
});

/* ====================================================== POBRANIE WSZYSTKICH KATEGORII ====================================================== */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.json({
      count: categories.length,
      categories: categories
    });
  } catch (error) {
    console.error('Błąd pobierania kategorii:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania kategorii' });
  }
});

/* ====================================================== AKTUALIZACJA KATEGORII ====================================================== */
router.put('/:id', async (req, res) => {
  try {
    const { name, keywords, description } = req.body;

    // Sprawdzenie czy nowa nazwa nie koliduje z inną kategorią
    if (name) {
      const existingCategory = await Category.findOne({
        name: name,
        _id: { $ne: req.params.id } // Wyklucz bieżącą kategorię
      });

      if (existingCategory) {
        return res.status(400).json({ 
          error: 'Kategoria o tej nazwie już istnieje' 
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (keywords) updateData.keywords = keywords;
    if (description !== undefined) updateData.description = description;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Kategoria nie znaleziona' });
    }

    res.json({
      message: 'Kategoria została zaktualizowana',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Błąd aktualizacji kategorii:', error);
    res.status(500).json({ error: 'Błąd serwera podczas aktualizacji kategorii' });
  }
});

/* ====================================================== USUNIĘCIE KATEGORII ====================================================== */
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Kategoria nie znaleziona' });
    }

    res.json({
      message: 'Kategoria została usunięta',
      category: category
    });
  } catch (error) {
    console.error('Błąd usuwania kategorii:', error);
    res.status(500).json({ error: 'Błąd serwera podczas usuwania kategorii' });
  }
});

module.exports = router;