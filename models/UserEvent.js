'use strict';

module.exports = (sequelize, DataTypes) => {
    const UserEvent = sequelize.define('UserEvent', {
        id: {
        type: DataTypes.TEXT,
        primaryKey: true,
        allowNull: false
        },
        userId: {
        type: DataTypes.TEXT, 
        allowNull: false,
        field: 'user_id',
        validate: {
            notEmpty: {
            msg: 'L\'utilisateur est obligatoire'
            }
        }
        },
        eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'event_type',
        validate: {
            isIn: {
            args: [['view', 'purchase']],
            msg: 'Le type d\'événement doit être "view" ou "purchase"'
            }
        }
        },
        // Utilisé pour les événements "view" : un seul produit consulté
        productId: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'product_id'
        },
        // Utilisé pour les événements "purchase" : plusieurs produits achetés
        productIds: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        field: 'product_ids'
        },
        // Utilisé pour les événements "purchase"
        totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'total_amount',
        validate: {
            min: {
            args: [0],
            msg: 'Le montant total ne peut pas être négatif'
            }
        }
        },
        
        sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'session_id'
        }
    }, {
        tableName: 'user_events',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at', 
        updatedAt: false, 
        indexes: [
        { fields: ['user_id'] },
        { fields: ['product_id'] },
        { fields: ['event_type'] },
        { fields: ['session_id'] }
        ]
    });

    UserEvent.associate = (models) => {
        if (models.User) {
        UserEvent.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        }
        if (models.Product) {
        UserEvent.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product'
        });
        }
    };

    return UserEvent;
    };