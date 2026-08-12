import React, { useState, useEffect } from 'react';

const Settings = () => {
  const role = localStorage.getItem('role');
  const customerId = localStorage.getItem('customerId');
  const isRM = role === 'rm';
  const userId = isRM ? 'rm.kavin' : customerId; // Explicitly set user ID for password change
  const [customer, setCustomer] = useState(null);
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setPasswordMsg({ text: 'Please fill both fields', type: 'error' });
      return;
    }
    setChanging(true);
    setPasswordMsg({ text: '', type: '' });
    try {
      const res = await fetch('https://ledger-banking-ai-platform-backend.onrender.com/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'rm.kavin', oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordMsg({ text: '', type: '' });
        }, 2000);
      } else {
        setPasswordMsg({ text: data.message || 'Update failed', type: 'error' });
      }
    } catch (e) {
      setPasswordMsg({ text: 'Network error', type: 'error' });
    }
    setChanging(false);
  };

  useEffect(() => {
    if (!isRM && customerId) {
      fetch(`https://ledger-banking-ai-platform-backend.onrender.com/api/customer/${customerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCustomer(data.customer);
          }
        });
    }
  }, [isRM, customerId]);

  // Extract name and generate email dynamically
  let name = isRM ? 'Kavin S (RM)' : 'Customer';
  let email = isRM ? 'rm.kavin@ledger.bank' : 'customer@ledger.bank';
  let phone = isRM ? '98450 12233' : 'N/A';

  if (customer && customer.account_title) {
    name = customer.account_title.split(' - ')[0]; // E.g., "DIVYA LEE"
    
    // Capitalize first letter of each word for nice display
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    email = name.toLowerCase().replace(' ', '.') + '@ledger.bank';
    phone = customer._mock_phone || '98450 12233';
  }

  return (
    <>
      <div className="pagehead">
        <h1>Profile & Settings</h1>
      </div>
      <div className="card profilewrap">
        <div className="prow">
          <span className="k">Name</span>
          <span>{name}</span>
        </div>
        <div className="prow">
          <span className="k">Email</span>
          <span>{email}</span>
        </div>
        <div className="prow">
          <span className="k">Phone</span>
          <span>{phone}</span>
        </div>
        <div className="prow">
          <span className="k">Role</span>
          <span>{isRM ? 'Relationship Manager' : 'Customer'}</span>
        </div>
        {isRM && (
          <div className="prow" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span className="k">Password</span>
              {!isChangingPassword && (
                <span><button className="btn ghost sm" onClick={() => setIsChangingPassword(true)}>Change Password</button></span>
              )}
            </div>
            
            {isChangingPassword && (
              <div style={{ width: '100%', marginTop: '15px', background: 'var(--surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {passwordMsg.text && (
                  <div style={{ color: passwordMsg.type === 'error' ? 'red' : 'green', marginBottom: '10px', fontSize: '13px' }}>
                    {passwordMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
                  <input 
                    type="password" 
                    placeholder="Old Password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                  <input 
                    type="password" 
                    placeholder="New Password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <button className="btn sm" onClick={handleChangePassword} disabled={changing}>
                      {changing ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn ghost sm" onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordMsg({ text: '', type: '' });
                    }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;

