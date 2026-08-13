require('dotenv').config();
const fs = require('fs');
const { sequelize } = require('../models');

let out = [];

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    await sequelize.authenticate();
    out.push('AUTH OK');

    // 1. Créer la table wishlists
    out.push('Création de wishlists...');
    await qi.createTable('wishlists', {
      id: { type: sequelize.Sequelize.UUID, defaultValue: sequelize.Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: { type: sequelize.Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      created_at: { type: sequelize.Sequelize.DATE, allowNull: false, defaultValue: sequelize.Sequelize.NOW },
      updated_at: { type: sequelize.Sequelize.DATE, allowNull: false, defaultValue: sequelize.Sequelize.NOW }
    });
    await qi.addIndex('wishlists', ['user_id'], { name: 'wishlists_user_id_idx' });
    out.push('wishlists créée');

    // 2. Créer la table wishlist_items
    out.push('Création de wishlist_items...');
    await qi.createTable('wishlist_items', {
      id: { type: sequelize.Sequelize.UUID, defaultValue: sequelize.Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      wishlist_id: { type: sequelize.Sequelize.UUID, allowNull: false, references: { model: 'wishlists', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      product_id: { type: sequelize.Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      added_at: { type: sequelize.Sequelize.DATE, allowNull: false, defaultValue: sequelize.Sequelize.NOW },
      created_at: { type: sequelize.Sequelize.DATE, allowNull: false, defaultValue: sequelize.Sequelize.NOW },
      updated_at: { type: sequelize.Sequelize.DATE, allowNull: false, defaultValue: sequelize.Sequelize.NOW }
    });
    await qi.addIndex('wishlist_items', ['wishlist_id', 'product_id'], { unique: true, name: 'wishlist_items_wishlist_product_unique' });
    await qi.addIndex('wishlist_items', ['wishlist_id'], { name: 'wishlist_items_wishlist_id_idx' });
    await qi.addIndex('wishlist_items', ['product_id'], { name: 'wishlist_items_product_id_idx' });
    out.push('wishlist_items créée');

    // Vérification
    for (const t of ['wishlists', 'wishlist_items']) {
      const [r] = await sequelize.query('SELECT COUNT(*) AS c FROM "' + t + '"');
      out.push(t + ': EXISTS (count=' + r[0].c + ')');
    }
  } catch (e) {
    out.push('ERROR: ' + (e && e.message ? e.message : e));
    if (e && e.sql) out.push('SQL: ' + e.sql);
  } finally {
    await sequelize.close();
  }
}

run().then(() => {
  fs.writeFileSync('wishlist-debug-output.txt', out.join('\n'));
  console.log('done');
});
