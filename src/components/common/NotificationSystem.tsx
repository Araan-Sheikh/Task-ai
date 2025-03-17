import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

export interface CustomNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
}

interface NotificationItemProps {
  notification: CustomNotification;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return '#5cb85c';
      case 'error': return '#d9534f';
      case 'warning': return '#f0ad4e';
      case 'info': default: return '#5bc0de';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': default: return 'ℹ';
    }
  };

  return (
    <div 
      className={`notification-item notification-${notification.type}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">{notification.message}</div>
      <button className="notification-close" onClick={() => onClose(notification.id)}>×</button>
    </div>
  );
};

interface NotificationSystemProps {
  notifications: CustomNotification[];
  onClose: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onClose }) => {
  return (
    <div className="notification-system">
      {notifications.filter(n => n.isVisible).map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={onClose} 
        />
      ))}
    </div>
  );
};

export default NotificationSystem; 