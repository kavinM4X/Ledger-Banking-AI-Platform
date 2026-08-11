const express = require('express');
const router = express.Router();
const { 
  getCustomerAndLoan, generateScript,
  getTransactions, getSpendBrief,
  askFAQ,
  getRMDashboard, getMorningBrief
} = require('../controllers/mainController');

// F1 & General Customer
router.get('/customer/:customerId', getCustomerAndLoan);
router.post('/collections/generate', generateScript);

// F2
router.get('/transactions/:customerId', getTransactions);
router.post('/analytics/brief', getSpendBrief);

// F3
router.post('/ai/faq', askFAQ);

// F4
router.get('/dashboard/rm', getRMDashboard);
router.post('/dashboard/rm/brief', getMorningBrief);

module.exports = router;
