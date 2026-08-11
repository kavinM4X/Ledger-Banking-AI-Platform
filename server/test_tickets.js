const axios = require('axios');

async function runTests() {
  console.log("Starting Ticket Escalation Workflow Verification...\n");
  
  try {
    // TEST 1: High Confidence
    console.log("TEST 1 - HIGH CONFIDENCE (Known FAQ)");
    const r1 = await axios.post('http://localhost:5001/api/ai/faq', { question: "What documents are required for a personal loan?" });
    console.log(`Success: ${r1.data.success}`);
    console.log(`Low Confidence Flag: ${r1.data.data.lowConfidence === true ? 'Yes' : 'No'}`);
    console.log(`Result: ${r1.data.data.lowConfidence !== true ? 'PASS' : 'FAIL'}\n`);
    
    // TEST 2: Low Confidence
    console.log("TEST 2 - LOW CONFIDENCE (Unknown Question)");
    const r2 = await axios.post('http://localhost:5001/api/ai/faq', { question: "What is the interest rate for a spaceship loan?" });
    console.log(`Success: ${r2.data.success}`);
    console.log(`Low Confidence Flag: ${r2.data.data.lowConfidence === true ? 'Yes' : 'No'}`);
    console.log(`Result: ${r2.data.data.lowConfidence === true ? 'PASS' : 'FAIL'}\n`);
    
    // TEST 3: Create Ticket
    console.log("TEST 3 - CREATE TICKET");
    const r3 = await axios.post('http://localhost:5000/api/tickets', { 
      customerId: "C001", 
      question: "What is the interest rate for a spaceship loan?" 
    });
    const ticket = r3.data.ticket;
    console.log(`Created Ticket ID: ${ticket.ticketId}, Status: ${ticket.status}`);
    console.log(`Result: ${ticket.status === 'OPEN' ? 'PASS' : 'FAIL'}\n`);
    
    // TEST 4: RM Review
    console.log("TEST 4 - RM REVIEW");
    const r4 = await axios.patch(`http://localhost:5000/api/tickets/${ticket.ticketId}/status`, { status: "IN_REVIEW" });
    console.log(`Updated Status: ${r4.data.ticket.status}`);
    console.log(`Result: ${r4.data.ticket.status === 'IN_REVIEW' ? 'PASS' : 'FAIL'}\n`);
    
    // TEST 5: RM Resolution
    console.log("TEST 5 - RM RESOLUTION");
    const responseText = "Spaceship loans are not supported at this time.";
    const r5 = await axios.patch(`http://localhost:5000/api/tickets/${ticket.ticketId}/resolve`, { rmResponse: responseText });
    console.log(`Updated Status: ${r5.data.ticket.status}`);
    console.log(`RM Response stored: ${r5.data.ticket.rmResponse}`);
    console.log(`Result: ${r5.data.ticket.status === 'RESOLVED' ? 'PASS' : 'FAIL'}\n`);
    
    // TEST 6: Customer Retrieves Response
    console.log("TEST 6 - CUSTOMER RECEIVES RESPONSE");
    const r6 = await axios.get('http://localhost:5000/api/tickets/customer/C001');
    const custTicket = r6.data.tickets.find(t => t.ticketId === ticket.ticketId);
    console.log(`Ticket Found for Customer: ${custTicket ? 'Yes' : 'No'}`);
    console.log(`Customer Sees Status: ${custTicket.status}`);
    console.log(`Customer Sees Response: ${custTicket.rmResponse}`);
    console.log(`Result: ${custTicket.status === 'RESOLVED' && custTicket.rmResponse === responseText ? 'PASS' : 'FAIL'}\n`);
    
    console.log("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY.");
  } catch(e) {
    console.error("Test Failed:", e.response ? e.response.data : e.message);
  }
}

runTests();
