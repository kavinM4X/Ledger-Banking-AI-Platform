require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const { generateScript } = require('./server/controllers/mainController');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collectionsdb';

async function runTest() {
  await mongoose.connect(mongoUri);

  const req = { body: { customerId: '100126', loanId: 'LN100126J' } };
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { console.log('Response:', JSON.stringify(data, null, 2)); }
  };

  console.log('Testing Normal Overdue Customer...');
  await generateScript(req, res);

  console.log('Testing Validation Failure (Simulated)...');
  // I can't easily force the LLM to return bad JSON here, but I can test missing context field
  const badReq = { body: { customerId: 'MISSING', loanId: 'L1000' } };
  const badRes = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { console.log('Response (Bad Context):', JSON.stringify(data, null, 2)); }
  };
  await generateScript(badReq, badRes);

  process.exit(0);
}

runTest();
