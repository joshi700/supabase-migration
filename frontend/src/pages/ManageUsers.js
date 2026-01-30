import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/ManageUsers.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function ManageUsers({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'broker',
    password: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'User added successfully!');
      setShowAddModal(false);
      setFormData({ email: '', name: '', role: 'broker', password: '' });
      fetchUsers();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to add user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/users/${selectedUser.email}`, {
        name: formData.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'User deleted successfully!');
      fetchUsers();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (email) => {
    const newPassword = prompt('Enter new temporary password:');
    if (!newPassword) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/${email}/reset-password`, {
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'Password reset successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to reset password');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: ''
    });
    setShowEditModal(true);
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="manage-users-page">
      <div className="manage-users-header">
        <div>
          <h1>Manage Users</h1>
          <p>Add, edit, and manage broker accounts</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="add-user-btn">
          + Add New Broker
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="users-filters">
        <div className="filter-group">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="broker">Broker</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.email}>
                  <td className="user-email">{u.email}</td>
                  <td className="user-name">{u.name}</td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    {u.role !== 'admin' && (
                      <>
                        <button 
                          onClick={() => openEditModal(u)} 
                          className="action-btn edit"
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleResetPassword(u.email)} 
                          className="action-btn reset"
                          title="Reset Password"
                        >
                          🔑
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.email)} 
                          className="action-btn delete"
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {u.role === 'admin' && (
                      <span className="admin-label">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Broker</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">✕</button>
            </div>
            
            <form onSubmit={handleAddUser} className="user-form">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="broker@example.com"
                />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Min. 8 characters"
                  minLength="8"
                />
                <small>User will be prompted to change on first login</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Broker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="user-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="disabled"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
