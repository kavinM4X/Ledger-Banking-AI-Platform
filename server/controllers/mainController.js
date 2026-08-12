const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { generateCallScript, generateSpendBrief, generateMorningBrief } = require('../services/llmService');
// Utility to calculate priority and issues (simulate F4 logic)
function enrichCustomerWithPriority(c, loans) {
  let overdueDays = 0;
  let loanAmount = 0;
  let issues = [];

  loans.forEach(l => {
    loanAmount += l.outstanding || 0;
    if (l.days_past_due > overdueDays) overdueDays = l.days_past_due;
  });

  const kycIssue = c.posting_restrict === 'KYC';
  let priority = 'LOW';
  
  if (overdueDays > 45 || kycIssue) priority = 'HIGH';
  else if (overdueDays > 15) priority = 'MEDIUM';

  if (overdueDays > 0) issues.push(`Loan overdue: ${overdueDays} days`);
  if (kycIssue) issues.push("KYC verification required");
  if (issues.length === 0) issues.push("Account in good standing");

  return {
    ...c,
    loanAmount,
    overdueDays,
    priority,
    issues,
    kycIssue,
    suspicious: false // Mocking false for now, could be checked via txns
  };
}

// F1 & General Customer Info
const getCustomerAndLoan = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findOne({ customer_id: customerId }).lean();
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    const loans = await Loan.find({ customer_id: customerId }).lean();
    const enriched = enrichCustomerWithPriority(customer, loans);
    
    res.json({ success: true, customer: enriched, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateScript = async (req, res) => {
  try {
    const { customerId, loanId } = req.body;
    if (!customerId || !loanId) return res.status(400).json({ success: false, message: 'customerId and loanId are required' });

    const customer = await Customer.findOne({ customer_id: customerId }).lean();
    const loan = await Loan.findOne({ loan_id: loanId }).lean();
    if (!customer || !loan) return res.status(404).json({ success: false, message: 'Customer or Loan not found' });

    const enriched = enrichCustomerWithPriority(customer, [loan]);

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
        status: loan.status
      }
    };

    const scriptData = await generateCallScript(context);
    res.json({ success: true, data: scriptData });
  } catch (error) {
    res.json({ success: false, error: "Unable to generate a valid collection response." });
  }
};

