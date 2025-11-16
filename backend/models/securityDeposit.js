const { DataTypes, Model } = require('sequelize');

class SecurityDeposit extends Model {
  static initModel(sequelize) {
    SecurityDeposit.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      LeaseId: { type: DataTypes.INTEGER, allowNull: false },
      UserId: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.FLOAT, allowNull: false },
      status: { type: DataTypes.ENUM('held', 'refunded', 'claimed'), defaultValue: 'held' },
      damageClaimed: { type: DataTypes.BOOLEAN, defaultValue: false },
      damageDescription: { type: DataTypes.TEXT },
      damageAmount: { type: DataTypes.FLOAT },
      returnedAt: { type: DataTypes.DATE },
      refundedAt: { type: DataTypes.DATE },
      refundDueAt: { type: DataTypes.DATE } // 24 hours after item returned
    }, { sequelize, modelName: 'SecurityDeposit', tableName: 'securitydeposits', timestamps: true });

    return SecurityDeposit;
  }
}

module.exports = SecurityDeposit;
