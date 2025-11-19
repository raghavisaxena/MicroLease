const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

class User extends Model {
  static initModel(sequelize) {
    User.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('lessor','lessee','admin'), defaultValue: 'lessee' },
      banned: { type: DataTypes.BOOLEAN, defaultValue: false },
      // R-Score related stats
      onTimeReturns: { type: DataTypes.INTEGER, defaultValue: 0 },
      lateReturns: { type: DataTypes.INTEGER, defaultValue: 0 },
      goodConditionReturns: { type: DataTypes.INTEGER, defaultValue: 0 },
      damageReports: { type: DataTypes.INTEGER, defaultValue: 0 },
      lostItems: { type: DataTypes.INTEGER, defaultValue: 0 },
      disputesWon: { type: DataTypes.INTEGER, defaultValue: 0 },
      disputesLost: { type: DataTypes.INTEGER, defaultValue: 0 },
      ratingImpactSum: { type: DataTypes.FLOAT, defaultValue: 0 },
      completedLeases: { type: DataTypes.INTEGER, defaultValue: 0 },
      rscore: { type: DataTypes.FLOAT, defaultValue: 80 }
    }, { sequelize, modelName: 'User', tableName: 'users', timestamps: true });

    User.beforeCreate(async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    });

    User.beforeUpdate(async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    });

    return User;
  }

  async validPassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

module.exports = User;
