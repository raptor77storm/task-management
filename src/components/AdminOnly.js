// src/components/AdminOnly.js
import React from 'react';
import authService from '../services/authService';

export default function AdminOnly({ children, fallback = null }) {
  if (!authService.isAdmin()) {
    return fallback || <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Access Denied: Admin only</div>;
  }

  return children;
}
