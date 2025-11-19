const { sequelize } = require('../models');

async function fixUserTableIndexes() {
  try {
    console.log('Fixing user table indexes...');

    // Get all indexes on users table
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM users WHERE Key_name != 'PRIMARY';
    `);

    console.log(`Found ${indexes.length} indexes (excluding PRIMARY)`);

    // Drop all non-primary indexes
    for (const index of indexes) {
      try {
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${index.Key_name}\`;`);
        console.log(`✓ Dropped index: ${index.Key_name}`);
      } catch (error) {
        if (!error.message.includes("check that it exists")) {
          console.log(`- Could not drop ${index.Key_name}: ${error.message}`);
        }
      }
    }

    // Recreate only the email unique index
    try {
      await sequelize.query(`
        ALTER TABLE users ADD UNIQUE INDEX email_unique (email);
      `);
      console.log('✓ Added email unique index');
    } catch (error) {
      if (error.message.includes('Duplicate')) {
        console.log('- Email unique index already exists');
      } else {
        throw error;
      }
    }

    console.log('\n✓ User table indexes fixed successfully!');
  } catch (error) {
    console.error('Error fixing indexes:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixUserTableIndexes();
