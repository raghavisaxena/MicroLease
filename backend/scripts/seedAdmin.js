const { User } = require('../models');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  try {
    const existing = await User.findOne({ where: { email: 'admin@microlease.com' } });
    
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    await User.create({
      name: 'Admin',
      email: 'admin@microlease.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@microlease.com');
    console.log('Password: Admin@123');
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

module.exports = seedAdmin;

// Run if called directly
if (require.main === module) {
  const sequelize = require('../config/db');
  sequelize.authenticate()
    .then(() => seedAdmin())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
