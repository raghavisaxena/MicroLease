const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');
const models = require('./models');
const path = require('path');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const leaseRoutes = require('./routes/leases');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors(
  {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
));
// Increase JSON body size to allow base64 image uploads from the frontend
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Simple test endpoint used by the frontend health check
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend connected!' });
});

// Serve frontend asset images (development convenience).
// This exposes files from ../frontend/src/assets at /assets/* so items can reference
// /assets/<filename> URLs. In production, use a proper static host or uploads bucket.
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'src', 'assets')));

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
