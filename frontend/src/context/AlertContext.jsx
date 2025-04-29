import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((message, type = 'info', autoClose = true, autoCloseTime = 5000) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type, autoClose, autoCloseTime }]);
    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    return addAlert(message, 'success', options.autoClose, options.autoCloseTime);
  }, [addAlert]);

  const showError = useCallback((message, options = {}) => {
    return addAlert(message, 'error', options.autoClose, options.autoCloseTime);
  }, [addAlert]);

  const showWarning = useCallback((message, options = {}) => {
    return addAlert(message, 'warning', options.autoClose, options.autoCloseTime);
  }, [addAlert]);

  const showInfo = useCallback((message, options = {}) => {
    return addAlert(message, 'info', options.autoClose, options.autoCloseTime);
  }, [addAlert]);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        addAlert,
        removeAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-md">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            type={alert.type}
            message={alert.message}
            autoClose={alert.autoClose}
            autoCloseTime={alert.autoCloseTime}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export default AlertContext; 