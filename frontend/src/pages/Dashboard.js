import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TimelineView from './TimelineView';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function BrokerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    processingLeads: 0,
    closedLeads: 0
  });
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchLeads = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const leadsData = response.data;
      setLeads(leadsData);
      
      setStats({
        totalLeads: leadsData.length,
        newLeads: leadsData.filter(l => l.status === 'New').length,
        processingLeads: leadsData.filter(l => 
          ['Processing', 'Inspection', 'Appraisal', 'Clear to Close', 'Closing'].includes(l.status)
        ).length,
        closedLeads: leadsData.filter(l => l.status === 'Closed').length
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterLeads = useCallback(() => {
    let filtered = leads;

    if (statusFilter !== 'All') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.property_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.broker_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchLeads();
    }
  }, [activeTab, fetchLeads]);

  useEffect(() => {
    filterLeads();
  }, [filterLeads]);

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
    <div className="dashboard broker-dashboard">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        {/* TAB NAVIGATION */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📈 Timeline View
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="dashboard-header">
              <h1>My Leads Dashboard</h1>
              <p>Welcome back, {user?.name}!</p>
            </div>

            {/* Stats Cards */}
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
                  <p>In Progress</p>
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

            {/* All Leads Table */}
            <div className="all-leads-section">
              <div className="section-header">
                <h2>All Leads</h2>
                <p>{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Search and Filter Controls */}
              <div className="leads-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Search by name, lead ID, or address..."
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
              </div>

              {/* Leads Table */}
              {loading ? (
                <div className="loading">Loading leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="empty-state">
                  <p>No leads found. {searchTerm || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Contact your admin to get started!'}</p>
                </div>
              ) : (
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Lead ID</th>
                        <th>Client Name</th>
                        <th>Property Address</th>
                        <th>Status</th>
                        {user?.role === 'admin' && <th>Broker</th>}
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="lead-id-cell">{lead.lead_id}</td>
                          <td className="client-name-cell">{lead.client_name}</td>
                          <td className="address-cell">{lead.property_address}</td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          {user?.role === 'admin' && (
                            <td className="broker-cell">{lead.broker_email}</td>
                          )}
                          <td className="date-cell">
                            {new Date(lead.last_updated).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <TimelineView user={user} />
        )}
      </div>
    </div>
  );
}

export default BrokerDashboard;