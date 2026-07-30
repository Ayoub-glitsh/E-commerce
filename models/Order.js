const { DataTypes } = require('sequelize');

/**
 * Modèle Order avec machine à états
 * FonctionnalitéHaute#1777
 * 
 * Machine à états des commandes avec transitions validées :
 * pending -> confirmed -> shipped -> delivered
 * Aucune transition en arrière n'est autorisée
 */

module.exports = (sequelize) => {
  // Définition des statuts valides et leurs transitions
  const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed', 
    SHIPPED: 'shipped',
    DELIVERED: 'delivered'
  };

  // Mapping des transitions valides
  const VALID_TRANSITIONS = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [] // État final, aucune transition
  };

  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.TEXT, // Cohérent avec autres modèles du projet
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    orderId: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      comment: 'Identifiant unique de commande (peut être différent de l\'ID primaire)'
    },
    userId: {
      type: DataTypes.TEXT, // Type TEXT pour correspondre au modèle User
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    items: {
      type: DataTypes.JSONB, // Stockage JSON des items du panier
      allowNull: false,
      defaultValue: [],
      comment: 'Copie des items du panier au moment de la commande'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2), // Précision monétaire
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      },
      comment: 'Montant total de la commande'
    },
    status: {
      type: DataTypes.ENUM(
        ORDER_STATUS.PENDING,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.DELIVERED
      ),
      allowNull: false,
      defaultValue: ORDER_STATUS.PENDING,
      validate: {
        isIn: {
          args: [[
            ORDER_STATUS.PENDING,
            ORDER_STATUS.CONFIRMED,
            ORDER_STATUS.SHIPPED,
            ORDER_STATUS.DELIVERED
          ]],
          msg: 'Statut de commande invalide'
        }
      }
    },
    // Champs additionnels utiles
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Adresse de livraison'
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Adresse de facturation'
    },
    paymentMethod: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Méthode de paiement utilisée'
    },
    trackingNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Numéro de suivi (disponible après expédition)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes internes sur la commande'
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['order_id'],
        unique: true
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      // Hook pour générer automatiquement orderId si non fourni
      beforeCreate: (order) => {
        if (!order.orderId) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          order.orderId = `ORD-${timestamp}-${random}`;
        }
      },
      
      // Hook pour valider les transitions de statut
      beforeUpdate: (order) => {
        if (order.changed('status')) {
          const currentStatus = order._previousDataValues.status;
          const newStatus = order.status;
          
          console.log(`🔄 Tentative de transition: ${currentStatus} -> ${newStatus}`);
          
          if (!Order.isValidTransition(currentStatus, newStatus)) {
            throw new Error(
              `Transition de statut invalide: impossible de passer de "${currentStatus}" à "${newStatus}". ` +
              `Transitions autorisées depuis "${currentStatus}": [${VALID_TRANSITIONS[currentStatus].join(', ')}]`
            );
          }
          
          console.log(`✅ Transition autorisée: ${currentStatus} -> ${newStatus}`);
        }
      }
    }
  });

  /**
   * Méthode statique pour vérifier si une transition est valide
   * @param {string} currentStatus - Statut actuel
   * @param {string} newStatus - Nouveau statut souhaité
   * @returns {boolean} - True si la transition est autorisée
   */
  Order.isValidTransition = function(currentStatus, newStatus) {
    // Si le statut ne change pas, c'est toujours valide
    if (currentStatus === newStatus) {
      return true;
    }
    
    // Vérifier si la transition est dans les transitions autorisées
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  };

  /**
   * Méthode d'instance pour mettre à jour le statut avec validation
   * @param {string} newStatus - Nouveau statut
   * @returns {Promise<Order>} - Instance mise à jour
   */
  Order.prototype.updateStatus = async function(newStatus) {
    const currentStatus = this.status;
    
    console.log(`📦 Commande ${this.orderId}: Tentative de changement de statut ${currentStatus} -> ${newStatus}`);
    
    // Validation de la transition
    if (!Order.isValidTransition(currentStatus, newStatus)) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
      const errorMessage = `Transition de statut invalide pour la commande ${this.orderId}: ` +
        `impossible de passer de "${currentStatus}" à "${newStatus}". ` +
        `Transitions autorisées: [${allowedTransitions.join(', ')}]`;
      
      console.log(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Mise à jour du statut
    this.status = newStatus;
    
    // Ajout de données spécifiques selon le statut
    switch (newStatus) {
      case ORDER_STATUS.SHIPPED:
        // Générer un numéro de suivi si pas déjà défini
        if (!this.trackingNumber) {
          this.trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        }
        break;
        
      case ORDER_STATUS.DELIVERED:
        // Marquer la date de livraison dans les notes
        const deliveryNote = `Livré le ${new Date().toLocaleDateString('fr-FR')}`;
        this.notes = this.notes ? `${this.notes}\n${deliveryNote}` : deliveryNote;
        break;
    }
    
    // Sauvegarder les changements
    await this.save();
    
    console.log(`✅ Commande ${this.orderId}: Statut mis à jour vers "${newStatus}"`);
    
    return this;
  };

  /**
   * Méthode pour obtenir les transitions possibles depuis le statut actuel
   * @returns {string[]} - Liste des statuts possibles
   */
  Order.prototype.getAvailableTransitions = function() {
    return VALID_TRANSITIONS[this.status] || [];
  };

  /**
   * Méthode pour vérifier si la commande peut être modifiée
   * @returns {boolean} - True si la commande peut encore être modifiée
   */
  Order.prototype.isModifiable = function() {
    return this.status === ORDER_STATUS.PENDING;
  };

  /**
   * Méthode pour vérifier si la commande est terminée
   * @returns {boolean} - True si la commande est livrée
   */
  Order.prototype.isCompleted = function() {
    return this.status === ORDER_STATUS.DELIVERED;
  };

  /**
   * Méthode pour calculer le montant total à partir des items
   * @returns {number} - Montant total calculé
   */
  Order.prototype.calculateTotal = function() {
    if (!this.items || !Array.isArray(this.items)) {
      return 0;
    }
    
    return this.items.reduce((total, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  };

  /**
   * Méthode pour synchroniser le totalAmount avec les items
   */
  Order.prototype.syncTotalAmount = function() {
    this.totalAmount = this.calculateTotal();
  };

  // Définition des associations
  Order.associate = function(models) {
    // Une commande appartient à un utilisateur
    Order.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // Note: Les items sont stockés en JSONB pour préserver l'état
    // au moment de la commande, mais on pourrait aussi avoir une
    // relation OrderItem si nécessaire pour des analyses plus poussées
  };

  // Exposer les constantes pour utilisation externe
  Order.STATUS = ORDER_STATUS;
  Order.VALID_TRANSITIONS = VALID_TRANSITIONS;

  return Order;
};