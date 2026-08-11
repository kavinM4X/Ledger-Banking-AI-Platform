const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txn_id: { type: String, required: true, unique: true },
  account_id: { type: String, required: true },
  customer_id: { type: String, required: true },
  txn_date: { type: Date },
  value_date: { type: Date },
  amount: { type: Number }, // Negative for DEBIT, positive for CREDIT
  txn_type: { type: String }, // 'DEBIT' | 'CREDIT'
  counterparty: { type: String },
  narrative: { type: String },
  channel: { type: String },
  is_suspicious: { type: Boolean },
  
  // Enriched field mapped via rule-based logic (not in original CSV)
  category: { type: String, enum: ["Food", "Bills", "Shopping", "Travel", "Others", "Salary"] }
});

module.exports = mongoose.model('Transaction', transactionSchema);
