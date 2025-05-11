// const fs = require('fs');
const path = require('path');
const express = require('express');
// const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

// const ordersRoutes = require('./routes/orders-route');
// const usersRoutes = require('./routes/users-route');
// const emailRoutes = require('./routes/emails-route');
// const referralRoutes = require('./routes/referral-route');
const authRoutes = require('./routes/auth-route');
const bladeRoutes  = require('./routes/blade-route');
const ratchetRoutes = require('./routes/ratchet-route');
const bitRoutes = require('./routes/bit-route');
const HttpError = require('./models/http-error');

const app = express();
const uri = process.env.REACT_APP_MONGO_SERVER;

app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE', 'OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// API routes
// app.use('/uploads/files', express.static(path.join('uploads', 'files')));
// app.use('/api/orders', ordersRoutes);
// app.use('/api/users', usersRoutes);
// app.use('/api/email', emailRoutes);
// app.use('/api/referral', referralRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/blade', bladeRoutes);
app.use('/api/ratchet', ratchetRoutes);
app.use('/api/bit', bitRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(500).json({ message: error.message || 'An unknown error occurred!' });
});

// Connect to MongoDB and start the server
mongoose
  .connect(uri)
  .then(() => app.listen(5000, () => console.log('Server running on port 5000')))
  .catch(err => console.log(err));



// Optional: Listen to Mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to the database');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from the database');
});

module.exports = app;
