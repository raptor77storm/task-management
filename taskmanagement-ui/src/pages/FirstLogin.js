// src/pages/FirstLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/FirstLogin.css';

export default function FirstLogin() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = authService.getCurrentUserData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    // For first-time login, current password is not required
    const result = await authService.changePassword('', newPassword, confirmPassword);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Password setup failed');
    }

    setLoading(false);
  };

  return (
    <div className="first-login-container">
      <div className="first-login-card">
        <h1>Set Your Password</h1>
        <p className="subtitle">
          Welcome, {user?.fullName}! Please create a new password to get started.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
            <small>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Setting up...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
