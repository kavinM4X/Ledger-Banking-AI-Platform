import React from 'react';

const LoanDetails = ({ customer, loans, selectedLoanId, onSelectLoan, onGenerate, generateLoading }) => {
  if (!customer || !loans || loans.length === 0) return null;

  const selectedLoan = loans.find(l => l.loan_id === selectedLoanId) || loans[0];

  return (
    <div className="card details-card glass-panel fade-in">
      <div className="details-header">
        <h2>Customer Profile</h2>
        <span className="badge neutral">{customer.category || 'Retail'}</span>
      </div>
      
      <div className="info-grid">
        <div className="info-item">
          <label>Name / Title</label>
          <p className="value">{customer.account_title}</p>
        </div>
        <div className="info-item">
          <label>Customer ID</label>
          <p className="value">{customer.customer_id}</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="details-header">
        <h2>Loan Information</h2>
        {loans.length > 1 && (
          <select 
            className="loan-select" 
            value={selectedLoanId} 
            onChange={(e) => onSelectLoan(e.target.value)}
          >
            {loans.map(l => (
              <option key={l.loan_id} value={l.loan_id}>{l.loan_id} - {l.product}</option>
            ))}
          </select>
        )}
      </div>

      <div className="info-grid mt-4">
        <div className="info-item">
          <label>Loan Type</label>
          <p className="value">{selectedLoan.product}</p>
        </div>
        <div className="info-item">
          <label>Outstanding Amount</label>
          <p className="value amount">{selectedLoan.currency} {selectedLoan.outstanding?.toLocaleString()}</p>
        </div>
        <div className="info-item">
          <label>Days Overdue</label>
          <p className={`value ${selectedLoan.days_past_due > 0 ? 'text-danger' : 'text-success'}`}>
            {selectedLoan.days_past_due} days
          </p>
        </div>
        <div className="info-item">
          <label>Status</label>
          <p className="value">{selectedLoan.status}</p>
        </div>
      </div>

      <div className="action-row">
        <button 
          onClick={() => onGenerate(customer.customer_id, selectedLoan.loan_id)} 
          disabled={generateLoading} 
          className="btn generate-btn shimmer"
        >
          {generateLoading ? 'Generating Script...' : 'Generate Call Script'}
        </button>
      </div>
    </div>
  );
};

export default LoanDetails;

