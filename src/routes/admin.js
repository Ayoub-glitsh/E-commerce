const express = require('express');
const AdminProductController = require('../controllers/adminProductController');
const UploadController = require('../controllers/uploadController');
const { upload } = require('../config/multer');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes d'administration des produits
 * 
 * Base URL: /api/admin
 * Toutes les routes nécessitent l'authentification admin
 */

// Middleware global pour toutes les routes admin
router.use(verifyToken); // Vérification du token JWT
router.use(verifyAdmin); // Vérification du rôle admin

/**
 * @route   GET /api/admin/products
 * @desc    Liste des produits pour admin (inclut les inactifs si demandé)
 * @access  Admin only
 * @query   { includeInactive?: boolean }
 * @returns { products: [], stats: { total, active, inactive } }
 */
router.get('/products', AdminProductController.getAdminProducts);

/**
 * @route   POST /api/admin/products
 * @desc    Créer un nouveau produit
 * @access  Admin only
 * @body    { name, description, price, categoryId, stock?, images?, tags?, isActive? }
 * @returns { product } avec status 201
 */
router.post('/products', 
  AdminProductController.validateCreateProduct,
  AdminProductController.createProduct
);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Modifier un produit existant
 * @access  Admin only
 * @params  { id: UUID }
 * @body    { name?, description?, price?, categoryId?, stock?, images?, tags?, isActive? }
 * @returns { product }
 */
router.put('/products/:id', 
  AdminProductController.validateUpdateProduct,
  AdminProductController.updateProduct
);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Supprimer un produit
 * @access  Admin only
 * @params  { id: UUID }
 * @returns { message, deletedProduct }
 */
router.delete('/products/:id', AdminProductController.deleteProduct);

/**
 * @route   POST /api/admin/products/upload-image
 * @desc    Uploader une image de produit (multipart/form-data, champ "image")
 * @access  Admin only
 * @returns { url } avec status 200
 */
router.post(
  '/products/upload-image',
  upload.single('image'),
  UploadController.uploadProductImage
);

module.exports = router;
