import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const baseStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10000,
    animation: 'slideIn 0.3s ease-in-out',
    maxWidth: '400px',
    wordWrap: 'break-word',
  };

  const typeStyles = {
    success: {
      backgroundColor: '#10b981',
      color: 'white',
      borderLeft: '4px solid #059669',
    },
    error: {
      backgroundColor: '#ef4444',
      color: 'white',
      borderLeft: '4px solid #dc2626',
    },
    warning: {
      backgroundColor: '#f59e0b',
      color: 'white',
      borderLeft: '4px solid #d97706',
    },
    info: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderLeft: '4px solid #1d4ed8',
    },
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
      <div style={{ ...baseStyle, ...typeStyles[type] }}>
        {message}
      </div>
    </>
  );
};

export default Toast;
