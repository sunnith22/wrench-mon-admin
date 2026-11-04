import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  History,
  Save,
  Users,
  Settings2,
  Sliders
} from 'lucide-react';
import api from '../api';

export default function EmailConfigManager({ showToast }) {
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchData = async () => {
    try {
      const [cfgRes, histRes] = await Promise.all([
        api.get('/email-config'),
        api.get('/email-history')
      ]);

      if (cfgRes.data.success) {
        setConfig(cfgRes.data.emailConfig);
        if (cfgRes.data.emailConfig.recipients?.length > 0) {
          setTestEmailRecipient(cfgRes.data.emailConfig.recipients[0]);
        }
      }
      if (histRes.data.success) {
        setHistory(histRes.data.history || []);
      }
    } catch (err) {
      showToast('Error loading email settings: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRecipient = (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (config.recipients.includes(newEmail.trim().toLowerCase())) {
      showToast('This email is already in the recipient list', 'warning');
      return;
    }

    const updated = [...config.recipients, newEmail.trim().toLowerCase()];
    setConfig({ ...config, recipients: updated });
    setNewEmail('');
  };

  const handleRemoveRecipient = (emailToRemove) => {
    const updated = config.recipients.filter(e => e !== emailToRemove);
    setConfig({ ...config, recipients: updated });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await api.put('/email-config', config);
      if (res.data.success) {
        showToast('✅ Email trigger settings saved successfully!');
        setConfig(res.data.emailConfig);
      }
    } catch (err) {
      showToast('Failed to save settings: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      showToast('Please enter a recipient for the test email', 'error');
      return;
    }

    setSendingTest(true);
    try {
      const res = await api.post('/email-config/test', { testRecipient: testEmailRecipient });
      if (res.data.success) {
        showToast(`✅ Test alert email dispatched to ${testEmailRecipient}!`);
      }
    } catch (err) {
      showToast('Test email failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading email notification parameters...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Left: General Settings Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pulse Email Trigger Rules</h2>
              <p className="card-desc">Automatic email dispatching when fasteners cross approved limits</p>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="btn btn-primary"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          {/* Master Email Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: config?.enabled ? '#ecfdf5' : '#f8fafc',
            border: config?.enabled ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: config?.enabled ? '#065f46' : '#475569' }}>
                Automated Email Alerts: {config?.enabled ? 'ACTIVE' : 'MUTED'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {config?.enabled
                  ? 'Real-time emails are sent when any tool breaches its limit'
                  : 'All automated email alerts are paused plant-wide'}
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={config?.enabled || false}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              <span className="slider" />
            </label>
          </div>

          {/* Cooldown Settings */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Spam Prevention Cooldown Window
              </label>
              <span className="badge badge-blue">
                {config?.cooldownMinutes || 10} minutes
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              step="1"
              value={config?.cooldownMinutes || 10}
              onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              <span>2 mins (Fast)</span>
              <span>10 mins (Recommended)</span>
              <span>60 mins (Quiet)</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Suppresses repeat alert emails for the same physical tool within this interval.
            </p>
          </div>

          {/* Condition Triggers */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              Notification Event Conditions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config?.sendOnCritical !== false}
                  onChange={(e) => setConfig({ ...config, sendOnCritical: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span><strong>Critical Pulse Breach:</strong> When cycle pulses exceed configured limit (e.g. 26 pulses)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config?.sendOnWarning !== false}
                  onChange={(e) => setConfig({ ...config, sendOnWarning: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span><strong>Warning Trend Trigger:</strong> When pulses enter warning buffer (limit - 3)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Recipients Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Registered Alert Recipients</h2>
              <p className="card-desc">Engineers receiving real-time breach notifications</p>
            </div>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddRecipient} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="email"
              className="input-field"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. quality.lead@toyota.com"
            />
            <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={15} />
              <span>Add Recipient</span>
            </button>
          </form>

          {/* List */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            overflow: 'hidden',
            maxHeight: '240px',
            overflowY: 'auto',
            marginBottom: '20px'
          }}>
            {config?.recipients?.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No emails registered. Enter an email address above.
              </div>
            ) : (
              config?.recipients?.map((email, idx) => (
                <div
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: idx === config.recipients.length - 1 ? 'none' : '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? '#ffffff' : '#fcfdfe'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      @
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email)}
                    className="btn-ghost"
                    style={{ color: '#ef4444', padding: '4px' }}
                    title="Remove recipient"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Send Test Box */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
              SMTP Test Notification
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                className="input-field"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Recipient email address"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Send size={14} />
                <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch History Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Threshold Breach Email Dispatch Log</h2>
            <p className="card-desc">Audit trail of email notifications triggered by tightening cycle spikes</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Fastener Name & ID</th>
                <th>Station</th>
                <th>Measured Pulses</th>
                <th>Configured Limit</th>
                <th>Recipients</th>
                <th>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No automated alert emails dispatched yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id}>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{h.toolName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{h.wrenchId}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue">Station {h.station}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '800', color: '#dc2626' }}>{h.measuredPulse} pulses</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#475569' }}>{h.pulseLimit} pulses</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>{h.recipients?.length || 1} engineers</span>
                    </td>
                    <td>
                      <span className="badge badge-green">
                        <CheckCircle2 size={12} /> {h.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
