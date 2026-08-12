const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collectionsdb';



function mapCategory(narrative, txnType) {
  const text = (narrative || '').toUpperCase();
  if (txnType === 'CREDIT' && text.includes('SALARY')) return 'Salary';
  if (text.includes('FOOD') || text.includes('REST') || text.includes('DINING')) return 'Food';
  if (text.includes('BILL') || text.includes('UTIL') || text.includes('RENT') || text.includes('EMI')) return 'Bills';
  if (text.includes('PURCHASE') || text.includes('AMAZON') || text.includes('FLIPKART')) return 'Shopping';
  if (text.includes('FLIGHT') || text.includes('HOTEL') || text.includes('UBER') || text.includes('OLA') || text.includes('TRAVEL')) return 'Travel';
  if (txnType === 'CREDIT') return 'Salary'; // Default fallback for credits
  return 'Others';
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data and indexes
    await mongoose.connection.db.dropDatabase();
    console.log('Dropped existing database');

    const dataPath = path.join(__dirname, '../../data set');
    
    // Seed Customers
    const accountsData = await parseCSV(path.join(dataPath, 'accounts.csv'));
    let mockPhoneBase = 9845012233;
    const customersToInsert = accountsData.map((row) => ({
      account_id: row.account_id,
      customer_id: row.customer_id,
      category: row.category,
      currency: row.currency,
      account_title: row.account_title,
      opening_date: row.opening_date ? new Date(row.opening_date) : null,
      working_balance: parseFloat(row.working_balance) || 0,
      posting_restrict: row.posting_restrict,
      product: row.product,
      
      // Isolated Mock Fields required for UI
      _mock_phone: (mockPhoneBase++).toString(),
      _mock_savings: Math.floor(Math.random() * 20000) + 5000
    }));
    await Customer.insertMany(customersToInsert);
    console.log(`Seeded ${customersToInsert.length} Customers`);

    // Seed Loans
    const loansData = await parseCSV(path.join(dataPath, 'loans.csv'));
    const loansToInsert = loansData.map(row => ({
      loan_id: row.loan_id,
      customer_id: row.customer_id,
      product: row.product,
      currency: row.currency,
      sanctioned_amount: parseFloat(row.sanctioned_amount) || 0,
      outstanding: parseFloat(row.outstanding) || 0,
      interest_rate: parseFloat(row.interest_rate) || 0,
      tenure_months: parseInt(row.tenure_months) || 0,
      start_date: row.start_date ? new Date(row.start_date) : null,
      status: row.status,
      days_past_due: parseInt(row.days_past_due) || 0,
      collateral_value: parseFloat(row.collateral_value) || 0,
      limit_amount: parseFloat(row.limit_amount) || 0
    }));
    await Loan.insertMany(loansToInsert);
    console.log(`Seeded ${loansToInsert.length} Loans`);

    // Seed Transactions
    const txnsData = await parseCSV(path.join(dataPath, 'transactions.csv'));
    const txnsToInsert = txnsData.map(row => {
      const isSuspicious = row.is_suspicious === 'Y';
      return {
        txn_id: row.txn_id,
        account_id: row.account_id,
        customer_id: row.customer_id,
        txn_date: row.txn_date ? new Date(row.txn_date) : null,
        value_date: row.value_date ? new Date(row.value_date) : null,
        amount: parseFloat(row.amount) || 0,
        txn_type: row.txn_type,
        counterparty: row.counterparty,
        narrative: row.narrative,
        channel: row.channel,
        is_suspicious: isSuspicious,
        category: mapCategory(row.narrative, row.txn_type)
      };
    });
    await Transaction.insertMany(txnsToInsert);
    console.log(`Seeded ${txnsToInsert.length} Transactions`);


    console.log('\nSeed process completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
