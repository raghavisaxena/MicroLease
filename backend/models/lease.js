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
      status: { type: DataTypes.ENUM('pending','approved','rejected','active','completed','cancelled'), defaultValue: 'pending' }
    }, { sequelize, modelName: 'Lease', tableName: 'leases', timestamps: true });

    return Lease;
  }
}

module.exports = Lease;
