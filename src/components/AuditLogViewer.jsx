import React, { useState, useEffect } from 'react';
import { FileText, Shield, Clock, RefreshCw } from 'lucide-react';
import api from '../api';

export default function AuditLogViewer({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      showToast('Error loading audit logs: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">System Audit & Change Trail</h2>
          <p className="panel-desc">Complete traceability log of all threshold alterations, schedule updates, and administrator actions.</p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary" title="Refresh Logs">
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin User</th>
            <th>Action Type</th>
            <th>Change Details</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                Loading audit trail...
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No administrative actions logged yet.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td>
                  <span className="badge-blue">
                    <Shield size={12} /> {log.user || 'Admin'}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: log.action.includes('THRESHOLD') ? '#2563eb' : (log.action.includes('SCHEDULE') ? '#0284c7' : '#475569'),
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                  {log.details}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
