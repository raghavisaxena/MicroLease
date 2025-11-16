const sequelize = require('../config/db');
const User = require('./user');
const Item = require('./item');
const Lease = require('./lease');
const Payment = require('./payment');
const Wallet = require('./wallet');
const SecurityDeposit = require('./securityDeposit');
const Kyc = require('./kyc');

const models = {
  User: User.initModel(sequelize),
  Item: Item.initModel(sequelize),
  Lease: Lease.initModel(sequelize),
  Payment: Payment.initModel(sequelize),
  Wallet: Wallet.initModel(sequelize),
  SecurityDeposit: SecurityDeposit.initModel(sequelize)
  ,Kyc: Kyc.initModel(sequelize)
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

// Wallet associations
models.User.hasOne(models.Wallet, { foreignKey: 'UserId', as: 'wallet' });
models.Wallet.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });

// SecurityDeposit associations
models.Lease.hasOne(models.SecurityDeposit, { foreignKey: 'LeaseId', as: 'securityDeposit' });
models.SecurityDeposit.belongsTo(models.Lease, { foreignKey: 'LeaseId', as: 'lease' });

models.User.hasMany(models.SecurityDeposit, { foreignKey: 'UserId', as: 'securityDeposits' });
models.SecurityDeposit.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });

// KYC associations
models.User.hasOne(models.Kyc, { foreignKey: 'UserId', as: 'kyc' });
models.Kyc.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });

module.exports = { ...models, sequelize };
