const sequelize = require('../config/db');
const User = require('./user');
const Item = require('./item');
const Lease = require('./lease');
const Payment = require('./payment');
const Wallet = require('./wallet');
const SecurityDeposit = require('./securityDeposit');
const Kyc = require('./kyc');
const Review = require('./review');
const Dispute = require('./dispute');
const Transaction = require('./transaction');

const models = {
  User: User.initModel(sequelize),
  Item: Item.initModel(sequelize),
  Lease: Lease.initModel(sequelize),
  Review: Review.initModel(sequelize),
  Payment: Payment.initModel(sequelize),
  Wallet: Wallet.initModel(sequelize),
  SecurityDeposit: SecurityDeposit.initModel(sequelize),
  Kyc: Kyc.initModel(sequelize),
  Dispute: Dispute.initModel(sequelize),
  Transaction: Transaction.initModel(sequelize)
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

// Reviews
models.Lease.hasMany(models.Review, { foreignKey: 'LeaseId', as: 'reviews' });
models.Review.belongsTo(models.Lease, { foreignKey: 'LeaseId', as: 'lease' });

models.User.hasMany(models.Review, { foreignKey: 'reviewerId', as: 'givenReviews' });
models.User.hasMany(models.Review, { foreignKey: 'reviewedUserId', as: 'receivedReviews' });
models.Review.belongsTo(models.User, { foreignKey: 'reviewerId', as: 'reviewer' });
models.Review.belongsTo(models.User, { foreignKey: 'reviewedUserId', as: 'reviewedUser' });

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

// Dispute associations
models.Lease.hasMany(models.Dispute, { foreignKey: 'LeaseId', as: 'disputes' });
models.Dispute.belongsTo(models.Lease, { foreignKey: 'LeaseId', as: 'lease' });
models.Item.hasMany(models.Dispute, { foreignKey: 'ItemId', as: 'disputes' });
models.Dispute.belongsTo(models.Item, { foreignKey: 'ItemId', as: 'item' });
models.User.hasMany(models.Dispute, { foreignKey: 'RenterId', as: 'renterDisputes' });
models.User.hasMany(models.Dispute, { foreignKey: 'OwnerId', as: 'ownerDisputes' });

// Transaction associations
models.User.hasMany(models.Transaction, { foreignKey: 'UserId', as: 'transactions' });
models.Transaction.belongsTo(models.User, { foreignKey: 'UserId', as: 'user' });

module.exports = { ...models, sequelize };
