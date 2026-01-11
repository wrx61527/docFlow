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

/* ===== MONGODB ===== */
mongoose
  .connect('mongodb://127.0.0.1:27017/docflow')
  .then(() => console.log('Połączono z MongoDB'))
  .catch(err => console.error('Błąd połączenia z MongoDB:', err));

/* ===== ROUTING ===== */
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

/* ===== SERVER ===== */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`DocFlow backend działa na porcie ${PORT}`);
});