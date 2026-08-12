import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RMTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [rmResponse, setRmResponse] = useState('');
  const navigate = useNavigate();

  const loadTickets = () => {
    fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/tickets`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setTickets(resData.tickets);
      });
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleStartReview = async (ticketId) => {
    try {
      await fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_REVIEW' })
      });
      loadTickets();
      setActiveTicket(ticketId);
    } catch(e) {}
  };

  const handleResolveTicket = async (ticketId) => {
    if (!rmResponse) return;
    try {
      await fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rmResponse })
      });
      setRmResponse('');
      setActiveTicket(null);
      loadTickets();
    } catch(e) {}
  };

  const pendingTickets = tickets.filter(t => t.status !== 'RESOLVED');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED');

  return (
    <>
      <div className="pagehead">
        <h1>Ticket Management</h1>
        <p>Review and resolve customer escalation tickets</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3>Pending Tickets ({pendingTickets.length})</h3>
        {pendingTickets.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No pending tickets. Great job!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingTickets.map(t => (
              <div key={t.ticketId} style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{t.ticketId} (Customer: {t.customerName})</strong>
                  <span className={`stamp ${t.status === 'IN_REVIEW' ? 'medium' : 'high'}`}>{t.status}</span>
                </div>
                <p style={{ margin: '0 0 10px 0' }}><strong>Question:</strong> {t.question}</p>
                <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'var(--ink-soft)' }}><strong>Reason:</strong> {t.reason}</p>
                
                {activeTicket !== t.ticketId ? (
                  <button className="btn sm ghost" onClick={() => handleStartReview(t.ticketId)}>Start Review</button>
                ) : (
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 10px 0' }}><strong>RM Response:</strong></p>
                    <textarea 
                      style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      placeholder="Type your resolution here..."
                      value={rmResponse}
                      onChange={(e) => setRmResponse(e.target.value)}
                    />
                    <button className="btn sm" onClick={() => handleResolveTicket(t.ticketId)}>Resolve Ticket</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Recently Resolved ({resolvedTickets.length})</h3>
        {resolvedTickets.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No recently resolved tickets.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {resolvedTickets.map(t => (
              <div key={t.ticketId} style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '8px', opacity: 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{t.ticketId}</strong>
                  <span className="stamp low">RESOLVED</span>
                </div>
                <p style={{ margin: '0 0 5px 0' }}><strong>Question:</strong> {t.question}</p>
                <p style={{ margin: '0 0 0 0', color: 'var(--success)' }}><strong>Response:</strong> {t.rmResponse}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default RMTickets;

