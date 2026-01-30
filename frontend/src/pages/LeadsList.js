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
                  <tr key={lead.id}>
                    <td className="lead-id">{lead.lead_id}</td>
                    <td className="client-name">{lead.client_name}</td>
                    <td className="broker-email">{lead.broker_email}</td>
                    <td className="property-address">{lead.property_address}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="last-updated">
                      {new Date(lead.last_updated).toLocaleDateString()}
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