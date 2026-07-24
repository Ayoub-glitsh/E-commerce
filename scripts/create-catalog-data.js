#!/usr/bin/env node

/**
 * Script pour créer des données de test du catalogue
 * Utilise les modèles Sequelize directement
 */

require('dotenv').config();
const { Product, Category, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function createCatalogData() {
  console.log('🚀 Création des données de test du catalogue...\n');

  try {
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données : OK\n');

    // Nettoyer les données existantes
    console.log('🧹 Nettoyage des données existantes...');
    await Product.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    console.log('✅ Données existantes supprimées\n');

    // === CRÉATION DES CATÉGORIES ===
    console.log('📂 Création des catégories...');
    
    const categories = await Category.bulkCreate([
      {
        id: uuidv4(),
        name: 'Électronique',
        description: 'Smartphones, ordinateurs, tablettes et accessoires électroniques'
      },
      {
        id: uuidv4(),
        name: 'Vêtements',
        description: 'Mode masculine et féminine, chaussures et accessoires'
      },
      {
        id: uuidv4(),
        name: 'Maison & Jardin',
        description: 'Décoration, meubles, outils de jardinage et électroménager'
      },
      {
        id: uuidv4(),
        name: 'Sports & Loisirs',
        description: 'Équipements sportifs, jeux et articles de loisirs'
      },
      {
        id: uuidv4(),
        name: 'Livres & Média',
        description: 'Livres, films, musique et produits culturels'
      }
    ], { returning: true });

    console.log(`✅ ${categories.length} catégories créées`);

    // === CRÉATION DES PRODUITS ===
    console.log('\n📦 Création des produits...');

    const products = [];

    // ÉLECTRONIQUE
    products.push({
      id: uuidv4(),
      name: 'iPhone 15 Pro Max',
      description: 'Le dernier iPhone avec processeur A17 Pro, écran Super Retina XDR de 6.7 pouces et caméra triple 48MP. Disponible en plusieurs coloris.',
      price: 1199.99,
      categoryId: categories[0].id,
      stock: 25,
      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
      tags: ['smartphone', 'apple', 'premium', '5G', 'camera'],
      isActive: true,
      ratingAvg: 4.8,
      ratingCount: 127
    });

    products.push({
      id: uuidv4(),
      name: 'MacBook Pro 16"',
      description: 'Ordinateur portable professionnel avec puce M3 Pro, 18GB de RAM et SSD 512GB. Parfait pour les créatifs et développeurs.',
      price: 2499.99,
      categoryId: categories[0].id,
      stock: 12,
      images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800'],
      tags: ['laptop', 'apple', 'professional', 'M3'],
      isActive: true,
      ratingAvg: 4.9,
      ratingCount: 89
    });

    products.push({
      id: uuidv4(),
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Smartphone Android premium avec S Pen intégré, écran Dynamic AMOLED 6.8" et caméra 200MP avec zoom optique 10x.',
      price: 1299.99,
      categoryId: categories[0].id,
      stock: 18,
      images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800'],
      tags: ['smartphone', 'samsung', 'android', 'S-Pen'],
      isActive: true,
      ratingAvg: 4.7,
      ratingCount: 203
    });

    // VÊTEMENTS
    products.push({
      id: uuidv4(),
      name: 'Jean Slim Fit Premium',
      description: 'Jean en denim italien de haute qualité, coupe slim moderne. Lavage stone wash pour un look décontracté élégant.',
      price: 89.99,
      categoryId: categories[1].id,
      stock: 50,
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'],
      tags: ['jean', 'denim', 'slim', 'casual'],
      isActive: true,
      ratingAvg: 4.4,
      ratingCount: 156
    });

    products.push({
      id: uuidv4(),
      name: 'Sneakers Running Pro',
      description: 'Chaussures de course haute performance avec amorti responsive et mesh respirant. Idéales pour le running et fitness.',
      price: 129.99,
      categoryId: categories[1].id,
      stock: 35,
      images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
      tags: ['sneakers', 'running', 'sport', 'comfortable'],
      isActive: true,
      ratingAvg: 4.6,
      ratingCount: 284
    });

    // MAISON & JARDIN
    products.push({
      id: uuidv4(),
      name: 'Canapé 3 Places Scandinave',
      description: 'Canapé design scandinave en tissu gris clair, structure en bois de hêtre. Confortable et élégant pour votre salon.',
      price: 599.99,
      categoryId: categories[2].id,
      stock: 8,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
      tags: ['canapé', 'scandinave', 'salon', 'design'],
      isActive: true,
      ratingAvg: 4.5,
      ratingCount: 67
    });

    // SPORTS & LOISIRS
    products.push({
      id: uuidv4(),
      name: 'Vélo Électrique Urban',
      description: 'Vélo électrique urbain avec batterie 500Wh, autonomie 80km. Parfait pour les trajets quotidiens en ville.',
      price: 1599.99,
      categoryId: categories[3].id,
      stock: 6,
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800'],
      tags: ['vélo', 'électrique', 'urbain', 'batterie'],
      isActive: true,
      ratingAvg: 4.7,
      ratingCount: 45
    });

    // LIVRES & MÉDIA
    products.push({
      id: uuidv4(),
      name: 'Clean Code (Livre)',
      description: 'Guide essentiel pour écrire du code propre et maintenable. Un classique pour tous les développeurs.',
      price: 45.99,
      categoryId: categories[4].id,
      stock: 30,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'],
      tags: ['livre', 'programmation', 'développement', 'clean-code'],
      isActive: true,
      ratingAvg: 4.9,
      ratingCount: 312
    });

    // PRODUIT EN RUPTURE DE STOCK
    products.push({
      id: uuidv4(),
      name: 'Console Gaming Next-Gen',
      description: 'Console de jeu dernière génération avec SSD ultra-rapide et ray tracing. Expérience gaming immersive.',
      price: 499.99,
      categoryId: categories[0].id,
      stock: 0, // RUPTURE DE STOCK
      images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800'],
      tags: ['console', 'gaming', 'next-gen', 'SSD'],
      isActive: true,
      ratingAvg: 4.9,
      ratingCount: 189
    });

    // PRODUIT INACTIF
    products.push({
      id: uuidv4(),
      name: 'Produit Test Inactif',
      description: 'Ce produit est inactif et ne devrait pas apparaître dans les résultats publics.',
      price: 99.99,
      categoryId: categories[0].id,
      stock: 10,
      images: ['https://via.placeholder.com/400x300'],
      tags: ['test', 'inactif'],
      isActive: false, // PRODUIT INACTIF
      ratingAvg: 0,
      ratingCount: 0
    });

    const createdProducts = [];
    for (const productData of products) {
      const product = await Product.create(productData);
      createdProducts.push(product);
    }

    console.log(`✅ ${createdProducts.length} produits créés`);

    // === RÉSUMÉ FINAL ===
    console.log('\n📊 === RÉSUMÉ DES DONNÉES CRÉÉES ===');
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const productCount = createdProducts.filter(p => p.categoryId === category.id).length;
      console.log(`📂 ${category.name}: ${productCount} produit(s)`);
    }

    const activeProducts = createdProducts.filter(p => p.isActive).length;
    const inactiveProducts = createdProducts.filter(p => !p.isActive).length;
    const outOfStock = createdProducts.filter(p => p.stock === 0 && p.isActive).length;

    console.log(`\n📈 Statistiques:`);
    console.log(`   - Produits actifs: ${activeProducts}`);
    console.log(`   - Produits inactifs: ${inactiveProducts}`);
    console.log(`   - Produits en rupture: ${outOfStock}`);

    console.log('\n✅ Données du catalogue créées avec succès !');
    console.log('\n💡 Vous pouvez maintenant tester l\'API avec : npm run dev');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données :', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createCatalogData().catch(error => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });
}

module.exports = createCatalogData;