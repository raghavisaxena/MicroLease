const { DataTypes, Model } = require('sequelize');

class Wallet extends Model {
  static initModel(sequelize) {
    Wallet.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      UserId: { type: DataTypes.INTEGER, allowNull: false },
      balance: { type: DataTypes.FLOAT, defaultValue: 0 },
      totalDeposited: { type: DataTypes.FLOAT, defaultValue: 0 },
      totalRefunded: { type: DataTypes.FLOAT, defaultValue: 0 },
      totalClaimed: { type: DataTypes.FLOAT, defaultValue: 0 }
    }, { sequelize, modelName: 'Wallet', tableName: 'wallets', timestamps: true });

    return Wallet;
  }
}

module.exports = Wallet;
