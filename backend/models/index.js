const sequelize = require('../config/db');
const User = require('./user');
const Item = require('./item');
const Lease = require('./lease');
const Payment = require('./payment');

const models = {
  User: User.initModel(sequelize),
  Item: Item.initModel(sequelize),
  Lease: Lease.initModel(sequelize),
  Payment: Payment.initModel(sequelize)
};

// Associations
models.User.hasMany(models.Item, { foreignKey: 'OwnerId', as: 'items' });
models.Item.belongsTo(models.User, { foreignKey: 'OwnerId', as: 'owner' });

models.Item.hasMany(models.Lease, { foreignKey: 'ItemId', as: 'leases' });
models.Lease.belongsTo(models.Item, { foreignKey: 'ItemId', as: 'item' });

models.User.hasMany(models.Lease, { foreignKey: 'LesseeId', as: 'leases' });
models.Lease.belongsTo(models.User, { foreignKey: 'LesseeId', as: 'lessee' });

models.Lease.hasOne(models.Payment, { foreignKey: 'LeaseId', as: 'payment' });
models.Payment.belongsTo(models.Lease, { foreignKey: 'LeaseId', as: 'lease' });

module.exports = { ...models, sequelize };
