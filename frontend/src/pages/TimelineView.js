import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimelineCard from '../components/TimelineCard';
import TimelineDetailModal from '../components/TimelineDetailModal';
import '../styles/TimelineView.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function TimelineView({ user }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, onTrack: 0, warning: 0, critical: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use /api/leads - the correct endpoint that works for both admin and broker
      const response = await axios.get(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData) => {
    // Calculate timeline statistics based on leads data
    // This is a simplified version - you can enhance this logic
    const stats = {
      total: leadsData.length,
      onTrack: 0,
      warning: 0,
      critical: 0,
      overdue: 0
    };

    leadsData.forEach(lead => {
      // Simple status-based categorization
      // You can enhance this with actual date comparisons
      if (lead.status === 'New' || lead.status === 'Processing') {
        stats.onTrack++;
      } else if (lead.status === 'Inspection' || lead.status === 'Appraisal') {
        stats.warning++;
      } else if (lead.status === 'Clear to Close' || lead.status === 'Closing') {
        stats.critical++;
      } else if (lead.status === 'Closed') {
        stats.onTrack++;
      } else if (lead.status === 'Cancelled') {
        stats.overdue++;
      }
    });

    setStats(stats);
  };

  const fetchStats = async () => {
    // Stats are now calculated in fetchTimelineData
    // This function can be removed or used for additional stats if needed
  };

  const getFilteredLeads = () => {
    let filtered = leads;

    // Filter by status (mapped to timeline categories)
    if (filter !== 'all') {
      if (filter === 'ontrack') {
        filtered = filtered.filter(lead => ['New', 'Processing', 'Closed'].includes(lead.status));
      } else if (filter === 'warning') {
        filtered = filtered.filter(lead => ['Inspection', 'Appraisal'].includes(lead.status));
      } else if (filter === 'critical') {
        filtered = filtered.filter(lead => ['Clear to Close', 'Closing'].includes(lead.status));
      } else if (filter === 'overdue') {
        filtered = filtered.filter(lead => lead.status === 'Cancelled');
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lead_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredLeads = getFilteredLeads();

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h1>Timeline View</h1>
        <p>Track milestone progress for all your leads</p>
      </div>

      {/* Stats Bar */}
      <div className="timeline-stats-bar">
        <div className="stat-card-small total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Leads</p>
          </div>
        </div>

        <div className="stat-card-small ontrack">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.onTrack}</h3>
            <p>On Track</p>
          </div>
        </div>

        <div className="stat-card-small warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{stats.warning}</h3>
            <p>Warning</p>
          </div>
        </div>

        <div className="stat-card-small critical">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <h3>{stats.critical}</h3>
            <p>Critical</p>
          </div>
        </div>

        <div className="stat-card-small overdue">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <h3>{stats.overdue}</h3>
            <p>Overdue</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="timeline-filters">
        <div className="filter-group">
          <label>Timeline Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Leads</option>
            <option value="ontrack">On Track</option>
            <option value="warning">Warning (3-4 days)</option>
            <option value="critical">Critical (1-2 days)</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search by client name, lead ID, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline Cards */}
      {loading ? (
        <div className="loading">Loading timeline data...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          <p>No leads found matching your criteria</p>
        </div>
      ) : (
        <div className="timeline-cards-list">
          {filteredLeads.map(lead => (
            <TimelineCard
              key={lead.id}
              lead={lead}
              onViewDetails={() => setSelectedLead(lead)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLead && (
        <TimelineDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}

export default TimelineView;