const { Order, Cart, CartItem, User } = require('../../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Contrôleur de gestion des commandes avec machine à états
 * FonctionnalitéHaute#1777
 * 
 * Fonctionnalités:
 * - Création de commandes depuis le panier
 * - Gestion machine à états (pending -> confirmed -> shipped -> delivered)
 * - Validation des transitions de statut
 * - Consultation et historique des commandes
 */

class OrderController {

  /**
   * POST /api/orders - Créer une commande depuis le panier
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { shippingAddress, billingAddress, paymentMethod, notes, items } = req.body;

      console.log(`📦 Création de commande pour l'utilisateur ${userId}`);

      let orderItems = [];

      // Si des items sont fournis directement dans la requête (pour les tests)
      if (items && Array.isArray(items) && items.length > 0) {
        orderItems = items.map(item => ({
          productId: item.productId,
          name: item.name || 'Produit',
          price: parseFloat(item.price) || 0,
          quantity: item.quantity || 1,
          total: (parseFloat(item.price) || 0) * (item.quantity || 1)
        }));
        
        console.log(`📦 Utilisation des items fournis: ${orderItems.length} items`);
      } else {
        // Sinon, récupérer le panier de l'utilisateur avec ses items
        const cart = await Cart.findOne({
          where: { userId: userId },
          include: [{
            model: CartItem,
            as: 'items'
          }]
        });

        if (!cart || !cart.items || cart.items.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Aucun item dans le panier pour créer une commande. Ajoutez des items au panier ou fournissez le paramètre "items" dans la requête.'
          });
        }

        // Copier les items du panier (snapshot au moment de la commande)
        orderItems = cart.items.map(item => ({
          productId: item.productId,
          name: item.name || 'Produit',
          price: parseFloat(item.price) || 0,
          quantity: item.quantity,
          total: (parseFloat(item.price) || 0) * item.quantity
        }));

        console.log(`📦 Récupération depuis le panier: ${orderItems.length} items`);

        // Vider le panier après création de commande
        await CartItem.destroy({
          where: { cartId: cart.id }
        });

        console.log(`🗑️ Panier vidé après création de la commande`);
      }

      // Calculer le montant total
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

      // Créer la commande
      const order = await Order.create({
        id: uuidv4(),
        orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Générer orderId manuellement
        userId: userId,
        items: orderItems,
        totalAmount: totalAmount,
        status: Order.STATUS.PENDING,
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null
      });

      console.log(`✅ Commande ${order.orderId} créée avec ${orderItems.length} items (Total: ${totalAmount}€)`);

      // Optionnel: Vider le panier après création de commande seulement si on a utilisé le panier
      if (!items || items.length === 0) {
        await CartItem.destroy({
          where: { cartId: cart.id }
        });

        console.log(`🗑️ Panier vidé après création de la commande`);
      }

      // Réponse avec détails de la commande
      res.status(201).json({
        success: true,
        message: 'Commande créée avec succès',
        data: {
          orderId: order.orderId,
          id: order.id,
          status: order.status,
          totalAmount: parseFloat(order.totalAmount),
          itemsCount: orderItems.length,
          items: orderItems,
          availableTransitions: order.getAvailableTransitions(),
          createdAt: order.created_at
        }
      });

    } catch (error) {
      console.error('Erreur lors de la création de commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la création de la commande'
      });
    }
  }

  /**
   * PUT /api/orders/:orderId/status - Mettre à jour le statut d'une commande
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { newStatus } = req.body;
      const userId = req.user.id;

      console.log(`🔄 Tentative de mise à jour statut commande ${orderId}: -> ${newStatus}`);

      // Validation du nouveau statut
      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau statut est requis'
        });
      }

      if (!Object.values(Order.STATUS).includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Statuts autorisés: [${Object.values(Order.STATUS).join(', ')}]`
        });
      }

      // Trouver la commande
      const order = await Order.findOne({
        where: { 
          orderId: orderId,
          userId: userId // S'assurer que l'utilisateur possède cette commande
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Tenter la mise à jour du statut (avec validation automatique)
      try {
        await order.updateStatus(newStatus);

        res.status(200).json({
          success: true,
          message: `Statut de la commande mis à jour vers "${newStatus}"`,
          data: {
            orderId: order.orderId,
            previousStatus: order._previousDataValues?.status,
            currentStatus: order.status,
            availableTransitions: order.getAvailableTransitions(),
            trackingNumber: order.trackingNumber,
            updatedAt: order.updated_at
          }
        });

      } catch (transitionError) {
        // Erreur de transition invalide
        console.log(`❌ Transition refusée: ${transitionError.message}`);
        
        return res.status(400).json({
          success: false,
          message: transitionError.message,
          data: {
            currentStatus: order.status,
            requestedStatus: newStatus,
            availableTransitions: order.getAvailableTransitions()
          }
        });
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la mise à jour du statut'
      });
    }
  }

  /**
   * GET /api/orders - Lister les commandes de l'utilisateur
   * 
   * @param {Object} req - Requête Express  
   * @param {Object} res - Réponse Express
   */
  static async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 50, offset = 0 } = req.query;

      console.log(`📋 Récupération commandes utilisateur ${userId}`);

      // Construire les conditions de recherche
      const whereConditions = { userId: userId };
      if (status && Object.values(Order.STATUS).includes(status)) {
        whereConditions.status = status;
      }

      // Récupérer les commandes
      const orders = await Order.findAll({
        where: whereConditions,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Formatter les résultats
      const formattedOrders = orders.map(order => ({
        orderId: order.orderId,
        id: order.id,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        itemsCount: order.items?.length || 0,
        items: order.items,
        availableTransitions: order.getAvailableTransitions(),
        isModifiable: order.isModifiable(),
        isCompleted: order.isCompleted(),
        trackingNumber: order.trackingNumber,
        paymentMethod: order.paymentMethod,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }));

      res.status(200).json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            total: formattedOrders.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: formattedOrders.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la récupération des commandes'
      });
    }
  }

  /**
   * GET /api/orders/:orderId - Récupérer une commande spécifique
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      console.log(`📦 Récupération commande ${orderId} pour utilisateur ${userId}`);

      const order = await Order.findOne({
        where: { 
          orderId: orderId,
          userId: userId
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Réponse détaillée
      res.status(200).json({
        success: true,
        data: {
          orderId: order.orderId,
          id: order.id,
          status: order.status,
          totalAmount: parseFloat(order.totalAmount),
          items: order.items,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          paymentMethod: order.paymentMethod,
          trackingNumber: order.trackingNumber,
          notes: order.notes,
          availableTransitions: order.getAvailableTransitions(),
          isModifiable: order.isModifiable(),
          isCompleted: order.isCompleted(),
          user: order.user,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la récupération de la commande'
      });
    }
  }

  /**
   * GET /api/orders/:orderId/transitions - Obtenir les transitions possibles
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getOrderTransitions(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { 
          orderId: orderId,
          userId: userId
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          orderId: order.orderId,
          currentStatus: order.status,
          availableTransitions: order.getAvailableTransitions(),
          allStatuses: Object.values(Order.STATUS),
          isModifiable: order.isModifiable(),
          isCompleted: order.isCompleted()
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des transitions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * GET /api/orders/statuses - Obtenir tous les statuts disponibles
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getAvailableStatuses(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          statuses: Object.values(Order.STATUS),
          transitions: Order.VALID_TRANSITIONS,
          statusDescriptions: {
            [Order.STATUS.PENDING]: 'En attente de confirmation',
            [Order.STATUS.CONFIRMED]: 'Confirmée et en préparation',
            [Order.STATUS.SHIPPED]: 'Expédiée',
            [Order.STATUS.DELIVERED]: 'Livrée'
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = OrderController;