const sequelize = require('../config/db');
const { Item, User } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const samples = [
      { title: 'Canon EOS 90D', description: 'Good condition', category: 'Camera', pricePerDay: 500, imageUrl: '', ownerEmail: 'alice@example.com' },
      { title: 'MacBook Air M2', description: 'Like new', category: 'Laptop', pricePerDay: 2200, imageUrl: '', ownerEmail: 'alice@example.com' },
      { title: 'DJ Speaker 200W', description: 'Portable', category: 'Audio', pricePerDay: 800, imageUrl: '', ownerEmail: 'alice@example.com' }
    ];

    for (const s of samples) {
      // find owner
      const owner = await User.findOne({ where: { email: s.ownerEmail } });
      const ownerId = owner ? owner.id : null;

      const exists = await Item.findOne({ where: { title: s.title } });
      if (exists) {
        console.log(`Item '${s.title}' already exists (id=${exists.id})`);
        continue;
      }

      const created = await Item.create({
        title: s.title,
        description: s.description,
        category: s.category,
        pricePerDay: s.pricePerDay,
        imageUrl: s.imageUrl,
        OwnerId: ownerId
      });
      console.log(`Created sample item '${s.title}' id=${created.id}`);
    }

    console.log('Sample items ensured.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to ensure samples', err);
    process.exit(1);
  }
})();
