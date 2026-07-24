'use strict';

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.TEXT, // Correspondance avec le style de la DB
      primaryKey: true,
      allowNull: false,
      defaultValue: () => {
        // Génération d'un UUID v4 simple en TEXT
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'user_id', // Mapping vers la colonne snake_case
      validate: {
        notEmpty: {
          msg: 'L\'ID utilisateur ne peut pas être vide'
        }
      }
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: {
        name: 'unique_refresh_token',
        msg: 'Ce token de rafraîchissement existe déjà'
      },
      validate: {
        notEmpty: {
          msg: 'Le token ne peut pas être vide'
        },
        len: {
          args: [10, 1000],
          msg: 'Le token doit contenir entre 10 et 1000 caractères'
        }
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at', // Mapping vers la colonne snake_case
      validate: {
        notEmpty: {
          msg: 'La date d\'expiration ne peut pas être vide'
        },
        isDate: {
          msg: 'La date d\'expiration doit être une date valide'
        },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'La date d\'expiration doit être dans le futur'
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active', // Mapping vers la colonne snake_case
      validate: {
        isBoolean: {
          msg: 'isActive doit être un booléen'
        }
      }
    }
  }, {
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true, // Utilise snake_case pour les colonnes
    paranoid: false, // Pas de soft delete pour cette table
    hooks: {
      // Hook pour valider la date d'expiration
      beforeCreate: (refreshToken, options) => {
        if (new Date(refreshToken.expiresAt) <= new Date()) {
          throw new Error('La date d\'expiration doit être dans le futur');
        }
      },
      beforeUpdate: (refreshToken, options) => {
        if (refreshToken.changed('expiresAt') && new Date(refreshToken.expiresAt) <= new Date()) {
          throw new Error('La date d\'expiration doit être dans le futur');
        }
      }
    }
  });

  // Définir les associations
  RefreshToken.associate = (models) => {
    // Un refresh token appartient à un utilisateur
    RefreshToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Méthodes d'instance
  RefreshToken.prototype.isExpired = function() {
    return new Date() > this.expiresAt;
  };

  RefreshToken.prototype.isValid = function() {
    return this.isActive && !this.isExpired();
  };

  // Méthodes statiques
  RefreshToken.generateExpiryDate = function(daysFromNow = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromNow);
    return expiryDate;
  };

  RefreshToken.cleanupExpired = async function() {
    const { Op } = require('sequelize');
    return await RefreshToken.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });
  };

  return RefreshToken;
};