const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes de gestion des paiements Stripe
 * FonctionnalitéHaute#1780 - Configuration Stripe et endpoint paiement
 * 
 * Base URL: /api/payments
 * Authentification JWT requise pour les endpoints protégés
 */

/**
 * @route   POST /api/payments/create-intent
 * @desc    Créer un PaymentIntent Stripe pour une commande (FonctionnalitéHaute#1780)
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @body    {
 *            orderId: string (required) - ID de la commande à payer,
 *            amount: number (required) - Montant en euros,
 *            currency?: string (default: 'eur') - Devise du paiement
 *          }
 * @returns {
 *            success: boolean,
 *            message: string,
 *            data: {
 *              client_secret: string - Secret client pour Stripe,
 *              orderId: string - ID de la commande,
 *              amount: number - Montant en euros,
 *              currency: string - Devise,
 *              status: string - Statut du PaymentIntent,
 *              paymentIntentId: string - ID du PaymentIntent Stripe
 *            }
 *          }
 * 
 * Spécification FonctionnalitéHaute#1780:
 * - Sous-tâche 2: stripe.paymentIntents.create() avec amount, currency
 * - Sous-tâche 3: Retourne { client_secret, orderId }
 * - Vérification: Order existe et appartient à l'utilisateur (userId === user.id)
 * - Comportement: Commande passe à status=pending lors de la création de l'intent
 * - Sécurité: JWT authentication + ownership verification
 * 
 * Erreurs possibles:
 * - 400: Paramètres manquants/invalides ou montant incorrect
 * - 401: Token JWT manquant/invalide  
 * - 404: Commande non trouvée ou n'appartient pas à l'utilisateur
 * - 500: Erreur Stripe ou serveur interne
 */
router.post('/create-intent', verifyToken, PaymentController.createPaymentIntent);

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook Stripe pour traiter les événements de paiement
 * @access  Public (signature Stripe requise)
 * @headers stripe-signature: <signature>
 * @body    Raw Stripe webhook payload
 * @returns { received: boolean }
 * 
 * Comportement:
 * - Vérifie la signature du webhook Stripe
 * - Traite les événements payment_intent.succeeded, payment_intent.payment_failed, etc.
 * - Met à jour le statut des commandes selon l'événement
 * - Endpoint optionnel pour gestion avancée des paiements
 */
router.post('/webhook', PaymentController.handleStripeWebhook);

/**
 * @route   GET /api/payments/config
 * @desc    Obtenir la configuration publique Stripe pour le frontend
 * @access  Public
 * @returns {
 *            success: boolean,
 *            data: {
 *              publishableKey: string - Clé publique Stripe,
 *              currency: string - Devise par défaut,
 *              country: string - Pays par défaut
 *            }
 *          }
 * 
 * Utilisation:
 * - Permet au frontend d'initialiser Stripe.js avec la clé publique
 * - Fournit la configuration par défaut (devise, pays)
 * - Endpoint public, pas d'authentification requise
 */
router.get('/config', PaymentController.getStripeConfig);

module.exports = router;