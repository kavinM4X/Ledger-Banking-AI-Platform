const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // customer_id or rm_id
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'rm'], default: 'customer' }
});

module.exports = mongoose.model('User', userSchema);
