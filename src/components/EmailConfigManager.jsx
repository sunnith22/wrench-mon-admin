import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck, History } from 'lucide-react';
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
        showToast(`✅ Test email successfully sent to ${testEmailRecipient}!`);
      }
    } catch (err) {
      showToast('Test email failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading email configuration...</div>;
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Settings Card */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Pulse Email Trigger Configuration</h2>
              <p className="panel-desc">Configure automated alerts dispatched when tools breach their pulse limits.</p>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Master Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: config?.enabled ? '#ecfdf5' : '#f8fafc',
            border: config?.enabled ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: config?.enabled ? '#047857' : '#475569' }}>
                Master Email Alerts: {config?.enabled ? 'ENABLED' : 'DISABLED'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {config?.enabled ? 'Real-time emails are active for all enabled tools' : 'All email dispatching is temporarily paused'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={config?.enabled || false}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {/* Cooldown Settings */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              Alert Cooldown Window (Minutes)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                min="1"
                max="60"
                className="form-input"
                style={{ width: '120px' }}
                value={config?.cooldownMinutes || 10}
                onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value, 10) })}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Prevents spamming: suppresses repeat emails for the same tool within {config?.cooldownMinutes || 10} minutes.
              </span>
            </div>
          </div>

          {/* Alert Conditions */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
              Dispatch Triggers
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config?.sendOnCritical !== false}
                  onChange={(e) => setConfig({ ...config, sendOnCritical: e.target.checked })}
                />
                <span><strong>Critical Threshold Exceeded:</strong> Trigger when pulse count &gt; approved limit (e.g. 26 pulses)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config?.sendOnWarning !== false}
                  onChange={(e) => setConfig({ ...config, sendOnWarning: e.target.checked })}
                />
                <span><strong>Warning Trend Trigger:</strong> Pre-alert when approaching limit (3 pulses below threshold)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Recipients Card */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Alert Recipient List</h2>
              <p className="panel-desc">All emails that receive pulse breach notifications.</p>
            </div>
          </div>

          {/* Add Recipient Form */}
          <form onSubmit={handleAddRecipient} style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
            <input
              type="email"
              className="form-input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Add engineer email (e.g. lead@toyota.com)"
            />
            <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={15} />
              <span>Add</span>
            </button>
          </form>

          {/* Recipients List */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
            {config?.recipients?.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No email recipients configured. Please add at least one recipient above.
              </div>
            ) : (
              config?.recipients?.map((email, idx) => (
                <div
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: idx === config.recipients.length - 1 ? 'none' : '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? 'white' : '#fcfdfe'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} color="#64748b" />
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Remove recipient"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Send Test Email Section */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
              Test Alert Delivery
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                className="form-input"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Test recipient email"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Send size={14} />
                <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email History Card */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Recent Email Alert Dispatch Log</h2>
            <p className="panel-desc">Real-time record of alerts generated by threshold breaches.</p>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Tool Name / ID</th>
              <th>Station</th>
              <th>Measured Pulses</th>
              <th>Configured Limit</th>
              <th>Recipients</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No threshold breach emails dispatched yet.
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{h.toolName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{h.wrenchId}</div>
                  </td>
                  <td>
                    <span className="badge-blue">Station {h.station}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: '#dc2626' }}>{h.measuredPulse} pulses</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#475569' }}>{h.pulseLimit} pulses</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#475569' }}>{h.recipients?.length || 1} recipients</span>
                  </td>
                  <td>
                    <span className="badge-green">
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
  );
}
