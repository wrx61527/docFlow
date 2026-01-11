/* ===== DOKUMENTY - POPRAWIONE ===== */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const Document = require('../models/Document');
const classify = require('../utils/classifier');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Middleware autoryzacji
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Brak tokena');
  next();
};

// UPLOAD DOKUMENTU
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku' });
    }

    const safeFilename = Buffer.from(
      req.file.originalname,
      'latin1'
    ).toString('utf8');

    const category = await classify(req.file.path, safeFilename);

    const doc = new Document({
      filename: safeFilename,
      path: req.file.path,
      category,
      status: 'Szkic',
      uploadedBy: req.user?.id || 'unknown'
    });

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POBRANIE WSZYSTKICH DOKUMENTÓW
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find();
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POBIERZ DOKUMENT DO POBRANIA
router.get('/download/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Dokument nie znaleziony' });
    res.download(doc.path, doc.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ZMIANA STATUSU DOKUMENTU
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status jest wymagany' });
    }

    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: 'Dokument nie znaleziony' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// USUWANIE DOKUMENTU
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Dokument nie znaleziony' });

    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Dokument usunięty' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REKLASYFIKACJA WSZYSTKICH DOKUMENTÓW
router.post('/reclassify', auth, async (req, res) => {
  try {
    const docs = await Document.find();
    for (const doc of docs) {
      if (fs.existsSync(doc.path)) {
        const newCategory = await classify(doc.path, doc.filename);
        doc.category = newCategory;
        await doc.save();
      }
    }
    res.json({ message: 'Reklasyfikacja zakończona' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;