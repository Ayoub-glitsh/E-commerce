require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importation des routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./controllers/cartController');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Configuration des middlewares globaux
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Configuration des routes principales
 */

// Route de santé de l'API
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '3LM-Solutions E-commerce API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes du panier (existantes)
app.use('/api/cart', cartRoutes);

// Route de test de la base de données
app.get('/api/test-db', async (req, res) => {
  try {
    const { User } = require('../models');
    const count = await User.count();
    res.status(200).json({
      success: true,
      message: 'Connexion à la base de données réussie',
      data: {
        userCount: count,
        database: 'PostgreSQL (Neon)',
        orm: 'Sequelize + Prisma'
      }
    });
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    availableEndpoints: [
      'GET /health',
      'GET /api/test-db',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'POST /api/auth/refresh', 
      'GET /api/auth/me',
      'GET /api/auth/verify',
      'GET /api/cart',
      'POST /api/cart/add',
      'PUT /api/cart/update',
      'DELETE /api/cart/remove',
      'DELETE /api/cart/clear'
    ]
  });
});

// Middleware global de gestion d'erreurs
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

/**
 * Démarrage du serveur
 */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║        3LM-Solutions E-commerce        ║
║              API Server                ║
╠════════════════════════════════════════╣
║ Port: ${PORT.toString().padEnd(30)} ║
║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(21)} ║
║ Database: PostgreSQL (Neon)           ║
║ ORM: Sequelize + Prisma                ║
╚════════════════════════════════════════╝
    `);
    
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`🔗 API Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 Authentication endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`🛒 Cart endpoint: http://localhost:${PORT}/api/cart`);
  });
}

module.exports = app;