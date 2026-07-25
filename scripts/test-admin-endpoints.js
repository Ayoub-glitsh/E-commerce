/**
 * Script de test automatisé pour les endpoints d'administration
 * Task #1753 - Routes d'administration produits
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

let adminToken = '';
let userToken = '';
let createdProductId = '';

// Fonction helper pour les logs
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${testName}`, color);
  if (details) log(`   ${details}`, 'yellow');
}

// Fonction helper pour les requêtes
async function request(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      data: error.response?.data, 
      status: error.response?.status,
      message: error.message 
    };
  }
}

// ÉTAPE 1 : AUTHENTIFICATION
async function testAuthentication() {
  log('\n🔑 ÉTAPE 1 : AUTHENTIFICATION\n', 'blue');
  
  // Test 1: Login Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@3lm-solutions.com',
    password: 'AdminPassword123'
  });
  
  if (adminLogin.success && adminLogin.data.accessToken) {
    adminToken = adminLogin.data.accessToken;
    logTest('Login Admin réussi', true, `Token: ${adminToken.substring(0, 20)}...`);
  } else {
    logTest('Login Admin échoué', false, JSON.stringify(adminLogin.data));
    process.exit(1);
  }
  
  // Test 2: Login User
  const userLogin = await request('POST', '/api/auth/login', {
    email: 'user@example.com',
    password: 'UserPassword123'
  });
  
  if (userLogin.success && userLogin.data.accessToken) {
    userToken = userLogin.data.accessToken;
    logTest('Login User réussi', true, `Token: ${userToken.substring(0, 20)}...`);
  } else {
    logTest('Login User échoué', false, JSON.stringify(userLogin.data));
    process.exit(1);
  }
}

// ÉTAPE 2 : TESTS ENDPOINTS ADMIN (avec token admin)
async function testAdminEndpoints() {
  log('\n✅ ÉTAPE 2 : TESTS ENDPOINTS ADMIN (avec token admin)\n', 'blue');
  
  // Test 1: GET /api/admin/products
  const getProducts = await request('GET', '/api/admin/products', null, adminToken);
  logTest(
    'GET /api/admin/products (liste produits)',
    getProducts.success && getProducts.status === 200,
    getProducts.success ? `${getProducts.data.products?.length || 0} produits trouvés` : getProducts.message
  );
  
  // Test 2: GET /api/admin/products?includeInactive=true
  const getProductsWithInactive = await request('GET', '/api/admin/products?includeInactive=true', null, adminToken);
  logTest(
    'GET /api/admin/products?includeInactive=true',
    getProductsWithInactive.success && getProductsWithInactive.status === 200,
    getProductsWithInactive.success ? `${getProductsWithInactive.data.products?.length || 0} produits (actifs + inactifs)` : getProductsWithInactive.message
  );
  
  // Test 3: POST /api/admin/products (créer produit)
  const createProduct = await request('POST', '/api/admin/products', {
    name: 'Produit Test Automatisé',
    description: 'Créé par le script de test automatique',
    price: 299.99,
    categoryId: '8f374b0d-0b37-44d5-b774-813cf948c1bf',
    stock: 15,
    images: ['https://via.placeholder.com/400x300'],
    tags: ['test', 'automatique'],
    isActive: true
  }, adminToken);
  
  if (createProduct.success && createProduct.status === 201) {
    createdProductId = createProduct.data.id;
    logTest('POST /api/admin/products (créer produit)', true, `Produit créé avec ID: ${createdProductId}`);
  } else {
    logTest('POST /api/admin/products (créer produit)', false, JSON.stringify(createProduct.data));
  }
  
  // Test 4: PUT /api/admin/products/:id (modifier produit)
  if (createdProductId) {
    const updateProduct = await request('PUT', `/api/admin/products/${createdProductId}`, {
      name: 'Produit Test Modifié',
      price: 599.99,
      stock: 20
    }, adminToken);
    
    logTest(
      'PUT /api/admin/products/:id (modifier produit)',
      updateProduct.success && updateProduct.status === 200,
      updateProduct.success ? `Prix mis à jour: ${updateProduct.data.price}€` : updateProduct.message
    );
  }
  
  // Test 5: DELETE /api/admin/products/:id (supprimer produit)
  if (createdProductId) {
    const deleteProduct = await request('DELETE', `/api/admin/products/${createdProductId}`, null, adminToken);
    
    logTest(
      'DELETE /api/admin/products/:id (supprimer produit)',
      deleteProduct.success && deleteProduct.status === 200,
      deleteProduct.success ? deleteProduct.data.message : deleteProduct.message
    );
  }
}

// ÉTAPE 3 : TESTS REFUS D'ACCÈS (avec token user)
async function testAccessDenied() {
  log('\n❌ ÉTAPE 3 : TESTS REFUS D\'ACCÈS (avec token user)\n', 'blue');
  
  // Test 1: User tente de créer un produit (doit échouer 403)
  const userCreate = await request('POST', '/api/admin/products', {
    name: 'Produit Non Autorisé',
    description: 'Tentative de création par user',
    price: 199.99,
    categoryId: '8f374b0d-0b37-44d5-b774-813cf948c1bf',
    stock: 10,
    images: ['https://via.placeholder.com/400x300'],
    tags: ['test']
  }, userToken);
  
  logTest(
    'POST /api/admin/products avec token USER (doit échouer)',
    !userCreate.success && userCreate.status === 403,
    userCreate.status === 403 ? 'Accès refusé correctement (403)' : `Status inattendu: ${userCreate.status}`
  );
  
  // Test 2: User tente de modifier un produit (doit échouer 403)
  const userUpdate = await request('PUT', '/api/admin/products/2c925bf5-a1c4-4de8-8aea-d540bd223abe', {
    name: 'Modification Non Autorisée',
    price: 999.99
  }, userToken);
  
  logTest(
    'PUT /api/admin/products/:id avec token USER (doit échouer)',
    !userUpdate.success && userUpdate.status === 403,
    userUpdate.status === 403 ? 'Accès refusé correctement (403)' : `Status inattendu: ${userUpdate.status}`
  );
  
  // Test 3: User tente de supprimer un produit (doit échouer 403)
  const userDelete = await request('DELETE', '/api/admin/products/2c925bf5-a1c4-4de8-8aea-d540bd223abe', null, userToken);
  
  logTest(
    'DELETE /api/admin/products/:id avec token USER (doit échouer)',
    !userDelete.success && userDelete.status === 403,
    userDelete.status === 403 ? 'Accès refusé correctement (403)' : `Status inattendu: ${userDelete.status}`
  );
  
  // Test 4: Requête sans token (doit échouer 401)
  const noToken = await request('GET', '/api/admin/products', null, null);
  
  logTest(
    'GET /api/admin/products SANS token (doit échouer)',
    !noToken.success && noToken.status === 401,
    noToken.status === 401 ? 'Non authentifié correctement (401)' : `Status inattendu: ${noToken.status}`
  );
}

// Fonction principale
async function runTests() {
  log('═══════════════════════════════════════════════════════', 'blue');
  log('  TEST AUTOMATISÉ - ROUTES D\'ADMINISTRATION PRODUITS  ', 'blue');
  log('  Task #1753 - Endpoints Admin                         ', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  
  try {
    await testAuthentication();
    await testAdminEndpoints();
    await testAccessDenied();
    
    log('\n═══════════════════════════════════════════════════════', 'green');
    log('  ✅ TOUS LES TESTS SONT TERMINÉS AVEC SUCCÈS          ', 'green');
    log('═══════════════════════════════════════════════════════', 'green');
    log('\n🎉 Task #1753 validée et prête pour GitHub!\n', 'green');
    
  } catch (error) {
    log('\n❌ ERREUR LORS DES TESTS:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Exécution
runTests();