// F2: Spend Analytics
const getTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const txns = await Transaction.find({ customer_id: customerId }).sort({ txn_date: -1 }).lean();
    
    // Aggregate by category and month (including Credits)
    const catTotals = { Food: 0, Bills: 0, Shopping: 0, Travel: 0, Others: 0, Salary: 0 };
    let totalSpend = 0;
    
    // Determine the most recent transaction date to anchor the 6-month chart
    let maxDate = 0;
    txns.forEach(t => { 
      if (t.txn_date && new Date(t.txn_date).getTime() > maxDate) {
        maxDate = new Date(t.txn_date).getTime(); 
      }
    });
    if (maxDate === 0) maxDate = Date.now();
    
    const maxD = new Date(maxDate);
    const m6 = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(maxD.getFullYear(), maxD.getMonth() - i, 1);
      m6.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en-US', {month: 'short'}), amount: 0 });
    }
    
    txns.forEach(t => {
      const amt = Math.abs(t.amount);
      
      let cat = t.category;
      if (!cat) cat = t.txn_type === 'CREDIT' ? 'Salary' : 'Others';
      
      // Category
      if (Object.keys(catTotals).includes(cat)) {
        catTotals[cat] += amt;
      } else {
        catTotals['Others'] += amt;
      }
      totalSpend += amt;
      
      // Month
      if (t.txn_date) {
        const d = new Date(t.txn_date);
        const match = m6.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
        if (match) match.amount += amt;
      }
    });

    const monthly = m6.map(m => m.amount);
    const monthLabels = m6.map(m => m.label);

    res.json({ success: true, txns, catTotals, totalSpend, monthly, monthLabels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTransaction = async (req, res) => {
  try {
    const { customerId, type, amount, category, description } = req.body;
    
    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const txnAmount = type === 'DEBIT' ? -Number(amount) : Number(amount);
    customer.working_balance += txnAmount;
    await customer.save();

    const txn = new Transaction({
      txn_id: 'TXN' + Math.floor(Math.random() * 10000000),
      account_id: customer.account_id,
      customer_id: customerId,
      txn_date: new Date(),
      value_date: new Date(),
      amount: txnAmount,
      txn_type: type,
      narrative: description,
      category: category,
      channel: 'WEB'
    });
    await txn.save();

    res.json({ success: true, transaction: txn });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const getSpendBrief = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: 'Missing customerId' });

    const txns = await Transaction.find({ customer_id: customerId, txn_type: 'DEBIT' }).lean();
    
    if (!txns.length) {
      return res.json({ success: true, data: { greeting: "Hello.", spending_analysis: "You have no recent debit transactions.", anomaly_warning: "" } });
    }

    let totalSpend = 0;
    const catTotals = {};
    const amounts = [];
    
    txns.forEach(t => {
      const amt = Math.abs(t.amount);
      totalSpend += amt;
      amounts.push(amt);
      const cat = t.category || 'Others';
      catTotals[cat] = (catTotals[cat] || 0) + amt;
    });

    const transactionCount = txns.length;
    const averageSpend = totalSpend / transactionCount;

    const variance = amounts.reduce((acc, val) => acc + Math.pow(val - averageSpend, 2), 0) / transactionCount;
    const stdDev = Math.sqrt(variance);
    const anomalyThreshold = averageSpend + (2 * stdDev);

    const anomalies = [];
    txns.forEach(t => {
      const amt = Math.abs(t.amount);
      if (t.is_suspicious === true || t.is_suspicious === 'Y') {
        anomalies.push(`Suspicious flag: ₹${amt} to ${t.counterparty} (${t.narrative})`);
      } else if (transactionCount > 5 && amt > anomalyThreshold && amt > 5000) {
        anomalies.push(`Unusually high spend: ₹${amt} to ${t.counterparty} (${t.narrative})`);
      }
    });

    const context = {
      totalSpend: Math.round(totalSpend),
      transactionCount,
      averageSpend: Math.round(averageSpend),
      categoryBreakdown: catTotals,
      anomalies
    };

    const brief = await generateSpendBrief(context);
    res.json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// F4: RM Dashboard
const getRMDashboard = async (req, res) => {
  try {
    const customers = await Customer.find({}).lean();
    const loans = await Loan.find({}).lean();
    const txns = await Transaction.find({ is_suspicious: true }).lean(); // Get all suspicious txns
    
    // Group suspicious by customer
    const suspiciousCustomers = new Set(txns.map(t => t.customer_id));

    const enriched = customers.map(c => {
      const cLoans = loans.filter(l => l.customer_id === c.customer_id);
      const en = enrichCustomerWithPriority(c, cLoans);
      if (suspiciousCustomers.has(c.customer_id)) {
        en.suspicious = true;
        if (en.priority !== 'HIGH') en.priority = 'MEDIUM'; // Bump priority if suspicious
      }
      return en;
    });

    const uniqueEnrichedMap = new Map();
    enriched.forEach(c => {
      if (!uniqueEnrichedMap.has(c.customer_id)) {
        uniqueEnrichedMap.set(c.customer_id, c);
      } else {
        // If we want to prioritize the most severe account representation, we could compare priorities here.
        // For now, keeping the first occurrence is fine since loans/priority are aggregated by customer_id anyway.
      }
    });
    const uniqueEnriched = Array.from(uniqueEnrichedMap.values());

    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const sorted = uniqueEnriched.sort((a, b) => order[a.priority] - order[b.priority] || b.overdueDays - a.overdueDays);
    
    const top5 = sorted.slice(0, 5);
    
    res.json({ success: true, allCustomers: sorted, top5 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMorningBrief = async (req, res) => {
  try {
    const { top5 } = req.body;
    const brief = await generateMorningBrief(top5);
    res.json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomerAndLoan,
  generateScript,
  getTransactions,
  addTransaction,
  getSpendBrief,
  getRMDashboard,
  getMorningBrief
};
