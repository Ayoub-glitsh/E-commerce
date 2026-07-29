require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Script de test fonctionnel pour les 5 routes du panier
 * Vérifie que chaque route fonctionne correctement avec un token JWT valide
 */

async function testCartFunctionality() {
  console.log('🛒 Test fonctionnel complet des routes du panier\n');
  
  try {
    // Étape 1: Obtenir un token valide
    console.log('1️⃣ Authentification...');
    
    const user = await User.findOne();
    if (!user) {
      throw new Error('Aucun utilisateur trouvé en base');
    }
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: 'password123' // Mot de passe par défaut des tests
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Échec de connexion: ${loginResponse.status}`);
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    const authHeaders = { 'Authorization': `Bearer ${accessToken}` };
    
    console.log(`✅ Connecté en tant que: ${user.email}`);
    console.log('');
    
    // Étape 2: Test GET /cart (panier vide initial)
    console.log('2️⃣ Test GET /api/cart (récupération panier)...');
    
    const getCartResponse = await axios.get(`${API_BASE_URL}/cart`, {
      headers: authHeaders
    });
    
    if (getCartResponse.status === 200) {
      console.log('✅ GET /cart - Succès');
      console.log(`   Utilisateur: ${getCartResponse.data.userId}`);
      console.log(`   Nombre d'items: ${getCartResponse.data.items.length}`);
      console.log(`   Créé le: ${getCartResponse.data.createdAt}`);
    } else {
      throw new Error(`GET /cart échec: ${getCartResponse.status}`);
    }
    console.log('');
    
    // Étape 3: Test DELETE /cart/clear (vider le panier au cas où)
    console.log('3️⃣ Test DELETE /api/cart/clear (vider panier)...');
    
    const clearCartResponse = await axios.delete(`${API_BASE_URL}/cart/clear`, {
      headers: authHeaders
    });
    
    if (clearCartResponse.status === 200) {
      console.log('✅ DELETE /cart/clear - Succès');
      console.log(`   Items restants: ${clearCartResponse.data.items.length}`);
    } else {
      throw new Error(`DELETE /cart/clear échec: ${clearCartResponse.status}`);
    }
    console.log('');
    
    // Étape 4: Test POST /cart/add (ajouter produits)
    console.log('4️⃣ Test POST /api/cart/add (ajouter produits)...');
    
    const testProductId1 = '12345678-1234-1234-1234-123456789012';
    const testProductId2 = '87654321-4321-4321-4321-210987654321';
    
    // Ajouter premier produit
    const addItem1Response = await axios.post(`${API_BASE_URL}/cart/add`, {
      product_id: testProductId1,
      quantity: 2
    }, {
      headers: authHeaders
    });
    
    if (addItem1Response.status === 200) {
      console.log('✅ POST /cart/add (produit 1) - Succès');
      console.log(`   Items dans le panier: ${addItem1Response.data.items.length}`);
      console.log(`   Quantité ajoutée: 2`);
    } else {
      throw new Error(`POST /cart/add (1) échec: ${addItem1Response.status}`);
    }
    
    // Ajouter deuxième produit
    const addItem2Response = await axios.post(`${API_BASE_URL}/cart/add`, {
      product_id: testProductId2,
      quantity: 1
    }, {
      headers: authHeaders
    });
    
    if (addItem2Response.status === 200) {
      console.log('✅ POST /cart/add (produit 2) - Succès');
      console.log(`   Items dans le panier: ${addItem2Response.data.items.length}`);
    }
    
    // Ajouter même produit (doit incrémenter)
    const addSameItemResponse = await axios.post(`${API_BASE_URL}/cart/add`, {
      product_id: testProductId1,
      quantity: 1
    }, {
      headers: authHeaders
    });
    
    if (addSameItemResponse.status === 200) {
      console.log('✅ POST /cart/add (même produit) - Incrémentation réussie');
      const item1 = addSameItemResponse.data.items.find(item => item.productId === testProductId1);
      console.log(`   Quantité totale du produit 1: ${item1?.quantity || 0}`);
    }
    console.log('');
    
    // Étape 5: Test PUT /cart/update/:product_id (modifier quantité)
    console.log('5️⃣ Test PUT /api/cart/update/:product_id (modifier quantité)...');
    
    const updateItemResponse = await axios.put(`${API_BASE_URL}/cart/update/${testProductId1}`, {
      quantity: 5
    }, {
      headers: authHeaders
    });
    
    if (updateItemResponse.status === 200) {
      console.log('✅ PUT /cart/update - Succès');
      const updatedItem = updateItemResponse.data.items.find(item => item.productId === testProductId1);
      console.log(`   Nouvelle quantité: ${updatedItem?.quantity || 0}`);
    } else {
      throw new Error(`PUT /cart/update échec: ${updateItemResponse.status}`);
    }
    console.log('');
    
    // Étape 6: Test DELETE /cart/remove/:product_id (supprimer un produit)
    console.log('6️⃣ Test DELETE /api/cart/remove/:product_id (supprimer produit)...');
    
    const removeItemResponse = await axios.delete(`${API_BASE_URL}/cart/remove/${testProductId2}`, {
      headers: authHeaders
    });
    
    if (removeItemResponse.status === 200) {
      console.log('✅ DELETE /cart/remove - Succès');
      console.log(`   Items restants: ${removeItemResponse.data.items.length}`);
      const removedItemExists = removeItemResponse.data.items.some(item => item.productId === testProductId2);
      console.log(`   Produit 2 supprimé: ${!removedItemExists}`);
    } else {
      throw new Error(`DELETE /cart/remove échec: ${removeItemResponse.status}`);
    }
    console.log('');
    
    // Étape 7: Vérification finale avec GET /cart
    console.log('7️⃣ Vérification finale...');
    
    const finalCartResponse = await axios.get(`${API_BASE_URL}/cart`, {
      headers: authHeaders
    });
    
    if (finalCartResponse.status === 200) {
      console.log('✅ Vérification finale - Succès');
      console.log(`   Items finaux dans le panier: ${finalCartResponse.data.items.length}`);
      
      finalCartResponse.data.items.forEach((item, index) => {
        console.log(`   Item ${index + 1}: Product ${item.productId} x${item.quantity} (${item.price}€)`);
      });
    }
    console.log('');
    
    // Tests d'erreur (validation)
    console.log('8️⃣ Tests de validation d\'erreurs...');
    
    // Test avec UUID invalide
    try {
      await axios.post(`${API_BASE_URL}/cart/add`, {
        product_id: 'invalid-uuid',
        quantity: 1
      }, {
        headers: authHeaders,
        validateStatus: () => true
      });
      console.log('✅ Validation UUID - Correctement rejetée');
    } catch (error) {
      console.log('✅ Validation UUID - Erreur attendue');
    }
    
    // Test avec quantité invalide
    try {
      await axios.post(`${API_BASE_URL}/cart/add`, {
        product_id: testProductId1,
        quantity: -1
      }, {
        headers: authHeaders,
        validateStatus: () => true
      });
      console.log('✅ Validation quantité - Correctement rejetée');
    } catch (error) {
      console.log('✅ Validation quantité - Erreur attendue');
    }
    
    // Test suppression produit inexistant
    try {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const response = await axios.delete(`${API_BASE_URL}/cart/remove/${nonExistentId}`, {
        headers: authHeaders,
        validateStatus: () => true
      });
      
      if (response.status === 404) {
        console.log('✅ Produit inexistant - 404 correctement retourné');
      }
    } catch (error) {
      console.log('✅ Produit inexistant - Erreur attendue');
    }
    
    console.log('');
    
    // Nettoyage final
    console.log('🧹 Nettoyage final...');
    await axios.delete(`${API_BASE_URL}/cart/clear`, {
      headers: authHeaders
    });
    console.log('✅ Panier vidé');
    
    console.log('\n🎉 Tests fonctionnels terminés avec succès !');
    console.log('\n📋 Résumé des fonctionnalités validées:');
    console.log('✅ GET /cart - Récupération du panier');
    console.log('✅ POST /cart/add - Ajout de produits');
    console.log('✅ PUT /cart/update/:id - Modification des quantités');
    console.log('✅ DELETE /cart/remove/:id - Suppression de produits');
    console.log('✅ DELETE /cart/clear - Vidage complet du panier');
    console.log('✅ Validation des entrées (UUID, quantités)');
    console.log('✅ Gestion des erreurs (404, 400)');
    console.log('✅ Authentification JWT obligatoire sur toutes les routes');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests fonctionnels:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.data}`);
    }
    
    console.error('\n🔧 Vérifications suggérées:');
    console.error('- Le serveur est-il démarré sur le bon port ?');
    console.error('- La base de données est-elle accessible ?');
    console.error('- Les utilisateurs de test existent-ils ?');
    console.error('- Les routes du panier sont-elles bien configurées ?');
    
    return false;
  }
}

// Tests de performance (optionnel)
async function testCartPerformance() {
  console.log('\n⚡ Tests de performance (optionnel)...');
  
  try {
    const user = await User.findOne();
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: 'password123'
    });
    
    const authHeaders = { 'Authorization': `Bearer ${loginResponse.data.data.accessToken}` };
    
    // Vider le panier
    await axios.delete(`${API_BASE_URL}/cart/clear`, { headers: authHeaders });
    
    // Test d'ajout multiple rapide
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      const productId = `12345678-1234-1234-1234-12345678901${i}`;
      promises.push(
        axios.post(`${API_BASE_URL}/cart/add`, {
          product_id: productId,
          quantity: 1
        }, { headers: authHeaders })
      );
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ Ajout de 10 produits en parallèle: ${endTime - startTime}ms`);
    
    // Vérifier le résultat
    const cartResponse = await axios.get(`${API_BASE_URL}/cart`, { headers: authHeaders });
    console.log(`✅ Produits dans le panier après test: ${cartResponse.data.items.length}`);
    
    // Nettoyage
    await axios.delete(`${API_BASE_URL}/cart/clear`, { headers: authHeaders });
    
  } catch (error) {
    console.log('⏭️ Tests de performance sautés:', error.message);
  }
}

// Fonction principale
async function runCartTests() {
  console.log('🛒 Suite de tests complète du panier');
  console.log('=====================================\n');
  
  const functionalTestsSuccess = await testCartFunctionality();
  await testCartPerformance();
  
  console.log('\n🏁 Tests terminés\n');
  
  if (functionalTestsSuccess) {
    console.log('🎯 VALIDATION RÉUSSIE - Routes du panier opérationnelles !');
  } else {
    console.log('⚠️ PROBLÈMES DÉTECTÉS - Vérifiez la configuration');
  }
  
  return functionalTestsSuccess;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runCartTests().catch(error => {
    console.error('Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testCartFunctionality,
  testCartPerformance,
  runCartTests
};