import React, { useState } from 'react';
import { Copy, RefreshCw, CheckCircle2 } from 'lucide-react';

const CallScript = ({ scriptData, onRegenerate, generateLoading }) => {
  const [copied, setCopied] = useState(false);

  if (!scriptData) return null;

  const { priority, reason, call_script, recommended_action } = scriptData;

  const getPriorityClass = (level) => {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-neutral';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(call_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card script-card glass-panel fade-in slide-up">
      <div className="script-header">
        <h2>Generated Call Script</h2>
        <span className={`badge ${getPriorityClass(priority)}`}>{priority} PRIORITY</span>
      </div>

      <div className="script-reason">
        <strong>Reason:</strong> {reason}
      </div>

      <div className="script-box">
        <p className="script-content">{call_script}</p>
        <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
          {copied ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} />}
        </button>
      </div>

      <div className="script-action">
        <strong>Recommended Next Step:</strong>
        <p>{recommended_action}</p>
      </div>

      <div className="script-footer">
        <button 
          onClick={onRegenerate} 
          disabled={generateLoading}
          className="btn outline-btn"
        >
          <RefreshCw size={16} className={generateLoading ? 'spin' : ''} />
          {generateLoading ? 'Regenerating...' : 'Regenerate Script'}
        </button>
      </div>
    </div>
  );
};

export default CallScript;

