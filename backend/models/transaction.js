const { DataTypes, Model } = require('sequelize');

class Transaction extends Model {
  static initModel(sequelize) {
    Transaction.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      UserId: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.FLOAT, allowNull: false },
      type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false }
    }, { sequelize, modelName: 'Transaction', tableName: 'transactions', timestamps: true });

    return Transaction;
  }
}

module.exports = Transaction;
