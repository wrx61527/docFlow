const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET = 'docflow_secret';

/* ======================================================
   WALIDACJA
====================================================== */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // --- NOWE: walidacja danych wejściowych ---
  if (!email || !password) {
    return res.status(400).send('Email i hasło są wymagane');
  }

  if (!emailRegex.test(email)) {
    return res.status(400).send('Nieprawidłowy adres e-mail');
  }
  // ----------------------------------------

  if (await User.findOne({ email }))
    return res.status(400).send('Użytkownik już istnieje');

  await new User({
    email,
    password: bcrypt.hashSync(password, 8)
  }).save();

  res.send('Zarejestrowano');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // --- NOWE: podstawowa walidacja ---
  if (!email || !password) {
    return res.status(400).send('Email i hasło są wymagane');
  }
  // ---------------------------------

  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).send('Błędne dane');

  res.send({
    token: jwt.sign({ id: user._id, role: user.role }, SECRET),
    email: user.email,
    role: user.role
  });
});

module.exports = router;
