// src/pages/UserManagement.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import designationService from '../services/designationService';
import teamTypeService from '../services/teamTypeService';
import AdminOnly from '../components/AdminOnly';
import '../styles/UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [teamTypes, setTeamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUserModal, setEditUserModal] = useState({ show: false, user: null });
  const [resetPasswordModal, setResetPasswordModal] = useState({ show: false, userId: null, tempPassword: null });
  const [createPasswordModal, setCreatePasswordModal] = useState({ show: false, user: null, tempPassword: null });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    isAdmin: false,
    designationId: null,
    teamTypeId: null,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, designationsRes] = await Promise.all([
        api.get('/Users'),
        designationService.getAllDesignations(),
      ]);
      
      setUsers(usersRes.data);
      setDesignations(designationsRes.length > 0 ? designationsRes : designationService.getDefaultDesignations());
      const teamTypesRes = await teamTypeService.getAllTeamTypes();
      setTeamTypes(teamTypesRes.length > 0 ? teamTypesRes : teamTypeService.getDefaultTeamTypes());
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
      setDesignations(designationService.getDefaultDesignations());
      setTeamTypes(teamTypeService.getDefaultTeamTypes());
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/Users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      if (!formData.teamTypeId) {
        setError('Team type is required');
        return;
      }

      const newUser = {
        ...formData,
        isActive: true,
      };

      const response = await api.post('/Users', newUser);
      setCreatePasswordModal({
        show: true,
        user: response.data.user,
        tempPassword: response.data.temporaryPassword,
      });
      setFormData({ firstName: '', lastName: '', username: '', email: '', isAdmin: false, designationId: null, teamTypeId: null });
      setShowAddUser(false);
      await fetchUsers();
    } catch (err) {
      setError('Failed to add user');
      console.error(err);
    }
  };

  const handleEditUser = (user) => {
    setEditUserModal({ show: true, user });
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        designationId: user.designationId,
        teamTypeId: user.teamTypeId,
      });
  };

  const handleSaveEditUser = async () => {
    if (!editUserModal.user) return;
    try {
      if (!formData.teamTypeId) {
        setError('Team type is required');
        return;
      }

      await api.put(`/Users/${editUserModal.user.userNumber}`, {
        ...editUserModal.user,
        ...formData,
      });
      setEditUserModal({ show: false, user: null });
      await fetchUsers();
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    }
  };

  const closeEditModal = () => {
    setEditUserModal({ show: false, user: null });
    setFormData({ firstName: '', lastName: '', username: '', email: '', isAdmin: false, designationId: null, teamTypeId: null });
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      const user = users.find(u => u.userNumber === userId);
      await api.put(`/Users/${userId}`, { ...user, isAdmin: !isAdmin });
      await fetchUsers();
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const response = await api.post(`/auth/admin/reset-password/${userId}`);
      setResetPasswordModal({
        show: true,
        userId,
        tempPassword: response.data.temporaryPassword,
      });
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetPasswordModal.tempPassword);
    alert('Temporary password copied to clipboard!');
  };

  const closeResetModal = () => {
    setResetPasswordModal({ show: false, userId: null, tempPassword: null });
  };

  const closeCreatePasswordModal = () => {
    setCreatePasswordModal({ show: false, user: null, tempPassword: null });
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/Users/${userId}`);
        await fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
        console.error(err);
      }
    }
  };

  return (
    <AdminOnly>
      <div className="user-management">
        <h1>User Management</h1>

        {error && <div className="error-alert">{error}</div>}

        <div className="management-header">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddUser(!showAddUser)}
          >
            {showAddUser ? 'Cancel' : '+ Add New User'}
          </button>
        </div>

        {showAddUser && (
          <div className="add-user-form">
            <h3>Create New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="(will be login username)"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                />
              </div>

              <div className="form-group">
                <label>Team Type</label>
                <select
                  value={formData.teamTypeId || ''}
                  onChange={(e) => setFormData({ ...formData, teamTypeId: e.target.value ? parseInt(e.target.value) : null })}
                  required
                >
                  <option value="">Select a team type</option>
                  {teamTypes.map(team => (
                    <option key={team.teamTypeId} value={team.teamTypeId}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Designation</label>
                <select
                  value={formData.designationId || ''}
                  onChange={(e) => setFormData({ ...formData, designationId: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Select a designation</option>
                  {designations.map(des => (
                    <option key={des.designationId} value={des.designationId}>
                      {des.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  />
                  Admin Privileges
                </label>
              </div>

              <button type="submit" className="btn btn-success">Create User</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Team Type</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => {
                  const designation = designations.find(d => d.designationId === user.designationId);
                  const teamType = teamTypes.find(t => t.teamTypeId === user.teamTypeId);
                  return (
                    <tr key={user.userNumber}>
                      <td>{user.fullName}</td>
                      <td>{user.username}</td>
                      <td>{user.email || '-'}</td>
                      <td>{teamType ? teamType.name : '-'}</td>
                      <td>{designation ? designation.name : '-'}</td>
                      <td>
                        <span className={`role-badge ${user.isAdmin ? 'admin' : 'member'}`}>
                          {user.isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditUser(user)}
                          title="Edit user information"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleResetPassword(user.userNumber)}
                          title="Reset user password to temporary value"
                        >
                          Reset Password
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleAdmin(user.userNumber, user.isAdmin)}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.userNumber)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit User Modal */}
        {editUserModal.show && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit User</h3>
                <button className="modal-close" onClick={closeEditModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Team Type</label>
                  <select
                    value={formData.teamTypeId || ''}
                    onChange={(e) => setFormData({ ...formData, teamTypeId: e.target.value ? parseInt(e.target.value) : null })}
                    required
                  >
                    <option value="">Select a team type</option>
                    {teamTypes.map(team => (
                      <option key={team.teamTypeId} value={team.teamTypeId}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <select
                    value={formData.designationId || ''}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">Select a designation</option>
                    {designations.map(des => (
                      <option key={des.designationId} value={des.designationId}>
                        {des.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    />
                    Admin Privileges
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveEditUser}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {resetPasswordModal.show && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Password Reset</h3>
                <button className="modal-close" onClick={closeResetModal}>×</button>
              </div>
              <div className="modal-body">
                <p>
                  A temporary password has been generated for this user. 
                  They should change it immediately upon next login.
                </p>
                <div className="temp-password-display">
                  <label>Temporary Password:</label>
                  <div className="password-box">
                    <code>{resetPasswordModal.tempPassword}</code>
                    <button 
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={copyToClipboard}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={closeResetModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {createPasswordModal.show && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>New Member Login</h3>
                <button className="modal-close" onClick={closeCreatePasswordModal}>Ã—</button>
              </div>
              <div className="modal-body">
                <p>Share these credentials with the new member:</p>
                <div className="temp-password-display">
                  <label>Username:</label>
                  <div className="password-box">
                    <code>{createPasswordModal.user?.username}</code>
                  </div>
                </div>
                <div className="temp-password-display">
                  <label>Temporary Password:</label>
                  <div className="password-box">
                    <code>{createPasswordModal.tempPassword}</code>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => navigator.clipboard.writeText(createPasswordModal.tempPassword || '')}
                    >
                      ðŸ“‹ Copy
                    </button>
                  </div>
                </div>
                <p>They will be asked to change the password on first login.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={closeCreatePasswordModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
