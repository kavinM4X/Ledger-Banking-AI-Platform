import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState('customer'); // 'customer' or 'rm'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please enter at least your name and email to continue.');
      return;
    }
    // Simulate successful registration by auto-logging in
    localStorage.setItem('role', role);
    localStorage.setItem('customerId', '100100'); // Mock default for demo
    
    if (role === 'customer') {
      navigate('/customer/dashboard');
    } else {
      navigate('/rm/dashboard');
    }
  };

  return (
    <div className="loginwrap">
      <div className="loginbox">
        <div className="mark">🏦 Ledger</div>
        <div className="tag">Create Your Account</div>
        
        <form onSubmit={handleRegister}>
          <div className="roletoggle">
            <button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
              Customer
            </button>
            <button type="button" className={role === 'rm' ? 'active' : ''} onClick={() => setRole('rm')}>
              Relationship Mgr
            </button>
          </div>
          
          <div className="field">
            <label>Full Name</label>
            <input type="text" placeholder="e.g. Kavin S" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="text" placeholder="you@ledger.bank" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="text" placeholder="98450 12233" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Create a password" />
          </div>
          
          {error && <div style={{ fontSize: '12.5px', color: 'var(--red)', marginBottom: '10px' }}>{error}</div>}
          
          <button type="submit" className="btn" style={{ width: '100%', padding: '11px', fontSize: '14px', marginTop: '4px' }}>
            Create Account
          </button>
        </form>
        
        <div className="loginfoot">
          Already have an account? <a style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/')}>Log in</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
