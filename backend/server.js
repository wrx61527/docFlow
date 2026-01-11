const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ROUTES
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== MONGODB POŁĄCZENIE ===== */
mongoose
  .connect('mongodb://127.0.0.1:27017/docflow')
  .then(() => console.log('✓ Połączono z MongoDB - DocFlow'))
  .catch(err => console.error('✗ Błąd połączenia z MongoDB:', err));

/* ===== MIDDLEWARE - WERYFIKACJA JWT ===== */
// Middleware do weryfikacji tokena JWT w protected routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokena autoryzacji' });
  }
  
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'docflow_secret_key_2026');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

// Middleware do weryfikacji roli administratora
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Dostęp tylko dla administratorów' });
  }
  next();
};

/* ===== ROUTING ===== */
app.use('/api/auth', authRoutes);
app.use('/api/categories', verifyToken, categoryRoutes);
app.use('/api/documents', verifyToken, documentRoutes);
app.use('/api/users', verifyToken, verifyAdmin, userRoutes);

// Export middleware dla użytku w innych plikach
app.verifyToken = verifyToken;
app.verifyAdmin = verifyAdmin;

/* ===== SERVER ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 DocFlow backend uruchomiony na http://localhost:${PORT}`);
  console.log(`📁 Baza danych: MongoDB (localhost:27017/docflow)`);
  console.log(`📂 Przechowywanie plików: ./uploads`);
});

module.exports = app;