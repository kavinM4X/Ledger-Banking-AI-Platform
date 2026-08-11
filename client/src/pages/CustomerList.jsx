import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerList = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Reusing the RM dashboard endpoint to fetch all customers since it has the enriched logic
    fetch(`http://localhost:5000/api/dashboard/rm`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.allCustomers);
        }
      });
  }, []);

  const stampClass = (p) => {
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  };

  if (!data) return <div className="pagehead"><h1>Loading...</h1></div>;

  return (
    <>
      <div className="pagehead">
        <h1>Customers</h1>
        <p>Search and manage your customer book.</p>
      </div>
      
      <div className="searchrow">
        <input type="text" placeholder="🔍 Search customer..." />
        <select>
          <option>All Priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>
      
      <div className="card">
        <table>
          <thead>
            <tr><th>Customer</th><th>Status</th><th>Loan</th><th>Priority</th></tr>
          </thead>
          <tbody>
            {data.map(c => (
              <tr key={c._id} className="rowlink" onClick={() => navigate(`/rm/customer/${c.customer_id}`)}>
                <td>
                  <b>{c.account_title.split(' - ')[0]}</b>
                  <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>{c.customer_id}</div>
                </td>
                <td>{c.kycIssue ? 'KYC Pending' : 'Active'}</td>
                <td className="num">
                  {c.loanAmount > 0 ? `₹${c.loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                </td>
                <td><span className={`stamp ${stampClass(c.priority)}`}>{c.priority}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CustomerList;
