const express = require('express');
const multer = require('multer');
const fs = require('fs');
const Document = require('../models/Document');
const classify = require('../utils/classifier');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  const safeFilename = Buffer.from(
    req.file.originalname,
    'latin1'
  ).toString('utf8');

  const category = await classify(req.file.path, safeFilename);

  const doc = new Document({
    filename: safeFilename,
    path: req.file.path,
    category
  });

  await doc.save();
  res.send(doc);
});

router.get('/', async (req, res) => {
  res.send(await Document.find());
});

router.get('/download/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.download(doc.path, doc.filename);
});

router.delete('/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (fs.existsSync(doc.path)) fs.unlinkSync(doc.path);
  await doc.deleteOne();
  res.sendStatus(204);
});

router.post('/reclassify', async (req, res) => {
  const docs = await Document.find();

  for (const doc of docs) {
    const newCategory = await classify(doc.path, doc.filename);
    doc.category = newCategory;
    await doc.save();
  }

  res.send({ message: 'Reklasyfikacja zakończona' });
});

router.put('/:id/status', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.sendStatus(404);

  doc.status = req.body.status;
  await doc.save();

  res.send(doc);
});


module.exports = router;
