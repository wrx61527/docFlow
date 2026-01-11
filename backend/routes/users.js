const express = require('express');
const User = require('../models/User');

const router = express.Router();

/* LISTA UŻYTKOWNIKÓW */
router.get('/', async (req, res) => {
  const users = await User.find({}, { password: 0 });
  res.json(users);
});

/* ZMIANA ROLI */
router.put('/:id/role', async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).send('Nieprawidłowa rola');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );

  res.json(user);
});

/* USUWANIE UŻYTKOWNIKA */
router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

/* ⬇⬇⬇ TO JEST KLUCZOWA LINIA ⬇⬇⬇ */
module.exports = router;
