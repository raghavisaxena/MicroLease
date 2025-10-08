const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');
const models = require('./models');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const leaseRoutes = require('./routes/leases');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => res.send('MicroLease API Running'));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await models.sequelize.sync({ alter: true }); // change to force:false in production
    console.log('Models synced');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('Failed to start', err);
  }
})();
