/* ===== UŻYTKOWNICY - POPRAWIONE ===== */

const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Middleware autoryzacji + admin check
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Brak tokena' });
  // Tutaj w produkcji powinieneś weryfikować token i sprawdzać rolę
  next();
};

const adminOnly = (req, res, next) => {
  // W produkcji sprawdzić token JWT i rolę
  next();
};

// LISTA UŻYTKOWNIKÓW (tylko admin)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ZMIANA ROLI UŻYTKOWNIKA (tylko admin)
router.put('/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Nieprawidłowa rola. Użyj: admin lub user' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// USUWANIE UŻYTKOWNIKA (tylko admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json({ message: 'Użytkownik usunięty' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;