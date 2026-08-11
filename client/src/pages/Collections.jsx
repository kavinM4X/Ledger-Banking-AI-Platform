import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Collections = () => {
  const [data, setData] = useState(null);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const stampClass = (p) => {
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  };

  const high = data.allCustomers.filter(c => c.priority === "HIGH");
  const med = data.allCustomers.filter(c => c.priority === "MEDIUM");
  const low = data.allCustomers.filter(c => c.priority === "LOW");
  
  let overdueOnly = data.allCustomers
    .filter(c => c.overdueDays > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays);

  if (filterPriority !== 'ALL') {
    overdueOnly = overdueOnly.filter(c => c.priority === filterPriority);
  }

  const totalPages = Math.ceil(overdueOnly.length / itemsPerPage);
  const paginatedData = overdueOnly.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleFilter = (priority) => {
    if (filterPriority === priority) {
      setFilterPriority('ALL');
    } else {
      setFilterPriority(priority);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  return (
    <>
      <div className="pagehead">
        <h1>Collections</h1>
        <p>Manage overdue accounts and collection activity.</p>
      </div>
      <div className="badgebar">
        <div 
          className="b" 
          style={{ 
            background: filterPriority === 'HIGH' ? 'var(--red)' : 'var(--red-soft)', 
            color: filterPriority === 'HIGH' ? '#fff' : 'var(--red)',
            cursor: 'pointer',
            border: filterPriority === 'HIGH' ? '2px solid var(--red)' : '2px solid transparent'
          }}
          onClick={() => toggleFilter('HIGH')}
        >
          🔴 High Priority: {high.length}
        </div>
        <div 
          className="b" 
          style={{ 
            background: filterPriority === 'MEDIUM' ? 'var(--amber)' : 'var(--amber-soft)', 
            color: filterPriority === 'MEDIUM' ? '#fff' : 'var(--amber)',
            cursor: 'pointer',
            border: filterPriority === 'MEDIUM' ? '2px solid var(--amber)' : '2px solid transparent'
          }}
          onClick={() => toggleFilter('MEDIUM')}
        >
          🟡 Medium: {med.length}
        </div>
        <div 
          className="b" 
          style={{ 
            background: filterPriority === 'LOW' ? 'var(--green)' : 'var(--green-soft)', 
            color: filterPriority === 'LOW' ? '#fff' : 'var(--green)',
            cursor: 'pointer',
            border: filterPriority === 'LOW' ? '2px solid var(--green)' : '2px solid transparent'
          }}
          onClick={() => toggleFilter('LOW')}
        >
          🟢 Low: {low.length}
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Customer</th><th>Overdue</th><th>Amount</th><th>Priority</th><th>Action</th></tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--ink-soft)' }}>No customers match the filter.</td></tr>
            ) : (
              paginatedData.map(c => (
                <tr key={c._id}>
                  <td><b>{c.account_title.split(' - ')[0]}</b></td>
                  <td>{c.overdueDays} days</td>
                  <td className="num">₹{c.loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><span className={`stamp ${stampClass(c.priority)}`}>{c.priority}</span></td>
                  <td>
                    <button className="btn sm" onClick={() => navigate(`/rm/call/${c.customer_id}`)}>
                      Call
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {overdueOnly.length > itemsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderTop: '1px solid var(--border)' }}>
            <button 
              className="btn ghost sm" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', color: 'var(--ink-soft)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn ghost sm" 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Collections;
