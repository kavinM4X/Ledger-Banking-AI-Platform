const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loan_id: { type: String, required: true },
  customer_id: { type: String, required: true },
  product: { type: String },
  currency: { type: String },
  sanctioned_amount: { type: Number },
  outstanding: { type: Number },
  interest_rate: { type: Number },
  tenure_months: { type: Number },
  start_date: { type: Date },
  status: { type: String },
  days_past_due: { type: Number },
  collateral_value: { type: Number },
  limit_amount: { type: Number }
});

module.exports = mongoose.model('Loan', loanSchema);
