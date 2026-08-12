import React, { useState, useRef, useEffect } from 'react';

const FAQAssistant = () => {
  const [chat, setChat] = useState([
    { who: 'bot', text: 'Hi! I am the Ledger Product Assistant. Ask me anything about our loans, accounts, or services.', src: null }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const chatlogRef = useRef(null);

  const [tickets, setTickets] = useState([]);

  const customerId = localStorage.getItem('customerId');

  const loadTickets = async () => {
    if (!customerId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tickets/customer/${customerId}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch(e) {}
  };

  useEffect(() => {
    loadTickets();
  }, [customerId]);

  useEffect(() => {
    if (chatlogRef.current) {
      chatlogRef.current.scrollTop = chatlogRef.current.scrollHeight;
    }
  }, [chat, busy]);

  const askFAQ = async (question) => {
    if (busy || !question.trim()) return;
    
    setChat(prev => [...prev, { who: 'user', text: question, src: null }]);
    setBusy(true);
    setInput('');

    try {
      const res = await fetch(`https://ledger-banking-ai-platform.onrender.com/api/ai/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        if (result.data.lowConfidence) {
          setChat(prev => [...prev, { 
            who: 'bot', 
            text: result.data.answer, 
            sources: [],
            isFallback: true,
            questionForTicket: question
          }]);
        } else {
          setChat(prev => [...prev, { 
            who: 'bot', 
            text: result.data.answer, 
            sources: result.data.sources || [] 
          }]);
        }
      } else {
        setChat(prev => [...prev, { who: 'bot', text: 'Sorry, I am unable to answer right now. Please try again.', sources: [] }]);
      }
    } catch (e) {
      setChat(prev => [...prev, { who: 'bot', text: 'Sorry, I am unable to answer right now. Please try again.', src: null }]);
    }
    
    setBusy(false);
  };

  const handleRaiseTicket = async (question, msgIndex) => {
    setBusy(true);
    try {
      const res = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, question })
      });
      const data = await res.json();
      
      if (data.success) {
        setChat(prev => {
          const newChat = [...prev];
          newChat[msgIndex].isFallback = false; // Hide buttons
          newChat.push({ 
            who: 'bot', 
            text: `Your ticket has been created successfully.\n\nTicket ID: ${data.ticket.ticketId}\n\nA Relationship Manager will review your question.` 
          });
          return newChat;
        });
        loadTickets();
      }
    } catch (e) {}
    setBusy(false);
  };

  const handleSkipTicket = (msgIndex) => {
    setChat(prev => {
      const newChat = [...prev];
      newChat[msgIndex].isFallback = false;
      newChat.push({ 
        who: 'bot', 
        text: 'No problem. You can continue asking me about our banking products and services.' 
      });
      return newChat;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') askFAQ(input);
  };

  return (
    <>
      <div className="pagehead">
        <h1>Product AI Assistant</h1>
        <p>Ask about loans, accounts, cards, deposits and more.</p>
      </div>
      <div className="grid grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
      <div className="chatwrap" style={{ margin: 0 }}>
        <div className="chatlog" ref={chatlogRef}>
          {chat.map((m, i) => (
            <div key={i} className={`msg ${m.who}`}>
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div className="src" style={{ marginTop: '5px' }}>
                  <strong>Sources:</strong>
                  <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                    {m.sources.map((src, idx) => (
                      <li key={idx}>{src.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              {m.isFallback && (
                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 10px 0' }}>Would you like to raise a ticket with a Relationship Manager?</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn sm" onClick={() => handleRaiseTicket(m.questionForTicket, i)}>Yes, Raise Ticket</button>
                    <button className="btn ghost sm" onClick={() => handleSkipTicket(i)}>No, Continue</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="msg bot">
              <span className="typing"><span></span><span></span><span></span></span>
            </div>
          )}
        </div>
        <div className="suggest">
          <button onClick={() => askFAQ('What documents are required for a personal loan?')}>Loan documents?</button>
          <button onClick={() => askFAQ('What is the FD interest rate?')}>FD rates?</button>
          <button onClick={() => askFAQ('How do I update my KYC?')}>Update KYC?</button>
          <button onClick={() => askFAQ('What happens if I miss an EMI payment?')}>Missed EMI?</button>
        </div>
        <div className="chatinput">
          <input 
            type="text" 
            placeholder="Ask about loans, accounts, cards..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn" onClick={() => askFAQ(input)} disabled={busy}>Send</button>
        </div>
      </div>
      
      <div className="ticketwrap">
        <h3 style={{ margin: '0 0 15px 0' }}>My Tickets</h3>
        {tickets.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No tickets found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {tickets.map(t => (
              <div key={t.ticketId} className="card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{t.ticketId}</strong>
                  <span className={`stamp ${t.status === 'RESOLVED' ? 'low' : 'medium'}`}>{t.status}</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}><strong>Q:</strong> {t.question}</p>
                {t.status === 'RESOLVED' && t.rmResponse && (
                  <div style={{ background: 'var(--green-light)', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>
                    <strong>RM Response:</strong>
                    <p style={{ margin: '5px 0 0 0' }}>{t.rmResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default FAQAssistant;
