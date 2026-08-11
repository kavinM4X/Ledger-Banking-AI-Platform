import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Shell = ({ role, children }) => {
  const navigate = useNavigate();
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
        <div className="sidebar">
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
          <div className="sidebar-foot">
            <div className="navitem" onClick={handleLogout}>
              <span className="ic">🚪</span>Logout
            </div>
          </div>
        </div>
        <div className="main">
          {children}
        </div>
      </div>
    </>
  );
};

export default Shell;
