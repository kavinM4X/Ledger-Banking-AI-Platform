import React, { useState, useRef, useEffect } from 'react';

const FAQAssistant = () => {
  const [chat, setChat] = useState([
    { who: 'bot', text: 'Hi! I am the Ledger Product Assistant. Ask me anything about our loans, accounts, or services.', src: null }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const chatlogRef = useRef(null);

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
      const res = await fetch(`http://localhost:5001/api/ai/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        setChat(prev => [...prev, { 
          who: 'bot', 
          text: result.data.answer, 
          sources: result.data.sources || [] 
        }]);
      } else {
        setChat(prev => [...prev, { who: 'bot', text: 'Sorry, I am unable to answer right now.', sources: [] }]);
      }
    } catch (e) {
      setChat(prev => [...prev, { who: 'bot', text: 'Error connecting to AI service.', src: null }]);
    }
    
    setBusy(false);
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
      <div className="chatwrap">
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
    </>
  );
};

export default FAQAssistant;
