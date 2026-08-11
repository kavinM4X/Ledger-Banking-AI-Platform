import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('customer'); // 'customer' or 'rm'
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('role', role);
    // Hardcoding the login ID for demo purposes based on HTML mockup
    localStorage.setItem('customerId', '100100'); 
    
    if (role === 'customer') {
      navigate('/customer/dashboard');
    } else {
      navigate('/rm/dashboard');
    }
  };

  return (
    <div className="loginwrap">
      <div className="loginbox">
        <div className="mark">Ledger</div>
        <div className="tag">Banking AI Platform</div>
        
        <form onSubmit={handleLogin}>
          <div className="roletoggle">
            <button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
              Customer
            </button>
            <button type="button" className={role === 'rm' ? 'active' : ''} onClick={() => setRole('rm')}>
              Relationship Mgr
            </button>
          </div>
          
          <div className="field">
            <label>User ID</label>
            <input type="text" defaultValue={role === 'rm' ? 'rm.kavin' : '100100'} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" defaultValue="password" />
          </div>
          <button type="submit" className="btn">Sign In</button>
        </form>
        
        <div className="loginfoot">
          Don't have an account? <a style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
