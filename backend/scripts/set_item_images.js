const sequelize = require('../config/db');
const { Item } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const mapping = {
      'Canon EOS 90D': 'camera-1.jpg',
      'MacBook Air M2': 'laptop-1.jpg',
      'DJ Speaker 200W': 'headphones-1.jpg',
      'Roland GP609 Digital Grand Piano': 'piano-1.png',
      'DJI Mavic 3 Pro': 'drone-1.jpg',
      'iPhone 15 Pro Max': 'phone-1.jpg',
      'Sony WH-1000XM5': 'headphones-1.jpg',
      'iPad Pro 12.9"': 'tablet-1.jpg'
    };

    for (const [title, filename] of Object.entries(mapping)) {
      const item = await Item.findOne({ where: { title } });
      if (!item) {
        console.log(`No item found with title='${title}'`);
        continue;
      }
      const url = `/assets/${filename}`;
      if ((item.imageUrl || '') === url) {
        console.log(`Item '${title}' already has imageUrl set to ${url}`);
        continue;
      }
      item.imageUrl = url;
      await item.save();
      console.log(`Updated item id=${item.id} title='${title}' imageUrl='${url}'`);
    }

    console.log('Done setting images.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to set images', err);
    process.exit(1);
  }
})();
