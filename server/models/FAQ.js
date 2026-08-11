const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  title: { type: String, required: true },
  keys: [{ type: String }],
  body: { type: String, required: true },
  embedding: { type: [Number], required: true } // Array of floats for vector search
});

module.exports = mongoose.model('FAQ', faqSchema);
