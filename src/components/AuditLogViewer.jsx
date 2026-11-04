import React, { useState, useEffect } from 'react';
import { FileText, Shield, Clock, RefreshCw, User, CheckCircle2 } from 'lucide-react';
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

  const getActionBadgeClass = (action) => {
    if (action.includes('THRESHOLD')) return 'badge badge-blue';
    if (action.includes('SCHEDULE') || action.includes('WINDOW')) return 'badge badge-green';
    if (action.includes('EMAIL')) return 'badge badge-amber';
    return 'badge badge-gray';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Administrative Change Trail & Audit History</h2>
          <p className="card-desc">
            Complete tamper-evident traceability of all pulse limit adjustments, schedule alterations, and supervisor actions.
          </p>
        </div>
        <button onClick={fetchLogs} className="btn btn-secondary" title="Refresh Audit Trail">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Timestamp</th>
              <th style={{ width: '14%' }}>Administrator</th>
              <th style={{ width: '18%' }}>Action Category</th>
              <th style={{ width: '50%' }}>Description of Modification</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No administrative actions recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-gray">
                        <User size={12} /> {log.user || 'Admin'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={getActionBadgeClass(log.action)}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                    {log.details}
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
