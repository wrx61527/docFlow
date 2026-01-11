const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const classify = require('../utils/classifier');
const router = express.Router();

/* ====================================================== KONFIGURACJA MULTER ====================================================== */
const uploadsDir = path.join(__dirname, '../uploads');

// Tworzenie katalogu uploads jeśli nie istnieje
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Zachowanie oryginalnej nazwy pliku
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit 50MB
  fileFilter: (req, file, cb) => {
    // Dozwolone typy MIME
    const allowedMimes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nieobsługiwany typ pliku'));
    }
  }
});

/* ====================================================== PRZESŁANIE I KLASYFIKACJA DOKUMENTU ====================================================== */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak przesłanego pliku' });
    }

    // Automatyczna klasyfikacja dokumentu
    const category = await classify(req.file.path, req.file.originalname);

    // Tworzenie rekordu dokumentu w bazie danych
    const newDocument = new Document({
      filename: req.file.originalname,
      path: req.file.path,
      userId: req.userId, // Z middleware weryfikacji JWT
      category: category,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'Szkic'
    });

    await newDocument.save();

    res.status(201).json({
      message: 'Dokument został przesłany i sklasyfikowany',
      document: {
        id: newDocument._id,
        filename: newDocument.filename,
        category: newDocument.category,
        status: newDocument.status,
        createdAt: newDocument.createdAt
      }
    });
  } catch (error) {
    console.error('Błąd przesyłania dokumentu:', error);
    res.status(500).json({ error: 'Błąd serwera podczas przesyłania dokumentu' });
  }
});

/* ====================================================== POBRANIE LISTY DOKUMENTÓW UŻYTKOWNIKA ====================================================== */
router.get('/', async (req, res) => {
  try {
    // Pobranie dokumentów tylko zalogowanego użytkownika
    const documents = await Document.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-path'); // Nie wysyłamy ścieżki do klienta

    res.json({
      count: documents.length,
      documents: documents
    });
  } catch (error) {
    console.error('Błąd pobierania dokumentów:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania dokumentów' });
  }
});

/* ====================================================== POBRANIE DOKUMENTU DO ŚCIĄGNIĘCIA ====================================================== */
router.get('/download/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Dokument nie znaleziony' });
    }

    // Weryfikacja że użytkownik jest właścicielem dokumentu
    if (document.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego dokumentu' });
    }

    // Sprawdzenie czy plik istnieje
    if (!fs.existsSync(document.path)) {
      return res.status(404).json({ error: 'Plik nie istnieje na serwerze' });
    }

    // Wysłanie pliku do pobrania
    res.download(document.path, document.filename);
  } catch (error) {
    console.error('Błąd pobierania dokumentu:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania dokumentu' });
  }
});

/* ====================================================== USUNIĘCIE DOKUMENTU ====================================================== */
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Dokument nie znaleziony' });
    }

    // Weryfikacja że użytkownik jest właścicielem dokumentu
    if (document.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego dokumentu' });
    }

    // Usunięcie pliku z dysku
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    // Usunięcie rekordu z bazy danych
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Dokument został usunięty' });
  } catch (error) {
    console.error('Błąd usuwania dokumentu:', error);
    res.status(500).json({ error: 'Błąd serwera podczas usuwania dokumentu' });
  }
});

/* ====================================================== ZMIANA STATUSU DOKUMENTU ====================================================== */
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Szkic', 'Do akceptacji', 'Zatwierdzony', 'Zarchiwizowany'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Nieprawidłowy status. Dozwolone: ' + validStatuses.join(', ') 
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Dokument nie znaleziony' });
    }

    // Weryfikacja że użytkownik jest właścicielem dokumentu
    if (document.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Brak dostępu do tego dokumentu' });
    }

    document.status = status;
    document.updatedAt = new Date();
    await document.save();

    res.json({
      message: 'Status dokumentu został zaktualizowany',
      document: document
    });
  } catch (error) {
    console.error('Błąd zmiany statusu dokumentu:', error);
    res.status(500).json({ error: 'Błąd serwera podczas zmiany statusu dokumentu' });
  }
});

/* ====================================================== REKLASYFIKACJA WSZYSTKICH DOKUMENTÓW ====================================================== */
router.post('/admin/reclassify-all', async (req, res) => {
  try {
    const allDocuments = await Document.find();
    let updatedCount = 0;

    for (const doc of allDocuments) {
      const newCategory = await classify(doc.path, doc.filename);
      if (doc.category !== newCategory) {
        doc.category = newCategory;
        await doc.save();
        updatedCount++;
      }
    }

    res.json({
      message: 'Reklasyfikacja zakończona',
      totalDocuments: allDocuments.length,
      updatedDocuments: updatedCount
    });
  } catch (error) {
    console.error('Błąd reklasyfikacji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas reklasyfikacji' });
  }
});

module.exports = router;