const db = require('../config/db');

async function addSecurityDepositColumn() {
  try {
    console.log('Checking if securityDepositAmount column exists...');
    
    // Check if column exists
    const [columns] = await db.query(
      'SHOW COLUMNS FROM leases LIKE "securityDepositAmount"'
    );
    
    if (columns.length > 0) {
      console.log('✓ securityDepositAmount column already exists');
      process.exit(0);
      return;
    }
    
    // Check if old column name exists and rename it
    const [oldColumns] = await db.query(
      'SHOW COLUMNS FROM leases LIKE "securityDeposit"'
    );
    
    if (oldColumns.length > 0) {
      console.log('Renaming securityDeposit to securityDepositAmount...');
      await db.query(
        'ALTER TABLE leases CHANGE COLUMN securityDeposit securityDepositAmount FLOAT DEFAULT 0'
      );
      console.log('✓ Successfully renamed column');
      process.exit(0);
      return;
    }
    
    console.log('Adding securityDepositAmount column to leases table...');
    await db.query(
      'ALTER TABLE leases ADD COLUMN securityDepositAmount FLOAT DEFAULT 0 AFTER amount'
    );
    
    console.log('✓ Successfully added securityDepositAmount column');
    process.exit(0);
  } catch (error) {
    console.error('Error adding securityDepositAmount column:', error);
    process.exit(1);
  }
}

addSecurityDepositColumn();
