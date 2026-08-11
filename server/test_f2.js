require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { getSpendBrief } = require('./controllers/mainController');

async function testF2() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (let i = 0; i < 5; i++) {
    const req = { body: { customerId: '100100' } };
    const res = {
      json: function(data) {
        console.log(`Result ${i}:`, data.success);
      },
      status: function(code) {
        console.log(`Status ${i}:`, code);
        return this;
      }
    };
    await getSpendBrief(req, res);
    await new Promise(r => setTimeout(r, 1000));
  }
  process.exit(0);
}

testF2();
