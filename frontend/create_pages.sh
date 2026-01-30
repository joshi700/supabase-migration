#!/bin/bash

echo "Creating page components..."

# Login Page
cat > src/pages/Login.js << 'EOFJS'
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      onLogin(token, user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🏠 Real Estate Portal</h1>
          <p>Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@realestate.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials">
          <p>Demo Credentials:</p>
          <p>Email: admin@realestate.com</p>
          <p>Password: AdminPass123!</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
EOFJS

# Dashboard Page
cat > src/pages/Dashboard.js << 'EOFJS'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    processingLeads: 0,
    closedLeads: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const leads = response.data;
      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.Status === 'New').length,
        processingLeads: leads.filter(l => l.Status === 'Processing').length,
        closedLeads: leads.filter(l => l.Status === 'Closed').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.totalLeads}</h3>
              <p>Total Leads</p>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">✨</div>
            <div className="stat-info">
              <h3>{stats.newLeads}</h3>
              <p>New Leads</p>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">⚙️</div>
            <div className="stat-info">
              <h3>{stats.processingLeads}</h3>
              <p>Processing</p>
            </div>
          </div>

          <div className="stat-card gray">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.closedLeads}</h3>
              <p>Closed</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/upload" className="action-card">
              <span className="action-icon">📤</span>
              <h3>Upload Leads</h3>
              <p>Import leads from Excel file</p>
            </Link>

            <Link to="/leads" className="action-card">
              <span className="action-icon">📋</span>
              <h3>View All Leads</h3>
              <p>Manage and track all leads</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
EOFJS

# Upload Leads Page
cat > src/pages/UploadLeads.js << 'EOFJS'
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/UploadLeads.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function UploadLeads({ user, onLogout }) {
  const [file, setFile] = useState(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        setFile(null);
      } else if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Please select an Excel file (.xlsx or .xls)');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clearExisting', clearExisting);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/upload/excel`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(`✅ Success! Uploaded ${response.data.count} leads.`);
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="upload-content">
        <div className="upload-header">
          <h1>Upload Leads</h1>
          <p>Import leads from an Excel file</p>
        </div>

        <div className="upload-box">
          <div className="upload-section">
            <h2>📤 Select Excel File</h2>
            
            <div className="file-input-wrapper">
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label htmlFor="file-input" className="file-label">
                {file ? file.name : 'Choose Excel File'}
              </label>
            </div>

            <div className="checkbox-wrapper">
              <label>
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  disabled={uploading}
                />
                Clear existing leads before upload
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Upload Leads'}
            </button>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="upload-info">
            <h3>📋 Excel File Requirements</h3>
            <ul>
              <li>File format: .xlsx or .xls</li>
              <li>Maximum size: 50MB</li>
              <li>Required columns:
                <ul>
                  <li>Lead ID</li>
                  <li>Broker Email</li>
                  <li>Client Name</li>
                  <li>Property Address</li>
                  <li>Status</li>
                </ul>
              </li>
              <li>Optional: Expected/Actual dates for milestones</li>
            </ul>

            <div className="sample-link">
              <p>📥 <a href="/sample_leads_template.xlsx" download>Download Sample Template</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadLeads;
EOFJS

echo "✓ Page components created"

