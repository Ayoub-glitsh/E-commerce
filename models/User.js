'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.TEXT, // Correspondance avec la DB existante
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: {
        name: 'unique_user_email',
        msg: 'Cette adresse email est déjà utilisée'
      },
      validate: {
        isEmail: {
          msg: 'Format d\'email invalide'
        },
        notEmpty: {
          msg: 'L\'email ne peut pas être vide'
        }
      }
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le mot de passe ne peut pas être vide'
        },
        len: {
          args: [8, 255],
          msg: 'Le mot de passe doit contenir au minimum 8 caractères'
        }
      }
    },
    role: {
      type: DataTypes.TEXT, // Utilise TEXT au lieu d'ENUM pour correspondre à la DB
      allowNull: false,
      defaultValue: 'client',
      validate: {
        isIn: {
          args: [['client', 'admin']],
          msg: 'Le rôle doit être soit "client" soit "admin"'
        }
      }
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Le nom doit contenir entre 2 et 100 caractères'
        }
      }
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token' // Mapping vers la colonne snake_case
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true, // Utilise snake_case pour les colonnes
    paranoid: false, // Pas de soft delete pour cette table
    hooks: {
      // Hook pour valider le mot de passe avant la création
      beforeCreate: (user, options) => {
        if (!user.password || user.password.length < 8) {
          throw new Error('Le mot de passe doit contenir au minimum 8 caractères');
        }
      },
      beforeUpdate: (user, options) => {
        if (user.changed('password') && (!user.password || user.password.length < 8)) {
          throw new Error('Le mot de passe doit contenir au minimum 8 caractères');
        }
      }
    }
  });

  // Définir les associations
  User.associate = (models) => {
    // Un utilisateur peut avoir plusieurs refresh tokens (table séparée)
    if (models.RefreshToken) {
      User.hasMany(models.RefreshToken, {
        foreignKey: 'userId',
        as: 'refreshTokens',
        onDelete: 'CASCADE'
      });
    }

    // Autres associations avec tables existantes
    if (models.Review) {
      User.hasMany(models.Review, {
        foreignKey: 'userId',
        as: 'reviews'
      });
    }

    if (models.Cart) {
      User.hasOne(models.Cart, {
        foreignKey: 'userId',
        as: 'cart'
      });
    }

    if (models.Order) {
      User.hasMany(models.Order, {
        foreignKey: 'userId',
        as: 'orders'
      });
    }

    if (models.UserEvent) {
      User.hasMany(models.UserEvent, {
        foreignKey: 'userId',
        as: 'userEvents'
      });
    }
  };

  return User;
};