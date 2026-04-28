import React, { useState, useEffect } from 'react';
import Toast from './Toast';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const notify = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const success = (message, duration) => notify(message, 'success', duration);
  const error = (message, duration) => notify(message, 'error', duration);
  const warning = (message, duration) => notify(message, 'warning', duration);
  const info = (message, duration) => notify(message, 'info', duration);

  const ToastContainer = () => (
    <>
      {notifications.map((notif, idx) => (
        <Toast
          key={notif.id}
          message={notif.message}
          type={notif.type}
          duration={notif.duration}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </>
  );

  return { notify, success, error, warning, info, ToastContainer };
};

export default useNotification;
