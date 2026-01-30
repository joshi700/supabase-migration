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
