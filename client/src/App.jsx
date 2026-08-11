import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Shell from './components/Shell';
import CustomerDashboard from './pages/CustomerDashboard';

import SpendingAnalytics from './pages/SpendingAnalytics';
import FAQAssistant from './pages/FAQAssistant';
import RMDashboard from './pages/RMDashboard';
import Collections from './pages/Collections';
import CallScript from './pages/CallScript';
import Register from './pages/Register';
import Settings from './pages/Settings';
import CustomerList from './pages/CustomerList';
import CustomerDetails from './pages/CustomerDetails';
import RMTickets from './pages/RMTickets';

const ProtectedRoute = ({ children, roleRequired }) => {
  const role = localStorage.getItem('role');
  if (!role) return <Navigate to="/" />;
  if (roleRequired && role !== roleRequired) return <Navigate to="/" />;
  return <Shell role={role}>{children}</Shell>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Customer Routes */}
        <Route path="/customer/dashboard" element={<ProtectedRoute roleRequired="customer"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/analytics" element={<ProtectedRoute roleRequired="customer"><SpendingAnalytics /></ProtectedRoute>} />
        <Route path="/customer/faq" element={<ProtectedRoute roleRequired="customer"><FAQAssistant /></ProtectedRoute>} />
        <Route path="/customer/settings" element={<ProtectedRoute roleRequired="customer"><Settings /></ProtectedRoute>} />

        {/* RM Routes */}
        <Route path="/rm/dashboard" element={<ProtectedRoute roleRequired="rm"><RMDashboard /></ProtectedRoute>} />
        <Route path="/rm/tickets" element={<ProtectedRoute roleRequired="rm"><RMTickets /></ProtectedRoute>} />
        <Route path="/rm/customers" element={<ProtectedRoute roleRequired="rm"><CustomerList /></ProtectedRoute>} />
        <Route path="/rm/customer/:customerId" element={<ProtectedRoute roleRequired="rm"><CustomerDetails /></ProtectedRoute>} />
        <Route path="/rm/collections" element={<ProtectedRoute roleRequired="rm"><Collections /></ProtectedRoute>} />
        <Route path="/rm/call/:customerId" element={<ProtectedRoute roleRequired="rm"><CallScript /></ProtectedRoute>} />
        <Route path="/rm/settings" element={<ProtectedRoute roleRequired="rm"><Settings /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
