import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const Shell = ({ role, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const navItems = role === 'customer' 
    ? [
        { path: '/customer/dashboard', ic: '🏠', label: 'Dashboard' },
        { path: '/customer/analytics', ic: '📊', label: 'Spending Analytics' },
        { path: '/customer/faq', ic: '🤖', label: 'AI Assistant' },
        { path: '/customer/settings', ic: '⚙️', label: 'Settings' },
      ]
    : [
        { path: '/rm/dashboard', ic: '🏠', label: 'Morning Brief' },
        { path: '/rm/customers', ic: '👥', label: 'Customers' },
        { path: '/rm/collections', ic: '📞', label: 'Collections' },
        { path: '/rm/settings', ic: '⚙️', label: 'Settings' },
      ];

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('customerId');
    navigate('/');
  };

  return (
    <>
      <div className="ticker">
        <span>BRANCH 04 · LEDGER LIVE · {today.toUpperCase()}</span>
        <span className="dim">{role === 'customer' ? 'CUSTOMER PORTAL' : 'RM PORTAL'}</span>
      </div>
      <div className="shell">
        <div className="navbar">
          <div className="brand">
            <div className="mark">Ledger</div>
            <div className="sub">Banking AI Platform</div>
          </div>
          <div className="navgroup">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `navitem ${isActive ? 'active' : ''}`}
              >
                <span className="ic">{item.ic}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="nav-foot">
            <div className="navitem" onClick={handleLogout}>
              <span className="ic">🚪</span>Logout
            </div>
          </div>
        </div>
        <div className="main">
          {children}
        </div>
      </div>
      
      {/* Floating AI Assistant Button (Customer Only) */}
      {role === 'customer' && location.pathname !== '/customer/faq' && (
        <div 
          onClick={() => navigate('/customer/faq')}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: 'var(--accent)',
            color: '#fff',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 8px 24px rgba(47,75,140,0.35)',
            cursor: 'pointer',
            zIndex: 900,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Ask AI Assistant"
        >
          🤖
        </div>
      )}
    </>
  );
};

export default Shell;
