#!/bin/bash

echo "Creating LeadsList and components..."

# LeadsList Page
cat > src/pages/LeadsList.js << 'EOFJS'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/LeadsList.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function LeadsList({ user, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, statusFilter, leads]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(lead => lead.Status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead['Client Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead['Lead ID']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead['Property Address']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead['Broker Email']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeads(filtered);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'New': 'status-new',
      'Processing': 'status-processing',
      'Inspection': 'status-inspection',
      'Appraisal': 'status-appraisal',
      'Clear to Close': 'status-clear',
      'Closing': 'status-closing',
      'Closed': 'status-closed',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  };

  return (
    <div className="leads-page">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="leads-content">
        <div className="leads-header">
          <h1>All Leads</h1>
          <p>{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} found</p>
        </div>

        <div className="leads-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Processing">Processing</option>
              <option value="Inspection">Inspection</option>
              <option value="Appraisal">Appraisal</option>
              <option value="Clear to Close">Clear to Close</option>
              <option value="Closing">Closing</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button onClick={fetchLeads} className="refresh-button">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">
            <p>No leads found matching your criteria</p>
          </div>
        ) : (
          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Client Name</th>
                  <th>Broker</th>
                  <th>Property Address</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="lead-id">{lead['Lead ID']}</td>
                    <td className="client-name">{lead['Client Name']}</td>
                    <td className="broker-email">{lead['Broker Email']}</td>
                    <td className="property-address">{lead['Property Address']}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(lead.Status)}`}>
                        {lead.Status}
                      </span>
                    </td>
                    <td className="last-updated">
                      {new Date(lead['Last Updated']).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadsList;
EOFJS

# Navbar Component
cat > src/components/Navbar.js << 'EOFJS'
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
        <Link to="/upload" className={isActive('/upload')}>
          Upload Leads
        </Link>
        <Link to="/leads" className={isActive('/leads')}>
          All Leads
        </Link>
      </div>

      <div className="navbar-user">
        <span className="user-name">{user?.name}</span>
        <span className="user-role">({user?.role})</span>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
EOFJS

echo "✓ LeadsList and components created"

