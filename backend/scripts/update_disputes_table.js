const db = require('../config/db');

async function updateDisputesTable() {
  try {
    console.log('Updating disputes table...');
    
    // Check and add type column
    const [typeColumn] = await db.query(
      'SHOW COLUMNS FROM disputes LIKE "type"'
    );
    if (typeColumn.length === 0) {
      await db.query(
        "ALTER TABLE disputes ADD COLUMN type ENUM('complaint', 'feedback', 'dispute') DEFAULT 'complaint' AFTER status"
      );
      console.log('✓ Added type column');
    }
    
    // Check and add againstUser column
    const [againstUserColumn] = await db.query(
      'SHOW COLUMNS FROM disputes LIKE "againstUser"'
    );
    if (againstUserColumn.length === 0) {
      await db.query(
        'ALTER TABLE disputes ADD COLUMN againstUser VARCHAR(255) AFTER type'
      );
      console.log('✓ Added againstUser column');
    }
    
    // Check and add reportedBy column
    const [reportedByColumn] = await db.query(
      'SHOW COLUMNS FROM disputes LIKE "reportedBy"'
    );
    if (reportedByColumn.length === 0) {
      await db.query(
        'ALTER TABLE disputes ADD COLUMN reportedBy INT AFTER againstUser'
      );
      console.log('✓ Added reportedBy column');
    }
    
    // Update status enum to include new values
    await db.query(
      "ALTER TABLE disputes MODIFY COLUMN status ENUM('open', 'in_progress', 'resolved', 'closed', 'pending') DEFAULT 'open'"
    );
    console.log('✓ Updated status enum values');
    
    // Update resolution enum to include new values
    await db.query(
      "ALTER TABLE disputes MODIFY COLUMN resolution ENUM('refund_to_owner', 'refund_to_renter', 'no_action')"
    );
    console.log('✓ Updated resolution enum values');
    
    // Make LeaseId, ItemId, RenterId, OwnerId nullable
    await db.query('ALTER TABLE disputes MODIFY COLUMN LeaseId INT NULL');
    await db.query('ALTER TABLE disputes MODIFY COLUMN ItemId INT NULL');
    await db.query('ALTER TABLE disputes MODIFY COLUMN RenterId INT NULL');
    await db.query('ALTER TABLE disputes MODIFY COLUMN OwnerId INT NULL');
    console.log('✓ Made foreign key columns nullable');
    
    console.log('✅ Successfully updated disputes table');
    process.exit(0);
  } catch (error) {
    console.error('Error updating disputes table:', error);
    process.exit(1);
  }
}

updateDisputesTable();
