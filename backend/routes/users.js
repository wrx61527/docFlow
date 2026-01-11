const express = require('express');
const User = require('../models/User');
const router = express.Router();

/* ====================================================== POBRANIE LISTY WSZYSTKICH UŻYTKOWNIKÓW ====================================================== */
// Endpoint dostępny tylko dla administratorów (middleware verifyAdmin w server.js)
router.get('/', async (req, res) => {
  try {
    // Pobieranie wszystkich użytkowników bez haseł
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Błąd pobierania użytkowników:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania użytkowników' });
  }
});

/* ====================================================== POBRANIE SZCZEGÓŁÓW KONKRETNEGO UŻYTKOWNIKA ====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json(user);
  } catch (error) {
    console.error('Błąd pobierania użytkownika:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania użytkownika' });
  }
});

/* ====================================================== ZMIANA ROLI UŻYTKOWNIKA ====================================================== */
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    // Walidacja roli
    const validRoles = ['user', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Nieprawidłowa rola. Dozwolone: ' + validRoles.join(', ') 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json({
      message: 'Rola użytkownika została zmieniona',
      user: user
    });
  } catch (error) {
    console.error('Błąd zmiany roli użytkownika:', error);
    res.status(500).json({ error: 'Błąd serwera podczas zmiany roli' });
  }
});

/* ====================================================== USUNIĘCIE UŻYTKOWNIKA ====================================================== */
router.delete('/:id', async (req, res) => {
  try {
    // Zapobieganie samousunięciu
    if (req.params.id === req.userId) {
      return res.status(400).json({ 
        error: 'Nie można usunąć własnego konta' 
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    res.json({
      message: 'Użytkownik został usunięty',
      deletedUser: user.email
    });
  } catch (error) {
    console.error('Błąd usuwania użytkownika:', error);
    res.status(500).json({ error: 'Błąd serwera podczas usuwania użytkownika' });
  }
});

module.exports = router;