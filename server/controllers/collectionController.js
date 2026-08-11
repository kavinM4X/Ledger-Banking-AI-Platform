const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const { generateCallScript } = require('../services/llmService');

const getCustomerAndLoan = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // We try finding by customer_id or account_id depending on how it's queried.
    // The requirement says "search for customer ID/name", but we'll use customer_id.
    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    const loans = await Loan.find({ customer_id: customerId });
    
    res.json({ success: true, customer, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateScript = async (req, res) => {
  try {
    const { customerId, loanId } = req.body;
    if (!customerId || !loanId) {
      return res.status(400).json({ success: false, message: 'customerId and loanId are required' });
    }

    const customer = await Customer.findOne({ customer_id: customerId }).lean();
    const loan = await Loan.findOne({ loan_id: loanId }).lean();

    if (!customer || !loan) {
      return res.status(404).json({ success: false, message: 'Customer or Loan not found' });
    }

    // Build context object explicitly mapping only necessary data
    const context = {
      customer: {
        account_title: customer.account_title,
        category: customer.category,
        product: customer.product
      },
      loan: {
        product: loan.product,
        sanctioned_amount: loan.sanctioned_amount,
        outstanding: loan.outstanding,
        days_past_due: loan.days_past_due,
        status: loan.status,
        interest_rate: loan.interest_rate
      }
    };

    const scriptData = await generateCallScript(context);
    
    res.json({ success: true, data: scriptData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomerAndLoan, generateScript };
