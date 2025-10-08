const { DataTypes, Model } = require('sequelize');

class Payment extends Model {
  static initModel(sequelize) {
    Payment.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      LeaseId: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.FLOAT, allowNull: false },
      date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      mode: { type: DataTypes.STRING, defaultValue: 'mock' },
      status: { type: DataTypes.ENUM('paid','refunded','failed'), defaultValue: 'paid' }
    }, { sequelize, modelName: 'Payment', tableName: 'payments', timestamps: true });

    return Payment;
  }
}

module.exports = Payment;
