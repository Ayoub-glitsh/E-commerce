const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Un utilisateur ne peut avoir qu'un seul panier
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
  }, {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  /**
   * Associations du modèle Cart
   */
  Cart.associate = function(models) {
    // Un panier appartient à un utilisateur
    Cart.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // Un panier a plusieurs articles (CartItem)
    Cart.hasMany(models.CartItem, {
      foreignKey: 'cartId',
      as: 'items',
      onDelete: 'CASCADE'
    });
  };

  return Cart;
};