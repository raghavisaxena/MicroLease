const { DataTypes, Model } = require('sequelize');

class Dispute extends Model {
  static initModel(sequelize) {
    Dispute.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      LeaseId: { type: DataTypes.INTEGER, allowNull: true },
      ItemId: { type: DataTypes.INTEGER, allowNull: true },
      RenterId: { type: DataTypes.INTEGER, allowNull: true },
      OwnerId: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      renterPhotos: { type: DataTypes.JSON },
      ownerPhotos: { type: DataTypes.JSON },
      depositAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
      resolution: { type: DataTypes.ENUM('refund_to_owner', 'refund_to_renter', 'no_action'), allowNull: true },
      type: { type: DataTypes.ENUM('complaint', 'feedback', 'dispute'), defaultValue: 'complaint' },
      againstUser: { type: DataTypes.STRING, allowNull: true },
      reportedBy: { type: DataTypes.INTEGER, allowNull: true }
    }, { sequelize, modelName: 'Dispute', tableName: 'disputes', timestamps: true });

    return Dispute;
  }
}

module.exports = Dispute;
