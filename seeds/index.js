const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user');
const { connectToDatabase } = require('../utils/dbUtils');

const seedAdminUser = async () => {
  try {
    await connectToDatabase();

    const existingAdmin = await User.findOne({ role: 'admin', uname: 'admin' });

    if (!existingAdmin) {
      const adminData = {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin',
        uname: 'admin',
        role: 'admin',
        contact: '0123456789',
        profileimage: '/uploads/noimage.jpg'
      };

      const adminUser = new User(adminData);
      await User.createUser(adminUser);

      console.log('Admin user seeded successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdminUser();
