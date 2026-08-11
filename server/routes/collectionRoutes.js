const express = require('express');
const router = express.Router();
const { getCustomerAndLoan, generateScript } = require('../controllers/collectionController');

router.get('/customer/:customerId', getCustomerAndLoan);
router.post('/generate', generateScript);

module.exports = router;
