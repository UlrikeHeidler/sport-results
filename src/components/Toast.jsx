import React from 'react';
import './Toast.css';

const Toast = ({ toasts = [], onRemove }) => {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || ''}`}>
          <div className="toast-message">{t.message}</div>
          <button className="toast-close" onClick={() => onRemove && onRemove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
