const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const FAQ = require('../models/FAQ');
const { generateEmbedding } = require('../services/embeddingService');
const { addFaqDocuments } = require('../services/chromaService');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collectionsdb';

// Hardcoded FAQs from HTML mockup for F3 RAG ingestion
const FAQS = [
  {title:"Personal Loan Documents", keys:["loan","document","documents","apply","personal"],
   body:"To apply for a personal loan, customers need identity proof (Aadhaar or PAN), address proof (utility bill or passport), and income proof — the latest 3 months' salary slips for salaried applicants or ITR for self-employed applicants."},
  {title:"Loan Prepayment & Foreclosure", keys:["prepay","foreclosure","close","early","prepayment"],
   body:"Loans can be foreclosed any time after 6 EMIs. A prepayment charge of 2% on the outstanding principal applies for fixed-rate loans; floating-rate personal loans carry no prepayment penalty."},
  {title:"Credit Card Eligibility", keys:["credit","card","eligibility","apply","income"],
   body:"Credit card eligibility requires a minimum monthly income of ₹25,000, an existing relationship of 6+ months, and a credit score above 700. Pre-approved offers are available for salary account holders."},
  {title:"KYC Update Process", keys:["kyc","update","verification","documents","re-kyc"],
   body:"KYC can be updated via the mobile app under Profile > KYC Update, by uploading a photo ID and address proof, or by visiting any branch with original documents for in-person verification."},
  {title:"Fixed Deposit Interest Rates", keys:["fd","fixed","deposit","interest","rate"],
   body:"Fixed deposits currently offer 6.5% p.a. for tenures of 1–3 years and 7.1% p.a. for senior citizens on the same tenure, with premature withdrawal subject to a 1% rate reduction."},
  {title:"Loan Overdue Penalty", keys:["overdue","penalty","late","fee","missed"],
   body:"A late payment fee of 2% on the overdue EMI amount is charged after a 3-day grace period, along with additional interest accrual on the outstanding balance until payment is received."},
  {title:"Account Statement Download", keys:["statement","download","passbook","history"],
   body:"Account statements can be downloaded as PDF or CSV from the app under Accounts > Statements, for any date range up to the last 3 years, and are also emailed monthly by default."}
];

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

    // Seed FAQs (F3 Ingestion Pipeline)
    console.log('Generating embeddings for FAQs...');
    const createdFaqs = [];
    for (const faq of FAQS) {
      const textToEmbed = `${faq.title} - ${faq.body}`;
      const embedding = await generateEmbedding(textToEmbed);
      const created = await FAQ.create({
        title: faq.title,
        keys: faq.keys,
        body: faq.body,
        embedding: embedding
      });
      createdFaqs.push(created);
    }
    console.log(`Seeded ${FAQS.length} FAQs to MongoDB.`);
    
    // Ingest into ChromaDB
    try {
      await addFaqDocuments(createdFaqs);
      console.log(`Successfully ingested FAQs into ChromaDB.`);
    } catch (chromaErr) {
      console.error(`Failed to ingest FAQs into ChromaDB. Is it running?`, chromaErr.message);
    }

    console.log('\nSeed process completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
