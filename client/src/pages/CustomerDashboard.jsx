import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [modalType, setModalType] = useState(null); // 'send', 'bills', 'add'
  const [modalAmount, setModalAmount] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);
  const navigate = useNavigate();
  const customerId = localStorage.getItem('customerId');

  useEffect(() => {
    fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/customer/${customerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomer(data.customer);
        }
      });
      
    // Fetch transactions for preview
    fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/transactions/${customerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.txns) {
          setTransactions(data.txns.slice(0, 3)); // Only take top 3
        }
      });
  }, [customerId]);

  if (!customer) return <div className="pagehead"><h1>Loading...</h1></div>;

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    
    let type = 'DEBIT';
    let category = 'Others';
    let description = '';

    if (modalType === 'send') {
      description = `Transfer to Account`;
    } else if (modalType === 'bills') {
      category = 'Bills';
      description = `Bill Payment`;
    } else if (modalType === 'add') {
      type = 'CREDIT';
      description = `Deposit via Card/Bank`;
    }

    try {
      await fetch('https://ledger-banking-ai-platform-1.onrender.com/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          type,
          amount: modalAmount,
          category,
          description
        })
      });

      // Refetch data to update balance and transactions
      const res = await fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/customer/${customerId}`);
      const data = await res.json();
      if (data.success) setCustomer(data.customer);

      const txnRes = await fetch(`https://ledger-banking-ai-platform-1.onrender.com/api/transactions/${customerId}`);
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        if (txnData.success && txnData.txns) {
          setTransactions(txnData.txns.slice(0, 3));
        }
      }
      
      setActionSuccess(true);
      setTimeout(() => {
        setModalType(null);
        setActionSuccess(false);
        setModalAmount('');
      }, 2000);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      {modalType && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '380px', background: 'rgba(255,255,255,0.95)', border: '1px solid #fff' }}>
            {actionSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h3 style={{ margin: '0 0 10px 0' }}>Success!</h3>
                <p style={{ color: 'var(--ink-soft)', margin: 0 }}>Your transaction was processed instantly.</p>
              </div>
            ) : (
              <form onSubmit={handleActionSubmit}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>
                    {modalType === 'send' ? '💸 Send Money' : modalType === 'bills' ? '🧾 Pay Bills' : '➕ Add Funds'}
                  </h3>
                  <button type="button" className="btn ghost sm" style={{ border: 'none' }} onClick={() => setModalType(null)}>✕</button>
                </div>
                
                {modalType === 'send' && (
                  <div className="field">
                    <label>Recipient Account Number</label>
                    <input type="text" placeholder="e.g. 123456789" required />
                  </div>
                )}
                {modalType === 'bills' && (
                  <div className="field">
                    <label>Select Biller</label>
                    <select style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: '7px', fontSize: '14px', fontFamily: 'var(--body)' }}>
                      <option>Electricity Board</option>
                      <option>Water Supply</option>
                      <option>Internet Provider</option>
                    </select>
                  </div>
                )}
                
                <div className="field" style={{ marginBottom: '24px' }}>
                  <label>Amount (₹)</label>
                  <input type="number" placeholder="0.00" value={modalAmount} onChange={e => setModalAmount(e.target.value)} required />
                </div>
                
                <button type="submit" className="btn" style={{ width: '100%' }}>Confirm Transaction</button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="pagehead">
        <h1 style={{ background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Welcome, {customer.account_title.split(' - ')[0]}
        </h1>
        <p>Here is your financial overview.</p>
      </div>
      
      <div className="grid grid-3" style={{ marginBottom: '22px' }}>
        <div className="glass-card stat">
          <div className="label">Total Balance</div>
          <div className="value">₹{customer.working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="delta">↑ 2.4% this month</div>
        </div>
        <div className="glass-card stat">
          <div className="label">Savings Goal</div>
          <div className="value">₹{customer._mock_savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="delta">On track</div>
        </div>
        <div className="glass-card stat">
          <div className="label">Credit Score</div>
          <div className="value">782</div>
          <div className="delta">Excellent</div>
        </div>
      </div>

      {/* Quick Action Carousel */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '22px' }}>
        <button className="btn" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center', boxShadow: '0 4px 12px rgba(47,75,140,0.2)' }} onClick={() => setModalType('send')}>
          <span>💸</span> Send Money
        </button>
        <button className="btn ghost" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center', background: '#fff' }} onClick={() => setModalType('bills')}>
          <span>🧾</span> Pay Bills
        </button>
        <button className="btn ghost" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center', background: '#fff' }} onClick={() => setModalType('add')}>
          <span>➕</span> Add Funds
        </button>
      </div>
      <div className="grid grid-2">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Recent Transactions</h3>
            <span style={{ fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/customer/analytics')}>
              View Analytics →
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>No recent transactions.</p>
            ) : (
              transactions.map(t => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      {t.category === 'Food & Dining' ? '🍔' : t.category === 'Shopping' ? '🛒' : t.category === 'Travel' ? '✈️' : '💳'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{t.narrative}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{t.txn_date ? t.txn_date.substring(0, 10) : ''} • {t.category}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'var(--mono)', color: t.type === 'CREDIT' ? 'var(--green)' : 'var(--ink)' }}>
                    {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>Need help?</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: '1.6' }}>
              Chat with the Ledger AI Assistant to instantly get answers about our products, check loan terms, or raise a ticket directly to your Relationship Manager.
            </p>
          </div>
          <button className="btn" style={{ alignSelf: 'flex-start', marginTop: '16px' }} onClick={() => navigate('/customer/faq')}>
            💬 Ask AI Assistant
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;

