const express = require('express');
const Category = require('../models/Category');

const router = express.Router();

/* CREATE */
router.post('/', async (req, res) => {
  const exists = await Category.findOne({ name: req.body.name });
  if (exists) {
    return res.status(400).send('Kategoria już istnieje');
  }

  const cat = new Category({
    name: req.body.name,
    keywords: req.body.keywords
  });

  await cat.save();
  res.send(cat);
});

/* READ */
router.get('/', async (req, res) => {
  res.send(await Category.find());
});

/* UPDATE */
router.put('/:id', async (req, res) => {
  const { name, keywords } = req.body;

  const existing = await Category.findOne({
    name: name,
    _id: { $ne: req.params.id }
  });

  if (existing) {
    return res.status(400).send('Kategoria o tej nazwie już istnieje');
  }

  const updated = await Category.findByIdAndUpdate(
    req.params.id,
    { name, keywords },
    { new: true }
  );

  res.send(updated);
});

/* DELETE */
router.delete('/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
