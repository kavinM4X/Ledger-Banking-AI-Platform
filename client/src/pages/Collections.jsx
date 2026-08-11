import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Collections = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/dashboard/rm`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData);
        }
      });
  }, []);

  if (!data) return <div className="pagehead"><h1>Loading...</h1></div>;

  const high = data.allCustomers.filter(c => c.priority === "HIGH");
  const med = data.allCustomers.filter(c => c.priority === "MEDIUM");
  const low = data.allCustomers.filter(c => c.priority === "LOW");
  
  const overdueOnly = data.allCustomers
    .filter(c => c.overdueDays > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays);

  return (
    <>
      <div className="pagehead">
        <h1>Collections</h1>
        <p>Manage overdue accounts and collection activity.</p>
      </div>
      <div className="badgebar">
        <div className="b" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
          🔴 High Priority: {high.length}
        </div>
        <div className="b" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
          🟡 Medium: {med.length}
        </div>
        <div className="b" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
          🟢 Low: {low.length}
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Customer</th><th>Overdue</th><th>Amount</th><th>Action</th></tr>
          </thead>
          <tbody>
            {overdueOnly.map(c => (
              <tr key={c._id}>
                <td><b>{c.account_title.split(' - ')[0]}</b></td>
                <td>{c.overdueDays} days</td>
                <td className="num">₹{c.loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>
                  <button className="btn sm" onClick={() => navigate(`/rm/call/${c.customer_id}`)}>
                    Call
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

export default Collections;
