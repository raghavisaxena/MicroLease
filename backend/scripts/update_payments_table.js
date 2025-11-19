const { sequelize } = require('../models');
const { QueryInterface, DataTypes } = require('sequelize');

async function updatePaymentsTable() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('Starting payments table update...');

    // Add transactionId column
    try {
      await queryInterface.addColumn('payments', 'transactionId', {
        type: DataTypes.STRING,
        allowNull: true,
        after: 'status'
      });
      console.log('✓ Added transactionId column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('- transactionId column already exists');
      } else {
        throw error;
      }
    }

    // Add paymentType column
    try {
      await queryInterface.addColumn('payments', 'paymentType', {
        type: DataTypes.ENUM('security_deposit', 'full_payment', 'rental'),
        defaultValue: 'rental',
        allowNull: false,
        after: 'transactionId'
      });
      console.log('✓ Added paymentType column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('- paymentType column already exists');
      } else {
        throw error;
      }
    }

    console.log('\nPayments table update completed successfully!');
  } catch (error) {
    console.error('Error updating payments table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

updatePaymentsTable();
