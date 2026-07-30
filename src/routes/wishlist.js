const express = require('express');
const WishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes de la wishlist (favoris) selon FonctionnalitéHaute#1776
 * 
 * Base URL: /api/wishlist
 * Toutes les routes requièrent une authentification JWT (middleware verifyToken)
 */

/**
 * @route   GET /api/wishlist
 * @desc    Récupérer la wishlist (favoris) de l'utilisateur connecté
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @returns { success: boolean, data: { wishlistId, userId, itemsCount, items: [], createdAt, updatedAt } }
 * 
 * Comportement:
 * - Si l'utilisateur n'a pas de wishlist, en crée une vide automatiquement
 * - Retourne tous les produits favoris avec leurs détails complets
 * - Trie les items par date d'ajout (plus récents en premier)
 * - Inclut les informations produit (nom, prix, stock, images, catégorie)
 */
router.get('/', verifyToken, WishlistController.getWishlist);

/**
 * @route   POST /api/wishlist
 * @desc    Ajouter un produit à la wishlist (favoris)
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @body    { productId: UUID }
 * @returns { success: boolean, message: string, data: { wishlistId, itemsCount, addedItem } }
 * 
 * Comportement:
 * - Valide que productId est un UUID valide
 * - Vérifie que le produit existe et est actif via l'API Catalogue
 * - Évite automatiquement les doublons (erreur 409 si déjà présent)
 * - Crée automatiquement une wishlist si l'utilisateur n'en a pas
 * - Retourne les détails de l'item ajouté
 * 
 * Erreurs possibles:
 * - 400: Product ID invalide ou produit non trouvé/inactif
 * - 401: Token manquant ou invalide
 * - 409: Produit déjà dans les favoris (doublon évité)
 * - 500: Erreur serveur
 */
router.post('/', verifyToken, WishlistController.addToWishlist);

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Retirer un produit spécifique de la wishlist
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @params  { productId: UUID }
 * @returns { success: boolean, message: string, data: { wishlistId, itemsCount, removedProductId } }
 * 
 * Comportement:
 * - Valide que productId est un UUID valide
 * - Supprime le produit de la wishlist s'il est présent
 * - Le produit doit exister dans la wishlist
 * 
 * Erreurs possibles:
 * - 400: Product ID invalide
 * - 401: Token manquant ou invalide
 * - 404: Wishlist non trouvée ou produit non trouvé dans les favoris
 * - 500: Erreur serveur
 */
router.delete('/:productId', verifyToken, WishlistController.removeFromWishlist);

/**
 * @route   DELETE /api/wishlist
 * @desc    Vider complètement la wishlist de l'utilisateur connecté (bonus)
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @returns { success: boolean, message: string, data: { wishlistId, itemsCount, items } }
 * 
 * Comportement:
 * - Supprime tous les produits favoris de l'utilisateur
 * - La wishlist reste existante mais vide
 * - Si l'utilisateur n'a pas de wishlist, en crée une vide
 */
router.delete('/', verifyToken, WishlistController.clearWishlist);

/**
 * @route   GET /api/wishlist/check/:productId
 * @desc    Vérifier si un produit spécifique est dans la wishlist (bonus)
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @params  { productId: UUID }
 * @returns { success: boolean, data: { productId, inWishlist: boolean, addedAt } }
 * 
 * Utile pour l'interface utilisateur (afficher/masquer icône coeur)
 */
router.get('/check/:productId', verifyToken, WishlistController.checkProductInWishlist);

module.exports = router;