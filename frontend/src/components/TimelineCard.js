import React from 'react';
import '../styles/TimelineCard.css';

function TimelineCard({ lead, onViewDetails }) {
  const getStatusClass = (status) => {
    const statusMap = {
      'New': 'alert-ontrack',
      'Processing': 'alert-ontrack',
      'Inspection': 'alert-warning',
      'Appraisal': 'alert-warning',
      'Clear to Close': 'alert-critical',
      'Closing': 'alert-critical',
      'Closed': 'alert-ontrack',
      'Cancelled': 'alert-overdue'
    };
    return statusMap[status] || 'alert-ontrack';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'New': '✓',
      'Processing': '●',
      'Inspection': '⚠️',
      'Appraisal': '⚠️',
      'Clear to Close': '🔴',
      'Closing': '🔴',
      'Closed': '✓',
      'Cancelled': '🚨'
    };
    return iconMap[status] || '●';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate milestone completion
  const milestones = [
    { name: 'Offer Accept', expected: lead.expected_offer_accept_date, actual: lead.actual_offer_accept_date },
    { name: 'Title', expected: lead.expected_title_date, actual: lead.actual_title_date },
    { name: 'Inspection Order', expected: lead.expected_inspection_order_date, actual: lead.actual_inspection_order_date },
    { name: 'Inspection Complete', expected: lead.expected_inspection_complete_date, actual: lead.actual_inspection_complete_date },
    { name: 'Appraisal Order', expected: lead.expected_appraisal_order_date, actual: lead.actual_appraisal_order_date },
    { name: 'Appraisal Complete', expected: lead.expected_appraisal_complete_date, actual: lead.actual_appraisal_complete_date },
    { name: 'Clear to Close', expected: lead.expected_clear_to_close_date, actual: lead.actual_clear_to_close_date },
    { name: 'Closing Scheduled', expected: lead.expected_closing_scheduled_date, actual: lead.actual_closing_scheduled_date },
    { name: 'Close Date', expected: lead.expected_close_date, actual: lead.actual_close_date }
  ];

  const completedCount = milestones.filter(m => m.actual).length;
  const progressPercentage = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className={`timeline-card ${getStatusClass(lead.status)}`}>
      {/* Card Header */}
      <div className="timeline-card-header">
        <div className="lead-info">
          <h3>{lead.client_name}</h3>
          <p className="lead-id">{lead.lead_id}</p>
        </div>
        <div className="alert-badge">
          <span className={`alert-icon ${getStatusClass(lead.status)}`}>{getStatusIcon(lead.status)}</span>
          <span className="alert-text">{lead.status}</span>
        </div>
      </div>

      {/* Property Address */}
      <div className="property-address">
        <span className="address-icon">📍</span>
        <span>{lead.property_address}</span>
      </div>

      {/* Current Status */}
      <div className="current-status">
        <span className="status-label">Broker:</span>
        <span className="status-badge">{lead.broker_email}</span>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span>Progress: {completedCount} of {milestones.length} milestones ({progressPercentage}%)</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="horizontal-timeline">
        {milestones.slice(0, 5).map((milestone, index) => (
          <div key={index} className="timeline-milestone-wrapper">
            <div className={`timeline-milestone ${milestone.actual ? 'milestone-completed' : 'milestone-pending'}`}>
              <div className="milestone-circle">
                <span className="milestone-icon">{milestone.actual ? '✓' : '○'}</span>
              </div>
              <div className="milestone-info">
                <div className="milestone-name">{milestone.name}</div>
                <div className="milestone-date">
                  {milestone.actual ? (
                    <span className="actual-date">{formatDate(milestone.actual)}</span>
                  ) : (
                    <span className="expected-date">{formatDate(milestone.expected)}</span>
                  )}
                </div>
              </div>
            </div>
            {index < 4 && (
              <div className={`timeline-connector ${milestone.actual ? 'completed' : 'pending'}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* View Details Button */}
      <div className="card-footer">
        <button onClick={onViewDetails} className="view-details-btn">
          View Details →
        </button>
      </div>
    </div>
  );
}

export default TimelineCard;