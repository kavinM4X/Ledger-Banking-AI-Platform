import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('customer'); // 'customer' or 'rm'
  const [userId, setUserId] = useState('100100');
  const [password, setPassword] = useState('welcome');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Update default userId when role changes
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setUserId(newRole === 'rm' ? 'rm.kavin' : '100100');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://ledger-banking-ai-platform-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('customerId', data.user.userId);
        
        if (data.user.role === 'customer') {
          navigate('/customer/dashboard');
        } else {
          navigate('/rm/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginwrap">
      <div className="loginbox">
        <div className="mark">Ledger</div>
        <div className="tag">Banking AI Platform</div>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="roletoggle">
            <button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => handleRoleChange('customer')}>
              Customer
            </button>
            <button type="button" className={role === 'rm' ? 'active' : ''} onClick={() => handleRoleChange('rm')}>
              Relationship Mgr
            </button>
          </div>
          
          <div className="field">
            <label>User ID</label>
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="loginfoot">
          Don't have an account? <a style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</a>
        </div>
      </div>
    </div>
  );
};

export default Login;

