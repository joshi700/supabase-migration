#!/bin/bash

echo "Creating additional styles..."

# Dashboard.css
cat > src/styles/Dashboard.css << 'EOFCSS'
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard-content {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 40px;
}

.dashboard-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 8px;
}

.dashboard-header p {
  color: #666;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.stat-card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-card.blue { border-left: 4px solid #667eea; }
.stat-card.green { border-left: 4px solid #10b981; }
.stat-card.orange { border-left: 4px solid #f59e0b; }
.stat-card.gray { border-left: 4px solid #6b7280; }

.stat-icon {
  font-size: 48px;
}

.stat-info h3 {
  font-size: 36px;
  color: #333;
  margin-bottom: 4px;
}

.stat-info p {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.quick-actions {
  margin-top: 50px;
}

.quick-actions h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.action-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
}

.action-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.action-card h3 {
  color: #333;
  font-size: 20px;
  margin-bottom: 12px;
}

.action-card p {
  color: #666;
  font-size: 14px;
}
EOFCSS

# UploadLeads.css
cat > src/styles/UploadLeads.css << 'EOFCSS'
.upload-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.upload-content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-header {
  margin-bottom: 40px;
}

.upload-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 8px;
}

.upload-header p {
  color: #666;
  font-size: 16px;
}

.upload-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.upload-section, .upload-info {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.upload-section h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 30px;
}

.file-input-wrapper {
  margin-bottom: 30px;
}

.file-input-wrapper input[type="file"] {
  display: none;
}

.file-label {
  display: block;
  padding: 16px 24px;
  background: #f5f7fa;
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
  font-weight: 500;
}

.file-label:hover {
  background: #eef2ff;
  border-color: #667eea;
  color: #667eea;
}

.checkbox-wrapper {
  margin-bottom: 30px;
}

.checkbox-wrapper label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.upload-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.upload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-message {
  margin-top: 20px;
  padding: 16px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  font-weight: 500;
}

.error-message {
  margin-top: 20px;
  padding: 16px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 12px;
  font-weight: 500;
}

.upload-info h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.upload-info ul {
  list-style: none;
  padding: 0;
  color: #666;
}

.upload-info ul li {
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
}

.upload-info ul li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.upload-info ul ul {
  margin-left: 20px;
  margin-top: 8px;
}

.sample-link {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
  text-align: center;
}

.sample-link a {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
}

.sample-link a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .upload-box {
    grid-template-columns: 1fr;
  }
}
EOFCSS

# LeadsList.css
cat > src/styles/LeadsList.css << 'EOFCSS'
.leads-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.leads-content {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.leads-header {
  margin-bottom: 30px;
}

.leads-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 8px;
}

.leads-header p {
  color: #666;
  font-size: 16px;
}

.leads-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
}

.search-box input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-box select {
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  background: white;
  transition: all 0.3s;
}

.filter-box select:focus {
  outline: none;
  border-color: #667eea;
}

.refresh-button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-button:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 18px;
}

.leads-table-wrapper {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.leads-table {
  width: 100%;
  border-collapse: collapse;
}

.leads-table thead {
  background: #f9fafb;
}

.leads-table th {
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  border-bottom: 2px solid #e5e7eb;
}

.leads-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
  font-size: 14px;
}

.leads-table tbody tr {
  transition: background 0.2s;
}

.leads-table tbody tr:hover {
  background: #f9fafb;
}

.lead-id {
  font-weight: 600;
  color: #667eea;
}

.client-name {
  font-weight: 600;
  color: #374151;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-new { background: #dbeafe; color: #1e40af; }
.status-processing { background: #fed7aa; color: #92400e; }
.status-inspection { background: #e9d5ff; color: #6b21a8; }
.status-appraisal { background: #c7d2fe; color: #3730a3; }
.status-clear { background: #d1fae5; color: #065f46; }
.status-closing { background: #ccfbf1; color: #115e59; }
.status-closed { background: #e5e7eb; color: #374151; }
.status-cancelled { background: #fee2e2; color: #991b1b; }

@media (max-width: 1200px) {
  .leads-table-wrapper {
    overflow-x: auto;
  }

  .leads-table {
    min-width: 1000px;
  }
}
EOFCSS

echo "✓ All styles created"

