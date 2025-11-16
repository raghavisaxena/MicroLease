const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('microlease_db', 'root', 'PiyushJha@0212', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
