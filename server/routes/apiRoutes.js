const express = require('express');
const router = express.Router();
const { 
  getCustomerAndLoan, generateScript,
  getTransactions, addTransaction, getSpendBrief,
  askFAQ,
  getRMDashboard, getMorningBrief
} = require('../controllers/mainController');
const {
  createTicket, getTicket, getCustomerTickets, getAllTickets, updateStatus, resolveTicket
} = require('../controllers/ticketController');

// F1 & General Customer
router.get('/customer/:customerId', getCustomerAndLoan);
router.post('/collections/generate', generateScript);

// F2
router.get('/transactions/:customerId', getTransactions);
router.post('/transactions', addTransaction);
router.post('/analytics/brief', getSpendBrief);

// F3
router.post('/ai/faq', askFAQ);

// F4
router.get('/dashboard/rm', getRMDashboard);
router.post('/dashboard/rm/brief', getMorningBrief);
// Tickets
router.post('/tickets', createTicket);
router.get('/tickets', getAllTickets);
router.get('/tickets/:ticketId', getTicket);
router.get('/tickets/customer/:customerId', getCustomerTickets);
router.patch('/tickets/:ticketId/status', updateStatus);
router.patch('/tickets/:ticketId/resolve', resolveTicket);

module.exports = router;
