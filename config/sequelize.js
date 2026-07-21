const { Sequelize } = require('sequelize');
const config = require('./database.js');

// Déterminer l'environnement
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Créer l'instance Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions || {}
  }
);

// Test de connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Connexion Sequelize réussie à la base de données ${dbConfig.database} (${env})`);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Sequelize:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize
};