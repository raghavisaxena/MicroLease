const { DataTypes, Model } = require('sequelize');

class Review extends Model {
  static initModel(sequelize) {
    Review.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      LeaseId: { type: DataTypes.INTEGER, allowNull: false },
      reviewerId: { type: DataTypes.INTEGER, allowNull: false },
      reviewedUserId: { type: DataTypes.INTEGER, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT }
    }, { sequelize, modelName: 'Review', tableName: 'reviews', timestamps: true });

    return Review;
  }
}

module.exports = Review;
