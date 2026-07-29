const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'carts',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: 'La quantité doit être supérieure à 0'
        },
        isInt: {
          msg: 'La quantité doit être un nombre entier'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Le prix doit être positif'
        },
        isDecimal: {
          msg: 'Le prix doit être un nombre décimal valide'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['cart_id', 'product_id'], // Un produit ne peut être qu'une seule fois par panier
        name: 'cart_items_cart_product_unique'
      },
      {
        fields: ['cart_id'] // Index pour les requêtes par panier
      },
      {
        fields: ['product_id'] // Index pour les requêtes par produit
      }
    ]
  });

  /**
   * Associations du modèle CartItem
   */
  CartItem.associate = function(models) {
    // Un article appartient à un panier
    CartItem.belongsTo(models.Cart, {
      foreignKey: 'cartId',
      as: 'cart',
      onDelete: 'CASCADE'
    });

    // Un article référence un produit
    CartItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
      onDelete: 'CASCADE'
    });
  };

  /**
   * Méthodes d'instance
   */
  CartItem.prototype.getTotalPrice = function() {
    return parseFloat(this.price) * this.quantity;
  };

  /**
   * Hooks du modèle
   */
  CartItem.addHook('beforeValidate', (cartItem) => {
    // S'assurer que la quantité est un entier positif
    if (cartItem.quantity) {
      cartItem.quantity = Math.max(1, Math.floor(cartItem.quantity));
    }
  });

  return CartItem;
};