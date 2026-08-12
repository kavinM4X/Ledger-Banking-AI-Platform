const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');

exports.createTicket = async (req, res) => {
  try {
    let { customerId, question } = req.body;
    
    // Default to 'C001' if null or undefined
    if (!customerId) customerId = 'C001';
    
    // Generate a simple unique ID
    const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const ticket = new Ticket({
      ticketId,
      customerId,
      question
    });
    
    await ticket.save();
    
    res.status(201).json({
      success: true,
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

exports.getCustomerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 }).lean();
    
    const customers = await Customer.find({}, 'customer_id account_title').lean();
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.customer_id] = c.account_title.split(' - ')[0]; // Use just the name
    });

    const enrichedTickets = tickets.map(t => ({
      ...t,
      customerName: customerMap[t.customerId] || 'Unknown Customer'
    }));

    res.json({ success: true, tickets: enrichedTickets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

exports.resolveTicket = async (req, res) => {
  try {
    const { rmResponse } = req.body;
    if (!rmResponse) return res.status(400).json({ success: false, error: 'RM response is required' });
    
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { 
        status: 'RESOLVED',
        rmResponse,
        resolvedAt: new Date()
      },
      { new: true }
    );
    
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
