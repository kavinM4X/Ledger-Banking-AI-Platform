const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const User = require('../models/User');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collectionsdb';

async function seedAuth() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const hashedPassword = await bcrypt.hash('welcome', 10);

    // Get unique customer IDs
    const customers = await Customer.distinct('customer_id');
    console.log(`Found ${customers.length} unique customers`);

    const usersToInsert = customers.map(id => ({
      userId: id,
      password: hashedPassword,
      role: 'customer'
    }));

    // Add default RM user
    usersToInsert.push({
      userId: 'rm.kavin',
      password: hashedPassword,
      role: 'rm'
    });

    await User.insertMany(usersToInsert);
    console.log(`Successfully seeded ${usersToInsert.length} users with password "welcome".`);
    
    process.exit(0);
  } catch (error) {
    console.error('Auth seeding failed:', error);
    process.exit(1);
  }
}

seedAuth();
