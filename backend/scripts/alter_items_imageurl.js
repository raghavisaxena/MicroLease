const sequelize = require('../config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Use LONGTEXT to be safe for very large base64 images
    const sql = `ALTER TABLE items MODIFY COLUMN imageUrl LONGTEXT;`;
    await sequelize.query(sql);
    console.log('Successfully altered items.imageUrl to LONGTEXT');
    process.exit(0);
  } catch (err) {
    console.error('Failed to alter column:', err);
    process.exit(1);
  }
})();
