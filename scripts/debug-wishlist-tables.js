require('dotenv').config();
const fs = require('fs');
const { sequelize } = require('../models');

let out = [];

async function run() {
  try {
    await sequelize.authenticate();
    out.push('AUTH OK');

    const [schema] = await sequelize.query('SELECT current_schema() AS s');
    out.push('current_schema: ' + schema[0].s);

    const [tables] = await sequelize.query(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type='BASE TABLE' ORDER BY table_schema, table_name"
    );
    out.push('ALL TABLES: ' + tables.map((t) => t.table_schema + '.' + t.table_name).join(', '));

    for (const t of ['wishlists', 'wishlist_items', 'carts', 'cart_items', 'orders', 'reviews']) {
      try {
        const [r] = await sequelize.query('SELECT COUNT(*) AS c FROM "' + t + '"');
        out.push(t + ': EXISTS (count=' + r[0].c + ')');
      } catch (e) {
        out.push(t + ': MISSING -> ' + e.message);
      }
    }
  } catch (e) {
    out.push('ERROR: ' + e.message);
  } finally {
    await sequelize.close();
  }
}

run().then(() => {
  fs.writeFileSync('wishlist-debug-output.txt', out.join('\n'));
  console.log('done');
});
