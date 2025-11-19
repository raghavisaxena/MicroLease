const { DataTypes, Model } = require('sequelize');

class Lease extends Model {
  static initModel(sequelize) {
    Lease.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      ItemId: { type: DataTypes.INTEGER, allowNull: false },
      LesseeId: { type: DataTypes.INTEGER, allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.FLOAT, allowNull: false },
      securityDepositAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      status: { type: DataTypes.ENUM('pending','approved','rejected','active','completed','cancelled'), defaultValue: 'pending' },
      // Return info
      returned: { type: DataTypes.BOOLEAN, defaultValue: false },
      returnedAt: { type: DataTypes.DATE },
      returnCondition: { type: DataTypes.ENUM('good','damaged','lost'), allowNull: true },
      returnedOnTime: { type: DataTypes.BOOLEAN, defaultValue: null }
    }, { sequelize, modelName: 'Lease', tableName: 'leases', timestamps: true });

    return Lease;
  }
}

module.exports = Lease;
