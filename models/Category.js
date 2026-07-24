'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.TEXT, // UUID stocké comme TEXT (cohérence avec la DB existante)
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: {
        name: 'unique_category_name',
        msg: 'Ce nom de catégorie existe déjà'
      },
      validate: {
        notEmpty: {
          msg: 'Le nom de la catégorie ne peut pas être vide'
        },
        len: {
          args: [2, 100],
          msg: 'Le nom de la catégorie doit contenir entre 2 et 100 caractères'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'La description ne peut pas dépasser 500 caractères'
        }
      }
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true, // created_at, updated_at
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  // Définir les associations
  Category.associate = (models) => {
    // Une catégorie peut avoir plusieurs produits
    if (models.Product) {
      Category.hasMany(models.Product, {
        foreignKey: 'categoryId',
        as: 'products',
        onDelete: 'RESTRICT' // Empêche la suppression d'une catégorie qui a des produits
      });
    }
  };

  return Category;
};