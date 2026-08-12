import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CallScript = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptData, setScriptData] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    // Fetch customer and loan
    fetch(`https://ledger-banking-ai-platform-backend.onrender.com/api/customer/${customerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomer(data.customer);
          setLoans(data.loans);
          if (data.loans && data.loans.length > 0) {
            generateScript(data.customer, data.loans[0]);
          }
        }
      });
  }, [customerId]);

  const generateScript = async (cust, ln, force = false) => {
    if (scriptData && !force) return;
    setScriptLoading(true);
    setApiError(null);
    if (force) setScriptData(null);
    
    try {
      const res = await fetch(`https://ledger-banking-ai-platform-backend.onrender.com/api/collections/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: cust.customer_id, loanId: ln.loan_id })
      });
      const result = await res.json();
      if (result.success) {
        setScriptData(result.data); // data has: priority, reason, call_script, recommended_action
      } else {
        setApiError(result.error || "Unable to generate a valid collection response.");
      }
    } catch (e) {
      setApiError("Service unavailable. Please try again.");
    }
    setScriptLoading(false);
  };

  const formattedScript = scriptData && scriptData.call_script 
    ? `Greeting:\n${scriptData.call_script.greeting}\n\nReason for Call:\n${scriptData.call_script.reason_for_call}\n\nCurrent Status:\n${scriptData.call_script.current_status}\n\nRequest:\n${scriptData.call_script.request}\n\nNext Step:\n${scriptData.call_script.next_step}` 
    : '';

  const copyScript = () => {
    if (formattedScript) {
      navigator.clipboard.writeText(formattedScript);
    }
  };

  const stampClass = (p) => {
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  };

  if (!customer) return <div className="pagehead"><h1>Loading...</h1></div>;

  return (
    <>
      <a className="backlink" onClick={() => navigate('/rm/collections')}>← Collections</a>
      <div className="pagehead">
        <h1>AI Collection Assistant</h1>
      </div>
      
      <div className="grid grid-3" style={{ marginBottom: '16px' }}>
        <div className="card stat">
          <div className="label">Customer</div>
          <div className="value" style={{ fontSize: '18px' }}>{customer.account_title.split(' - ')[0]}</div>
        </div>
        <div className="card stat">
          <div className="label">Overdue</div>
          <div className="value">{customer.overdueDays} Days</div>
        </div>
        <div className="card stat">
          <div className="label">Outstanding</div>
          <div className="value">₹{customer.loanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {apiError && (
        <div style={{ padding: '16px', background: 'var(--red-soft)', color: 'var(--red)', borderRadius: '8px', marginBottom: '16px', fontWeight: 500 }}>
          ⚠️ {apiError}
        </div>
      )}
      
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3>🤖 Generated Call Script</h3>
        {scriptData ? (
          <textarea className="scriptbox" readOnly value={formattedScript} style={{ height: '300px' }} />
        ) : (
          !apiError && (
            <>
              <div className="skel" style={{ width: '96%' }}></div>
              <div className="skel" style={{ width: '90%' }}></div>
              <div className="skel" style={{ width: '80%' }}></div>
              <div className="skel" style={{ width: '60%' }}></div>
            </>
          )
        )}
        <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
          <button className="btn ghost sm" onClick={copyScript} disabled={!scriptData}>Copy Script</button>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3>AI Recommended Action</h3>
        {scriptData ? (
          <>
            <div style={{ marginBottom: '12px' }}>
              <span className={`stamp ${stampClass(scriptData.priority)}`}>{scriptData.priority} PRIORITY</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Reason:</strong>
              <p style={{ fontSize: '13.5px', lineHeight: '1.6', margin: '4px 0 12px 0' }}>{scriptData.reason}</p>
            </div>
            <div>
              <strong>Action:</strong>
              <p style={{ fontSize: '13.5px', lineHeight: '1.6', margin: '4px 0 0 0' }}>{scriptData.recommended_action}</p>
            </div>
          </>
        ) : (
          !apiError && <div className="skel" style={{ width: '70%' }}></div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn ghost" onClick={() => generateScript(customer, loans[0], true)}>Regenerate</button>
        <button className="btn" onClick={() => navigate('/rm/collections')}>Mark as Contacted</button>
      </div>
    </>
  );
};

export default CallScript;

