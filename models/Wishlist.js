const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wishlist = sequelize.define('Wishlist', {
    id: {
      type: DataTypes.TEXT, // Changed from UUID to TEXT to match database
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.TEXT, // Changed from UUID to TEXT to match users table
      allowNull: false,
      unique: true, // Un utilisateur ne peut avoir qu'une seule wishlist
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
  }, {
    sequelize,
    modelName: 'Wishlist',
    tableName: 'wishlists',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  /**
   * Associations du modèle Wishlist
   */
  Wishlist.associate = function(models) {
    // Une wishlist appartient à un utilisateur
    Wishlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // Une wishlist a plusieurs items (WishlistItem)
    Wishlist.hasMany(models.WishlistItem, {
      foreignKey: 'wishlistId',
      as: 'items',
      onDelete: 'CASCADE'
    });
  };

  return Wishlist;
};