import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ThresholdManager from './components/ThresholdManager';
import ScheduleManager from './components/ScheduleManager';
import EmailConfigManager from './components/EmailConfigManager';
import AuditLogViewer from './components/AuditLogViewer';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('thresholds');
  const [toasts, setToasts] = useState([]);

  // Check existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('tnga_admin_token');
    const savedUser = localStorage.getItem('tnga_admin_user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser({ username: 'admin' });
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    showToast(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('tnga_admin_token');
    localStorage.removeItem('tnga_admin_user');
    setUser(null);
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-shell">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="page-container">
        {activeTab === 'thresholds' && <ThresholdManager showToast={showToast} />}
        {activeTab === 'schedule' && <ScheduleManager showToast={showToast} />}
        {activeTab === 'email' && <EmailConfigManager showToast={showToast} />}
        {activeTab === 'audit' && <AuditLogViewer showToast={showToast} />}
      </main>

      {/* Modern Toast Notification Stack */}
      <div className="toast-rack">
        {toasts.map(t => (
          <div key={t.id} className="toast-msg" style={{
            background: t.type === 'error' ? '#b91c1c' : '#0f172a'
          }}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
