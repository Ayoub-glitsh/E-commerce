const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WishlistItem = sequelize.define('WishlistItem', {
    id: {
      type: DataTypes.TEXT, // Changed from UUID to TEXT to match database
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    wishlistId: {
      type: DataTypes.TEXT, // Changed from UUID to TEXT to match wishlists table
      allowNull: false,
      references: {
        model: 'wishlists',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    productId: {
      type: DataTypes.TEXT, // Changed from UUID to TEXT to match products table
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    addedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'WishlistItem',
    tableName: 'wishlist_items',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['wishlist_id', 'product_id'], // Un produit ne peut être qu'une seule fois par wishlist
        name: 'wishlist_items_wishlist_product_unique'
      },
      {
        fields: ['wishlist_id'] // Index pour les requêtes par wishlist
      },
      {
        fields: ['product_id'] // Index pour les requêtes par produit
      }
    ]
  });

  /**
   * Associations du modèle WishlistItem
   */
  WishlistItem.associate = function(models) {
    // Un item appartient à une wishlist
    WishlistItem.belongsTo(models.Wishlist, {
      foreignKey: 'wishlistId',
      as: 'wishlist',
      onDelete: 'CASCADE'
    });

    // Un item référence un produit
    WishlistItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
      onDelete: 'CASCADE'
    });
  };

  return WishlistItem;
};