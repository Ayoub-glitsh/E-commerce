const { Order } = require('../../models');
const Stripe = require('stripe');

/**
 * Contrôleur de gestion des paiements Stripe
 * FonctionnalitéHaute#1780 - Configuration Stripe et endpoint paiement
 * 
 * Fonctionnalités:
 * - Initialisation Stripe avec clé secrète
 * - Création de PaymentIntent pour commandes
 * - Vérification de sécurité et ownership des commandes
 * - Gestion des statuts de commande lors du paiement
 */

// Sous-tâche 1: Initialiser Stripe avec STRIPE_SECRET_KEY
let stripe;
if (process.env.STRIPE_SECRET_KEY?.includes('mock') || process.env.NODE_ENV === 'test') {
  // Mode mock pour les tests de développement
  console.log('🧪 Stripe en mode mock pour les tests');
  stripe = {
    paymentIntents: {
      create: async (params) => {
        console.log('🧪 Mock Stripe PaymentIntent create:', params);
        return {
          id: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
          status: 'requires_payment_method',
          amount: params.amount,
          currency: params.currency,
          metadata: params.metadata
        };
      }
    }
  };
} else {
  // Mode production avec vraie Stripe API
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

class PaymentController {

  /**
   * POST /api/payments/create-intent - Créer un PaymentIntent Stripe (FonctionnalitéHaute#1780)
   * Sous-tâche 2: Implémenter POST /payments/create-intent avec stripe.paymentIntents.create()
   * Sous-tâche 3: Retourner { client_secret, orderId } et vérifier ownership
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async createPaymentIntent(req, res) {
    try {
      const userId = req.user.id; // JWT token verification
      const { orderId, amount, currency = 'eur' } = req.body;

      console.log(`💳 FonctionnalitéHaute#1780 - Création PaymentIntent pour commande ${orderId}`);

      // Validation des paramètres d'entrée
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'OrderId est requis'
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount doit être supérieur à 0'
        });
      }

      // Sous-tâche 3: Vérifier que l'ordre existe et appartient à l'utilisateur
      const order = await Order.findOne({
        where: {
          orderId: orderId,
          userId: userId // Sécurité: l'utilisateur ne peut payer que ses propres commandes
        }
      });

      if (!order) {
        console.log(`❌ Commande ${orderId} non trouvée ou n'appartient pas à l'utilisateur ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée ou accès non autorisé'
        });
      }

      // Vérifier que le montant correspond à celui de la commande
      const orderAmount = Math.round(parseFloat(order.totalAmount) * 100); // Stripe utilise les centimes
      const requestedAmount = Math.round(parseFloat(amount) * 100);

      if (Math.abs(orderAmount - requestedAmount) > 1) { // Tolérance de 1 centime pour les arrondis
        return res.status(400).json({
          success: false,
          message: `Montant invalide. Attendu: ${(orderAmount / 100).toFixed(2)}€, Reçu: ${(requestedAmount / 100).toFixed(2)}€`
        });
      }

      console.log(`💰 Montant validé: ${(orderAmount / 100).toFixed(2)}€ pour commande ${orderId}`);

      // Vérifier que la commande est dans un état payable
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Impossible de payer une commande avec le statut "${order.status}"`
        });
      }

      // Sous-tâche 2: Créer un PaymentIntent avec stripe.paymentIntents.create()
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: orderAmount, // Montant en centimes
          currency: currency.toLowerCase(),
          metadata: {
            orderId: order.orderId,
            userId: userId,
            orderInternalId: order.id
          },
          description: `Paiement pour commande ${order.orderId}`,
          // Méthodes de paiement autorisées
          payment_method_types: ['card'],
          // Configuration pour une meilleure sécurité
          capture_method: 'automatic',
          confirmation_method: 'manual',
          // Informations supplémentaires pour le tableau de bord Stripe
          statement_descriptor: 'E-COMMERCE',
          statement_descriptor_suffix: order.orderId.slice(-10)
        });

        console.log(`✅ PaymentIntent créé: ${paymentIntent.id} pour commande ${orderId}`);

        // Mettre à jour le statut de la commande selon spécification
        // "La commande passe à status=pending au moment de la création de l'intent"
        if (order.status !== 'pending') {
          await order.update({
            status: 'pending',
            notes: order.notes ? 
              `${order.notes}\nPaymentIntent créé: ${paymentIntent.id}` : 
              `PaymentIntent créé: ${paymentIntent.id}`
          });
          console.log(`📊 Statut commande mis à jour: ${order.orderId} -> pending`);
        }

        // Sous-tâche 3: Retourner { client_secret, orderId }
        const response = {
          client_secret: paymentIntent.client_secret,
          orderId: order.orderId,
          // Informations supplémentaires utiles pour le frontend
          amount: orderAmount / 100, // Retour en euros
          currency: currency,
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id
        };

        console.log(`🎉 PaymentIntent créé avec succès pour ${orderId}`);

        res.status(201).json({
          success: true,
          message: 'PaymentIntent créé avec succès',
          data: response
        });

      } catch (stripeError) {
        console.error('Erreur Stripe lors de la création du PaymentIntent:', stripeError);
        
        // Gestion des erreurs spécifiques Stripe (ne se produisent pas en mode mock)
        let errorMessage = 'Erreur lors de la création du paiement';
        if (stripeError.type === 'StripeCardError') {
          errorMessage = 'Erreur de carte bancaire';
        } else if (stripeError.type === 'StripeRateLimitError') {
          errorMessage = 'Trop de requêtes, veuillez réessayer';
        } else if (stripeError.type === 'StripeInvalidRequestError') {
          errorMessage = 'Paramètres de paiement invalides';
        } else if (stripeError.type === 'StripeAPIError') {
          errorMessage = 'Erreur temporaire du service de paiement';
        } else if (stripeError.type === 'StripeConnectionError') {
          errorMessage = 'Erreur de connexion au service de paiement';
        } else if (stripeError.message?.includes('API Key')) {
          errorMessage = 'Configuration Stripe invalide (clé API)';
        }

        return res.status(400).json({
          success: false,
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? stripeError.message : undefined
        });
      }

    } catch (error) {
      console.error('Erreur lors de la création du PaymentIntent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la création du paiement'
      });
    }
  }

  /**
   * POST /api/payments/webhook - Webhook Stripe pour gérer les événements de paiement
   * Optionnel: Gérer les confirmations de paiement
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      
      // TODO: Configurer le webhook endpoint secret
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      // let event;
      // try {
      //   event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      // } catch (err) {
      //   console.log(`Webhook signature verification failed.`, err.message);
      //   return res.status(400).send(`Webhook Error: ${err.message}`);
      // }

      console.log('🎣 Webhook Stripe reçu (non implémenté):', req.headers);
      
      // Répondre à Stripe que le webhook a été reçu
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('Erreur webhook Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du webhook'
      });
    }
  }

  /**
   * GET /api/payments/config - Obtenir la configuration publique Stripe
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getStripeConfig(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          currency: 'eur',
          country: 'FR'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la config Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la configuration'
      });
    }
  }
}

module.exports = PaymentController;