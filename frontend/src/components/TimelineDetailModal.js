import React from 'react';
import '../styles/TimelineDetailModal.css';

function TimelineDetailModal({ lead, onClose }) {
  const { timeline } = lead;
  const { milestones, alert, progress, daysUntilClose } = timeline;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getVarianceDisplay = (variance) => {
    if (variance === null || variance === undefined) return '-';
    if (variance === 0) return 'On time';
    if (variance < 0) return `${Math.abs(variance)} days early`;
    return `${variance} days late`;
  };

  const getVarianceClass = (variance) => {
    if (variance === null || variance === undefined) return '';
    if (variance === 0) return 'on-time';
    if (variance < 0) return 'early';
    return 'late';
  };

  const getMilestoneStatusBadge = (milestone) => {
    if (milestone.actualDate) {
      return <span className="status-badge completed">✓ Completed</span>;
    }
    
    const state = milestone.state;
    switch (state.state) {
      case 'current':
        return <span className="status-badge current">● Active</span>;
      case 'overdue':
        return <span className="status-badge overdue">⚠️ {state.daysOverdue}d Overdue</span>;
      case 'critical':
        return <span className="status-badge critical">! Critical ({state.daysUntil}d)</span>;
      case 'warning':
        return <span className="status-badge warning">⚠ Warning ({state.daysUntil}d)</span>;
      default:
        return <span className="status-badge pending">○ Pending</span>;
    }
  };

  const getAlertBanner = () => {
    if (alert.type === 'ontrack') return null;

    return (
      <div className={`alert-banner ${alert.type}`}>
        <div className="alert-icon">
          {alert.type === 'overdue' && '🚨'}
          {alert.type === 'critical' && '🔴'}
          {alert.type === 'warning' && '⚠️'}
        </div>
        <div className="alert-content">
          <h4>TIMELINE {alert.type.toUpperCase()}</h4>
          <p>{alert.message}. Please take action to prevent delays.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>Lead {lead['Lead ID']} - {lead['Client Name']}</h2>
            <p className="property-address">{lead['Property Address']}</p>
            <p className="current-status">Current Status: <span className="status-badge">{lead.Status}</span></p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Alert Banner */}
        {getAlertBanner()}

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-box">
            <div className="stat-label">Expected Completion</div>
            <div className="stat-value">
              {formatDate(lead['Expected Close Date'])}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Milestones Completed</div>
            <div className="stat-value">
              {progress.completed} of {progress.total} ({progress.percentage}%)
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Days Until Close</div>
            <div className="stat-value">
              {daysUntilClose !== null 
                ? `${daysUntilClose} days` 
                : 'Not set'}
            </div>
          </div>
        </div>

        {/* Large Timeline Visualization */}
        <div className="large-timeline-section">
          <h3>DEAL TIMELINE - 9 MILESTONES</h3>
          
          <div className="large-timeline">
            {milestones.map((milestone, index) => (
              <React.Fragment key={milestone.id}>
                <div className={`large-milestone ${milestone.state.state}`}>
                  <div className="large-milestone-circle">
                    {milestone.actualDate ? '✓' : 
                     milestone.state.state === 'current' ? '●' :
                     milestone.state.state === 'overdue' ? '!' :
                     milestone.state.state === 'critical' ? '!' :
                     milestone.state.state === 'warning' ? '⚠' : '○'}
                  </div>
                  <div className="large-milestone-label">{milestone.name}</div>
                  <div className="large-milestone-dates">
                    {milestone.actualDate ? (
                      <div className="actual-date">✓ {formatDate(milestone.actualDate)}</div>
                    ) : (
                      <div className="expected-date">Exp: {formatDate(milestone.expectedDate)}</div>
                    )}
                  </div>
                  {milestone.state.variance !== null && milestone.state.variance !== undefined && (
                    <div className={`variance-indicator ${getVarianceClass(milestone.state.variance)}`}>
                      {getVarianceDisplay(milestone.state.variance)}
                    </div>
                  )}
                </div>
                {index < milestones.length - 1 && (
                  <div className={`large-connector ${milestone.actualDate ? 'completed' : 'pending'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Milestone Details Table */}
        <div className="milestone-details-section">
          <h3>MILESTONE DETAILS</h3>
          <table className="milestone-table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Expected Date</th>
                <th>Actual Date</th>
                <th>Status</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(milestone => (
                <tr key={milestone.id}>
                  <td className="milestone-name">{milestone.name}</td>
                  <td>{formatDate(milestone.expectedDate)}</td>
                  <td>{formatDate(milestone.actualDate)}</td>
                  <td>{getMilestoneStatusBadge(milestone)}</td>
                  <td className={getVarianceClass(milestone.state.variance)}>
                    {getVarianceDisplay(milestone.state.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button onClick={onClose} className="back-button">
            ← Back to Timeline
          </button>
          <button className="export-button" disabled>
            📥 Export Report (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimelineDetailModal;
