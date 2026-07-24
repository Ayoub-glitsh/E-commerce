const express = require('express');
const CatalogController = require('../controllers/catalogController');

const router = express.Router();

/**
 * Routes publiques du catalogue produits et catégories
 * 
 * Base URL: /api
 */

/**
 * @route   GET /api/products
 * @desc    Liste des produits avec pagination et filtres
 * @access  Public
 * @query   { page?, limit?, categoryId?, minPrice?, maxPrice?, search?, sortBy?, sortOrder?, active? }
 * @returns { products: [], pagination: {}, filters: {} }
 */
router.get('/products', CatalogController.getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Détail complet d'un produit
 * @access  Public
 * @params  { id: UUID }
 * @returns { product: {} }
 */
router.get('/products/:id', CatalogController.getProductById);

/**
 * @route   GET /api/categories
 * @desc    Liste simple des catégories
 * @access  Public
 * @query   { includeProductCount? }
 * @returns { categories: [] }
 */
router.get('/categories', CatalogController.getCategories);

module.exports = router;