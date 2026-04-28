// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminOnly from '../components/AdminOnly';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    activeUsers: 0,
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, login, changes

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const [usersRes, projectsRes, tasksRes, auditRes] = await Promise.all([
        api.get('/Users'),
        api.get('/Projects'),
        api.get('/Tasks'),
        api.get('/Audit/recent?limit=30'),
      ]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalProjects: projectsRes.data?.length || 0,
        totalTasks: tasksRes.data?.length || 0,
        activeUsers: (usersRes.data || []).filter(u => u.isActive).length,
      });

      setActivityLogs(auditRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'info';
      case 'RESET_PASSWORD':
      case 'PASSWORD_CHANGED':
        return 'warning';
      case 'CREATED':
        return 'success';
      case 'UPDATED':
        return 'primary';
      case 'DELETED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    if (filter === 'login') return log.action === 'LOGIN';
    if (filter === 'changes') return ['CREATED', 'UPDATED', 'DELETED'].includes(log.action);
    return true;
  });

  return (
    <AdminOnly>
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>

        {error && <div className="error-alert">{error}</div>}

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users-icon">👥</div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats.totalUsers}</p>
                  <small>{stats.activeUsers} active</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon projects-icon">📊</div>
                <div className="stat-content">
                  <h3>Total Projects</h3>
                  <p className="stat-value">{stats.totalProjects}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon tasks-icon">✓</div>
                <div className="stat-content">
                  <h3>Total Tasks</h3>
                  <p className="stat-value">{stats.totalTasks}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon activity-icon">📈</div>
                <div className="stat-content">
                  <h3>Recent Activity</h3>
                  <p className="stat-value">{filteredLogs.length}</p>
                  <small>Last 30 activities</small>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="activity-section">
              <div className="activity-header">
                <h2>Recent Activity Log</h2>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All Activities
                  </button>
                  <button
                    className={`filter-btn ${filter === 'login' ? 'active' : ''}`}
                    onClick={() => setFilter('login')}
                  >
                    Logins
                  </button>
                  <button
                    className={`filter-btn ${filter === 'changes' ? 'active' : ''}`}
                    onClick={() => setFilter('changes')}
                  >
                    Changes
                  </button>
                </div>
              </div>

              <div className="activity-timeline">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div key={log.auditLogId} className="activity-item">
                      <div className={`activity-badge ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </div>
                      <div className="activity-details">
                        <div className="activity-header-row">
                          <strong>{log.username}</strong>
                          <span className="activity-entity">
                            {log.entityType} {log.entityId && `#${log.entityId}`}
                          </span>
                        </div>
                        {log.description && <p className="activity-description">{log.description}</p>}
                        <small className="activity-time">
                          {new Date(log.timestamp).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-activities">No activities found</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminOnly>
  );
}
