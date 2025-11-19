const db = require('../config/db');

async function addMissingColumns() {
  try {
    console.log('Adding missing columns...');
    
    // Check if type column exists
    const [typeCol] = await db.query('SHOW COLUMNS FROM disputes LIKE "type"');
    if (typeCol.length === 0) {
      await db.query('ALTER TABLE disputes ADD COLUMN type ENUM("complaint", "feedback", "dispute") DEFAULT "complaint"');
      console.log('✓ Added type column');
    } else {
      console.log('→ type column already exists');
    }
    
    // Check if againstUser column exists  
    const [againstCol] = await db.query('SHOW COLUMNS FROM disputes LIKE "againstUser"');
    if (againstCol.length === 0) {
      await db.query('ALTER TABLE disputes ADD COLUMN againstUser VARCHAR(255)');
      console.log('✓ Added againstUser column');
    } else {
      console.log('→ againstUser column already exists');
    }
    
    // Check if reportedBy column exists
    const [reportedCol] = await db.query('SHOW COLUMNS FROM disputes LIKE "reportedBy"');
    if (reportedCol.length === 0) {
      await db.query('ALTER TABLE disputes ADD COLUMN reportedBy INT');
      console.log('✓ Added reportedBy column');
    } else {
      console.log('→ reportedBy column already exists');
    }
    
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addMissingColumns();
