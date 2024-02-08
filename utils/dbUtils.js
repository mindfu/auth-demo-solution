const mongoose = require('mongoose');
const { DB_CONNECTION_STRING } = require('../constants');

const connectToDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to the database');
      return;
    }

    await mongoose.connect(DB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };
