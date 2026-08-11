import React from 'react';

const Settings = () => {
  const role = localStorage.getItem('role');
  const isRM = role === 'rm';

  return (
    <>
      <div className="pagehead">
        <h1>Profile & Settings</h1>
      </div>
      <div className="card profilewrap">
        <div className="prow">
          <span className="k">Name</span>
          <span>{isRM ? 'Kavin S (RM)' : 'Rajesh Sharma'}</span>
        </div>
        <div className="prow">
          <span className="k">Email</span>
          <span>{isRM ? 'rm.kavin@ledger.bank' : 'rajesh.sharma@ledger.bank'}</span>
        </div>
        <div className="prow">
          <span className="k">Phone</span>
          <span>98450 12233</span>
        </div>
        <div className="prow">
          <span className="k">Role</span>
          <span>{isRM ? 'Relationship Manager' : 'Customer'}</span>
        </div>
        <div className="prow" style={{ borderBottom: 'none' }}>
          <span className="k">Password</span>
          <span><button className="btn ghost sm">Change Password</button></span>
        </div>
      </div>
    </>
  );
};

export default Settings;
