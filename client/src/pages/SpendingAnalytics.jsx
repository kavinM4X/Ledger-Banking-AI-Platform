import React, { useState, useEffect } from 'react';

const CATS = ["Food", "Bills", "Shopping", "Travel", "Others"];
const CAT_COLORS = { Food: "#2F4B8C", Bills: "#B9852F", Shopping: "#3E7A56", Travel: "#B23B3B", Others: "#8891A6", Salary: "#3E7A56" };

const SpendingAnalytics = () => {
  const [data, setData] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefText, setBriefText] = useState(null);
  const customerId = localStorage.getItem('customerId');

  useEffect(() => {
    fetch(`http://localhost:5000/api/transactions/${customerId}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData);
        }
      });
  }, [customerId]);

  const generateBrief = async () => {
    if (!data) return;
    setBriefLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/analytics/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const result = await res.json();
      if (result.success) {
        setBriefText(result.data);
      } else {
        setBriefText({ error: "Failed to generate AI brief." });
      }
    } catch (e) {
      setBriefText({ error: "Error connecting to AI service." });
    }
    setBriefLoading(false);
  };

  if (!data) return <div className="pagehead"><h1>Loading...</h1></div>;

  const { txns, catTotals, totalSpend, monthly } = data;

  // Donut chart logic
  let acc = 0;
  const gradientParts = CATS.map(cat => {
    const amt = catTotals[cat] || 0;
    const pct = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
    const start = acc;
    const end = acc + pct;
    acc = end;
    return `${CAT_COLORS[cat]} ${start}% ${end}%`;
  }).join(", ");

  const maxMonthly = Math.max(...monthly, 1);
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

  return (
    <>
      <div className="pagehead">
        <h1>Spending Analytics</h1>
        <p>Month: August 2026</p>
      </div>
      <div className="grid grid-2" style={{ marginBottom: '16px' }}>
        <div className="card">
          <h3>Category Distribution</h3>
          <div className="donutwrap">
            <div className="donut" style={{ background: `conic-gradient(${gradientParts})` }}></div>
            <div className="legend">
              {CATS.map(cat => {
                const amt = catTotals[cat] || 0;
                const pct = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
                return (
                  <div className="li" key={cat}>
                    <span><span className="dot" style={{ background: CAT_COLORS[cat] }}></span>{cat}</span>
                    <span className="num">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Monthly Trend</h3>
          <div className="bars">
            {monthly.map((v, i) => (
              <div className="bar" key={i}>
                <div className="fill" style={{ height: `${Math.round((v / maxMonthly) * 100)}%` }}></div>
                <div className="lbl">{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aibox" style={{ marginBottom: '16px' }}>
        <div className="tag">
          🤖 AI Monthly Spend Brief 
          {briefLoading && <span className="typing"><span></span><span></span><span></span></span>}
        </div>
        
        {briefText ? (
          briefText.error ? (
            <p style={{ color: 'var(--red)' }}>⚠️ {briefText.error}</p>
          ) : (
            <div>
              <p style={{ fontWeight: '500', marginBottom: '4px' }}>{briefText.greeting}</p>
              <p>{briefText.spending_analysis}</p>
              {briefText.anomaly_warning && (
                <p style={{ color: 'var(--red)', marginTop: '8px', fontSize: '0.9em' }}>
                  ⚠️ {briefText.anomaly_warning}
                </p>
              )}
            </div>
          )
        ) : briefLoading ? (
          <>
            <div className="skel" style={{ width: '96%' }}></div>
            <div className="skel" style={{ width: '88%' }}></div>
            <div className="skel" style={{ width: '70%' }}></div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--ink-soft)' }}>
              Generate a personalized AI-written summary of your spending patterns this month.
            </p>
            <button className="btn sm" style={{ marginTop: '10px' }} onClick={generateBrief}>
              Generate Monthly Brief
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h3>Transactions (August 2026)</h3>
        <table>
          <thead>
            <tr><th>Category</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {txns.slice(0, 10).map((t, i) => (
              <tr key={i}>
                <td>{t.category || (t.txn_type === 'CREDIT' ? 'Salary' : 'Others')}</td>
                <td className="num" style={{ color: t.txn_type === 'CREDIT' ? 'var(--green)' : 'var(--ink)' }}>
                  {t.txn_type === 'CREDIT' ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td>{new Date(t.txn_date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SpendingAnalytics;
