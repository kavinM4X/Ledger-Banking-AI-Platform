import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState(null);
  const navigate = useNavigate();
  const customerId = localStorage.getItem('customerId');

  useEffect(() => {
    fetch(`http://localhost:5000/api/customer/${customerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomer(data.customer);
        }
      });
  }, [customerId]);

  if (!customer) return <div className="pagehead"><h1>Loading...</h1></div>;

  return (
    <>
      <div className="pagehead">
        <h1>Welcome, {customer.account_title.split(' - ')[0]}</h1>
        <p>Here is your financial overview.</p>
      </div>
      <div className="grid grid-3" style={{ marginBottom: '16px' }}>
        <div className="card stat">
          <div className="label">Total Balance</div>
          <div className="value">₹{customer.working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="delta">↑ 2.4% this month</div>
        </div>
        <div className="card stat">
          <div className="label">Savings Goal</div>
          <div className="value">₹{customer._mock_savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="delta">On track</div>
        </div>
        <div className="card stat">
          <div className="label">Credit Score</div>
          <div className="value">782</div>
          <div className="delta">Excellent</div>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <h3>Recent Transactions</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)' }}>
            See your latest spend patterns and AI categorizations.
          </p>
          <button className="btn" onClick={() => navigate('/customer/analytics')}>View Spending Analytics</button>
        </div>
        <div className="card">
          <h3>Need help?</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)' }}>
            Chat with Ledger's Product FAQ Assistant for instant answers about our services.
          </p>
          <button className="btn ghost" onClick={() => navigate('/customer/faq')}>Ask AI Assistant</button>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
