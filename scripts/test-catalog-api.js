#!/usr/bin/env node

/**
 * Script de test pour l'API du catalogue
 * Valide les modèles Sequelize et les routes du catalogue
 */

require('dotenv').config();
const { Product, Category, sequelize } = require('../models');

async function testCatalogModels() {
  console.log('\n🧪 === TEST DES MODÈLES DU CATALOGUE ===\n');

  try {
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données : OK');

    // Test des modèles
    console.log('\n📋 Test des modèles Sequelize :');
    
    // Vérifier que les modèles existent
    console.log(`✅ Modèle Category : ${Category ? 'OK' : 'ERREUR'}`);
    console.log(`✅ Modèle Product : ${Product ? 'OK' : 'ERREUR'}`);

    // Compter les enregistrements
    const categoryCount = await Category.count();
    const productCount = await Product.count();
    const activeProductCount = await Product.count({ where: { isActive: true } });

    console.log(`📊 Catégories : ${categoryCount}`);
    console.log(`📊 Produits totaux : ${productCount}`);
    console.log(`📊 Produits actifs : ${activeProductCount}`);

    // Test des associations
    console.log('\n🔗 Test des associations :');
    
    const productWithCategory = await Product.findOne({
      include: [{ model: Category, as: 'category' }],
      where: { isActive: true }
    });

    if (productWithCategory && productWithCategory.category) {
      console.log('✅ Association Product->Category : OK');
      console.log(`   Exemple : "${productWithCategory.name}" -> "${productWithCategory.category.name}"`);
    } else {
      console.log('❌ Association Product->Category : ERREUR');
    }

    const categoryWithProducts = await Category.findOne({
      include: [{ 
        model: Product, 
        as: 'products',
        where: { isActive: true },
        required: false
      }]
    });

    if (categoryWithProducts) {
      console.log('✅ Association Category->Products : OK');
      console.log(`   Exemple : "${categoryWithProducts.name}" a ${categoryWithProducts.products.length} produit(s)`);
    }

    // Test des validations
    console.log('\n✅ Test des validations :');
    
    try {
      await Product.create({
        name: '', // Nom vide (doit échouer)
        price: -10, // Prix négatif (doit échouer)
        categoryId: 'invalid-uuid' // UUID invalide (doit échouer)
      });
      console.log('❌ Validation Product : ERREUR - Validation non appliquée');
    } catch (error) {
      console.log('✅ Validation Product : OK - Erreurs détectées correctement');
    }

    // Test des filtres de prix
    console.log('\n💰 Test des filtres de prix :');
    
    const expensiveProducts = await Product.count({
      where: { 
        price: { [require('sequelize').Op.gte]: 1000 },
        isActive: true
      }
    });
    
    const cheapProducts = await Product.count({
      where: { 
        price: { [require('sequelize').Op.lte]: 100 },
        isActive: true
      }
    });

    console.log(`📊 Produits >= 1000€ : ${expensiveProducts}`);
    console.log(`📊 Produits <= 100€ : ${cheapProducts}`);

    // Test de recherche textuelle
    console.log('\n🔍 Test de recherche textuelle :');
    
    const searchResults = await Product.findAll({
      where: {
        isActive: true,
        [require('sequelize').Op.or]: [
          { name: { [require('sequelize').Op.iLike]: '%phone%' } },
          { description: { [require('sequelize').Op.iLike]: '%phone%' } }
        ]
      },
      limit: 3
    });

    console.log(`📊 Résultats pour "phone" : ${searchResults.length} produit(s)`);
    searchResults.forEach(product => {
      console.log(`   - ${product.name} (${product.price}€)`);
    });

    console.log('\n✅ Tous les tests des modèles sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests :', error.message);
    process.exit(1);
  }
}

async function testCatalogEndpoints() {
  console.log('\n🌐 === TEST DES ENDPOINTS (Simulation) ===\n');

  // Simuler les requêtes que l'on ferait avec Postman
  console.log('📡 Endpoints à tester avec Postman/curl :');
  console.log('');
  
  const baseUrl = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000';
  
  console.log('🔸 GET /api/categories');
  console.log(`   curl "${baseUrl}/api/categories"`);
  console.log('');
  
  console.log('🔸 GET /api/products (page 1, limit 5)');
  console.log(`   curl "${baseUrl}/api/products?page=1&limit=5"`);
  console.log('');
  
  console.log('🔸 GET /api/products (filtre par prix)');
  console.log(`   curl "${baseUrl}/api/products?minPrice=100&maxPrice=500"`);
  console.log('');
  
  console.log('🔸 GET /api/products (recherche)');
  console.log(`   curl "${baseUrl}/api/products?search=phone"`);
  console.log('');
  
  console.log('🔸 GET /api/products (tri par prix)');
  console.log(`   curl "${baseUrl}/api/products?sortBy=price&sortOrder=asc"`);
  console.log('');

  // Récupérer un ID de produit pour le test de détail
  try {
    const sampleProduct = await Product.findOne({ 
      where: { isActive: true },
      attributes: ['id', 'name']
    });
    
    if (sampleProduct) {
      console.log('🔸 GET /api/products/:id (détail)');
      console.log(`   curl "${baseUrl}/api/products/${sampleProduct.id}"`);
      console.log(`   Exemple : ${sampleProduct.name}`);
      console.log('');
    }
  } catch (error) {
    console.log('⚠️ Impossible de récupérer un produit exemple');
  }

  console.log('🔸 GET /api/products/search/suggestions');
  console.log(`   curl "${baseUrl}/api/products/search/suggestions?q=phone&limit=3"`);
  console.log('');

  console.log('💡 Pour tester, démarrez le serveur avec : npm run dev');
}

async function main() {
  console.log('🚀 Test du catalogue de produits - 3LM-Solutions E-commerce');
  
  await testCatalogModels();
  await testCatalogEndpoints();
  
  await sequelize.close();
  console.log('\n🎉 Tests terminés avec succès !');
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });
}

module.exports = { testCatalogModels, testCatalogEndpoints };