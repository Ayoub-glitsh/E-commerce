'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.TEXT, // UUID stocké comme TEXT (cohérence avec la DB existante)
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le nom du produit ne peut pas être vide'
        },
        len: {
          args: [2, 200],
          msg: 'Le nom du produit doit contenir entre 2 et 200 caractères'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'La description ne peut pas dépasser 2000 caractères'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Le prix doit être un nombre décimal valide'
        },
        min: {
          args: [0],
          msg: 'Le prix ne peut pas être négatif'
        }
      }
    },
    categoryId: {
      type: DataTypes.TEXT, // UUID de la catégorie
      allowNull: false,
      field: 'category_id', // Mapping vers la colonne snake_case
      validate: {
        notEmpty: {
          msg: 'La catégorie est obligatoire'
        }
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Le stock doit être un nombre entier'
        },
        min: {
          args: [0],
          msg: 'Le stock ne peut pas être négatif'
        }
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT), // Array PostgreSQL natif
      allowNull: false,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (!Array.isArray(value)) {
            throw new Error('Les images doivent être un tableau');
          }
          if (value.length > 10) {
            throw new Error('Maximum 10 images par produit');
          }
          value.forEach(url => {
            if (typeof url !== 'string' || url.length === 0) {
              throw new Error('Chaque image doit être une URL valide');
            }
          });
        }
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT), // Array PostgreSQL natif
      allowNull: false,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (!Array.isArray(value)) {
            throw new Error('Les tags doivent être un tableau');
          }
          if (value.length > 20) {
            throw new Error('Maximum 20 tags par produit');
          }
          value.forEach(tag => {
            if (typeof tag !== 'string' || tag.length === 0) {
              throw new Error('Chaque tag doit être une chaîne non vide');
            }
          });
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active' // Mapping vers la colonne snake_case
    },
    ratingAvg: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'rating_avg', // Mapping vers la colonne snake_case
      validate: {
        min: {
          args: [0],
          msg: 'La note moyenne ne peut pas être négative'
        },
        max: {
          args: [5],
          msg: 'La note moyenne ne peut pas dépasser 5'
        }
      }
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'rating_count', // Mapping vers la colonne snake_case
      validate: {
        min: {
          args: [0],
          msg: 'Le nombre de notes ne peut pas être négatif'
        }
      }
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true, // created_at, updated_at
    paranoid: false,
    indexes: [
      {
        fields: ['category_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['price']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['rating_avg']
      }
    ]
  });

  // Définir les associations
  Product.associate = (models) => {
    // Un produit appartient à une catégorie (ManyToOne)
    if (models.Category) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
        onDelete: 'RESTRICT' // Empêche la suppression de la catégorie si elle a des produits
      });
    }

    // Associations avec autres tables existantes
    if (models.Review) {
      Product.hasMany(models.Review, {
        foreignKey: 'productId',
        as: 'reviews'
      });
    }

    if (models.CartItem) {
      Product.hasMany(models.CartItem, {
        foreignKey: 'productId',
        as: 'cartItems'
      });
    }

    if (models.UserEvent) {
      Product.hasMany(models.UserEvent, {
        foreignKey: 'productId',
        as: 'userEvents'
      });
    }

    if (models.WishlistItem) {
      Product.hasMany(models.WishlistItem, {
        foreignKey: 'productId',
        as: 'wishlistItems'
      });
    }
  };

  return Product;
};