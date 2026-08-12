import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`https://ledger-banking-ai-platform-backend.onrender.com/api/customer/${customerId}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.customer);
        }
      });
  }, [customerId]);

  const stampClass = (p) => {
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  };

  if (!data) return <div className="pagehead"><h1>Loading...</h1></div>;

  const c = data;
  const name = c.account_title.split(' - ')[0];
  const type = c.account_title.split(' - ')[1] || 'Savings';

  return (
    <>
      <a className="backlink" onClick={() => navigate('/rm/customers')}>← Customers</a>
      <div className="pagehead" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>
            {name} 
            <span className={`stamp ${stampClass(c.priority)}`} style={{ verticalAlign: 'middle', marginLeft: '8px' }}>
              {c.priority}
            </span>
          </h1>
          <p>{c.customer_id}</p>
        </div>
      </div>
      
      <div className="grid grid-3" style={{ marginBottom: '16px' }}>
        <div className="card stat">
          <div className="label">Loan</div>
          <div className="value">{c.loanAmount ? `₹${c.loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</div>
        </div>
        <div className="card stat">
          <div className="label">Overdue</div>
          <div className="value" style={{ color: c.overdueDays > 0 ? 'var(--red)' : 'var(--ink)' }}>
            {c.overdueDays} Days
          </div>
        </div>
        <div className="card stat">
          <div className="label">Transactions</div>
          <div className="value">Active</div>
        </div>
      </div>
      
      <div className="grid grid-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <h3>Customer Information</h3>
          <div className="prow"><span className="k">Phone</span><span>{c._mock_phone}</span></div>
          <div className="prow"><span className="k">KYC</span><span>{c.kycIssue ? 'Pending' : 'Verified'}</span></div>
          <div className="prow"><span className="k">Account Type</span><span>{type}</span></div>
          <div className="prow">
            <span className="k">Balance</span>
            <span className="num">₹{c.working_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="card">
          <h3>Loan Information</h3>
          <div className="prow">
            <span className="k">Amount</span>
            <span className="num">{c.loanAmount ? `₹${c.loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</span>
          </div>
          <div className="prow"><span className="k">Due Date</span><span>—</span></div>
          <div className="prow"><span className="k">Overdue</span><span>{c.overdueDays} days</span></div>
          <div className="prow"><span className="k">Flags</span><span>{c.issues.join(", ")}</span></div>
        </div>
      </div>
      
      <button className="btn" onClick={() => navigate(`/rm/call/${c.customer_id}`)}>Generate AI Call Script</button>
    </>
  );
};

export default CustomerDetails;

