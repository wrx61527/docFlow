const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'docflow_secret_key_2026';
const SALT_ROUNDS = 8;

/* ====================================================== WALIDACJA EMAIL ====================================================== */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ====================================================== REJESTRACJA UŻYTKOWNIKA ====================================================== */
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Walidacja danych wejściowych
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email i hasło są wymagane' 
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Nieprawidłowy format adresu e-mail' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Hasło musi mieć co najmniej 6 znaków' 
      });
    }

    // Sprawdzenie czy użytkownik już istnieje
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Użytkownik o tym adresie e-mail już istnieje' 
      });
    }

    // Haszowanie hasła
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Tworzenie nowego użytkownika
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user' // Domyślna rola
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'Konto zostało pomyślnie utworzone. Możesz się zalogować.' 
    });
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    res.status(500).json({ 
      error: 'Błąd serwera podczas rejestracji' 
    });
  }
});

/* ====================================================== LOGOWANIE UŻYTKOWNIKA ====================================================== */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Walidacja danych wejściowych
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email i hasło są wymagane' 
      });
    }

    // Wyszukanie użytkownika w bazie
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Nieprawidłowe dane logowania' 
      });
    }

    // Weryfikacja hasła
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Nieprawidłowe dane logowania' 
      });
    }

    // Generowanie JWT tokena
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      email: user.email,
      role: user.role,
      userId: user._id,
      message: 'Zalogowano pomyślnie'
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ 
      error: 'Błąd serwera podczas logowania' 
    });
  }
});

/* ====================================================== WERYFIKACJA TOKENA ====================================================== */
router.post('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Brak tokena autoryzacji' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      valid: true, 
      userId: decoded.id,
      role: decoded.role,
      email: decoded.email
    });
  } catch (error) {
    res.status(401).json({ 
      error: 'Nieprawidłowy lub wygasły token' 
    });
  }
});

module.exports = router;