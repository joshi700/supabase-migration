import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">
          <h2>🏠 Real Estate Portal</h2>
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>
          Dashboard
        </Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/upload" className={isActive('/upload')}>
              Upload Leads
            </Link>
            <Link to="/users" className={isActive('/users')}>
              Manage Users
            </Link>
          </>
        )}
        <Link to="/leads" className={isActive('/leads')}>
          All Leads
        </Link>
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <span className="user-name">{user?.full_name || user?.name || 'User'}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <span className="user-role-badge">{user?.role}</span>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;