const { body, param } = require('express-validator');

/**
 * Validations pour les avis produits
 */

/**
 * Validation pour créer un avis
 */
const validateCreateReview = [
  // Validation de l'ID du produit dans l'URL
  param('id')
    .isUUID(4)
    .withMessage('L\'ID du produit doit être un UUID valide'),

  // Validation du rating
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être un entier entre 1 et 5')
    .toInt(),

  // Validation du commentaire (optionnel)
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Le commentaire ne peut pas dépasser 500 caractères')
    .trim()
    .escape() // Échapper les caractères HTML pour éviter les injections
];

/**
 * Validation pour récupérer les avis d'un produit
 */
const validateGetProductReviews = [
  // Validation de l'ID du produit dans l'URL
  param('id')
    .isUUID(4)
    .withMessage('L\'ID du produit doit être un UUID valide')
];

module.exports = {
  validateCreateReview,
  validateGetProductReviews
};