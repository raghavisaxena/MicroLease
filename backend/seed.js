// Run once to create schema and sample data
const sequelize = require('./config/db');
const { User, Item } = require('./models');

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('DB synced (force:true)');

    const lessor = await User.create({ name: 'Alice Lessor', email: 'alice@example.com', password: 'password', role: 'lessor' });
    const lessee = await User.create({ name: 'Bob Lessee', email: 'bob@example.com', password: 'password', role: 'lessee' });
    const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: 'adminpass', role: 'admin' });

    await Item.create({ title: 'Canon EOS 90D', description: 'Good condition', category: 'Camera', pricePerDay: 500, imageUrl: '', OwnerId: lessor.id });
    await Item.create({ title: 'MacBook Air M2', description: 'Like new', category: 'Laptop', pricePerDay: 2200, imageUrl: '', OwnerId: lessor.id });
    await Item.create({ title: 'DJ Speaker 200W', description: 'Portable', category: 'Audio', pricePerDay: 800, imageUrl: '', OwnerId: lessor.id });

    console.log('Seed data created.');
    console.log('Users: alice@example.com / bob@example.com / admin@example.com (passwords: password / password / adminpass)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
