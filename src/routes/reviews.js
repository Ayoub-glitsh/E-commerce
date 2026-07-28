const express = require('express');
const ReviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');
const { validateCreateReview, validateGetProductReviews } = require('../validators/reviewValidator');

const router = express.Router();

/**
 * Routes pour les avis produits
 * 
 * Base URL: /api/products/:id/reviews
 */

/**
 * @route   GET /api/products/:id/reviews
 * @desc    Récupérer la liste des avis d'un produit avec pagination
 * @access  Public
 * @params  { id: UUID }
 * @query   { page?, limit?, sortBy?, sortOrder? }
 * @returns { reviews: [], pagination: {}, stats: {} }
 */
router.get('/products/:id/reviews', 
  validateGetProductReviews,
  ReviewController.getProductReviews
);

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Ajouter un avis sur un produit (authentification requise)
 * @access  Private
 * @params  { id: UUID }
 * @body    { rating: number(1-5), comment?: string }
 * @returns { review: {} }
 */
router.post('/products/:id/reviews',
  verifyToken, // Middleware d'authentification
  validateCreateReview,
  ReviewController.createReview
);

module.exports = router;