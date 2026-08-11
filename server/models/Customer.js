const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // CSV source fields (source of truth)
  account_id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true },
  category: { type: String },
  currency: { type: String },
  account_title: { type: String, required: true },
  opening_date: { type: Date },
  working_balance: { type: Number },
  posting_restrict: { type: String }, // e.g. "KYC" implies pending KYC
  product: { type: String },
  
  // UI ONLY MOCK FIELDS
  // These are isolated and explicitly labeled as mock/derived values not found in CSV.
  // They are strictly for rendering the reference UI and MUST NOT be used for AI/business logic.
  _mock_phone: { type: String },
  _mock_savings: { type: Number }
});

module.exports = mongoose.model('Customer', customerSchema);
