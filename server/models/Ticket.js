const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true, default: "C001" },
  question: { type: String, required: true },
  reason: { type: String, default: "No sufficiently relevant FAQ information found" },
  status: { type: String, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  assignedTo: { type: String, default: null },
  rmResponse: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Ticket', ticketSchema);
