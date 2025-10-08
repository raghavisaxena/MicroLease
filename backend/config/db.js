const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('microlease_db', 'root', '224466', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
