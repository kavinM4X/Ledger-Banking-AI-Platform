import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RMDashboard = () => {
  const [data, setData] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefText, setBriefText] = useState(null);
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [rmResponse, setRmResponse] = useState('');

  const loadDashboard = () => {
    fetch(`http://localhost:5000/api/dashboard/rm`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setData(resData);
      });
  };

  const loadTickets = () => {
    fetch(`http://localhost:5000/api/tickets`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setTickets(resData.tickets);
      });
  };

  useEffect(() => {
    loadDashboard();
    loadTickets();
  }, []);

  const handleStartReview = async (ticketId) => {
    try {
      await fetch(`http://localhost:5000/api/tickets/${ticketId}/status`, {
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
      await fetch(`http://localhost:5000/api/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rmResponse })
      });
      setRmResponse('');
      setActiveTicket(null);
      loadTickets();
    } catch(e) {}
  };

  const generateBrief = async () => {
    if (!data || !data.top5) return;
    setBriefLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/dashboard/rm/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top5: data.top5 })
      });
      const result = await res.json();
      if (result.success) {
        setBriefText(result.data);
      } else {
        setBriefText("Failed to generate AI brief.");
      }
    } catch (e) {
      setBriefText("Error connecting to AI service.");
    }
    setBriefLoading(false);
  };

  const stampClass = (p) => {
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  };

  if (!data) return <div className="pagehead"><h1>Loading...</h1></div>;

  const { allCustomers, top5 } = data;
  const overdueCount = allCustomers.filter(c => c.overdueDays > 0).length;
  const kycCount = allCustomers.filter(c => c.kycIssue).length;
  const alerts = allCustomers.filter(c => c.suspicious).length;

  return (
    <>
      <div className="pagehead">
        <h1>Good Morning, RM 👋</h1>
        <p>Here's your AI-generated morning brief.</p>
      </div>
      
      <div className="grid grid-4" style={{ marginBottom: '18px' }}>
        <div className="card stat">
          <div className="label">Customers</div>
          <div className="value">{allCustomers.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Overdue</div>
          <div className="value" style={{ color: 'var(--red)' }}>{overdueCount}</div>
        </div>
        <div className="card stat">
          <div className="label">KYC Issues</div>
          <div className="value" style={{ color: 'var(--amber)' }}>{kycCount}</div>
        </div>
        <div className="card stat">
          <div className="label">Alerts</div>
          <div className="value" style={{ color: 'var(--accent)' }}>{alerts}</div>
        </div>
      </div>
      
      <div className="aibox" style={{ marginBottom: '18px' }}>
        <div className="tag">
          🤖 AI Morning Brief 
          {briefLoading && <span className="typing"><span></span><span></span><span></span></span>}
        </div>
        
        {briefText ? (
          <p>{briefText}</p>
        ) : briefLoading ? (
          <>
            <div className="skel" style={{ width: '96%' }}></div>
            <div className="skel" style={{ width: '88%' }}></div>
            <div className="skel" style={{ width: '70%' }}></div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--ink-soft)' }}>
              Generate today's AI-written priority summary for your book of customers.
            </p>
            <button className="btn sm" style={{ marginTop: '10px' }} onClick={generateBrief}>
              Generate Morning Brief
            </button>
          </>
        )}
      </div>

      <div className="card" style={{ marginBottom: '18px' }}>
        <h3>Customer Escalation Tickets</h3>
        {tickets.filter(t => t.status !== 'RESOLVED').length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No pending tickets.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {tickets.filter(t => t.status !== 'RESOLVED').map(t => (
              <div key={t.ticketId} style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{t.ticketId} (Customer: {t.customerId})</strong>
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
        <h3>🔥 Top 5 Customers Requiring Attention</h3>
        <table>
          <thead>
            <tr><th>Customer</th><th>Issue</th><th>Priority</th><th></th></tr>
          </thead>
          <tbody>
            {top5.map(c => (
              <tr key={c._id} className="rowlink" onClick={() => navigate('/rm/customers')}>
                <td><b>{c.account_title.split(' - ')[0]}</b></td>
                <td>{c.issues[0]}</td>
                <td><span className={`stamp ${stampClass(c.priority)}`}>{c.priority}</span></td>
                <td>
                  <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); navigate('/rm/customers'); }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default RMDashboard;
