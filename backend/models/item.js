const { DataTypes, Model } = require('sequelize');

class Item extends Model {
  static initModel(sequelize) {
    Item.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      category: { type: DataTypes.STRING },
      pricePerDay: { type: DataTypes.FLOAT, allowNull: false },
      availability: { type: DataTypes.BOOLEAN, defaultValue: true },
      imageUrl: { type: DataTypes.STRING },
      OwnerId: { type: DataTypes.INTEGER }
    }, { sequelize, modelName: 'Item', tableName: 'items', timestamps: true });

    return Item;
  }
}

module.exports = Item;
