import React, { useState, useEffect } from 'react';
import { Search, Sliders, Edit2, CheckCircle2, ShieldAlert, Mail, ArrowUpDown, Filter, Save, X, RefreshCw } from 'lucide-react';
import api from '../api';

export default function ThresholdManager({ showToast }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState('ALL');

  // Edit Modal State
  const [editingTool, setEditingTool] = useState(null);
  const [newLimit, setNewLimit] = useState(25);
  const [newWarningLimit, setNewWarningLimit] = useState(22);
  const [emailTriggerEnabled, setEmailTriggerEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bulk Edit State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDelta, setBulkDelta] = useState(1);
  const [bulkAssembly, setBulkAssembly] = useState('ALL');

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/thresholds');
      if (res.data.success) {
        setTools(res.data.data);
      }
    } catch (err) {
      showToast('Error loading threshold list: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const openEditModal = (tool) => {
    setEditingTool(tool);
    setNewLimit(tool.pulse_limit);
    setNewWarningLimit(tool.warning_limit || Math.max(1, tool.pulse_limit - 3));
    setEmailTriggerEnabled(tool.email_trigger_enabled !== false);
  };

  const closeEditModal = () => {
    setEditingTool(null);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!editingTool) return;

    setSaving(true);
    try {
      const res = await api.put(`/thresholds/${editingTool.wrench_id}`, {
        pulse_limit: parseInt(newLimit, 10),
        warning_limit: parseInt(newWarningLimit, 10),
        email_trigger_enabled: emailTriggerEnabled
      });

      if (res.data.success) {
        showToast(`✅ Pulse count limit for ${editingTool.tool_name} updated from ${editingTool.pulse_limit} to ${newLimit}!`);
        // Update local state immediately
        setTools(prev => prev.map(t => t.wrench_id === editingTool.wrench_id ? res.data.data : t));
        closeEditModal();
      }
    } catch (err) {
      showToast('Failed to update limit: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
    setSaving(true);
    try {
      let targetTools = [...tools];
      if (bulkAssembly !== 'ALL') {
        targetTools = targetTools.filter(t => t.assembly_name === bulkAssembly);
      }
      const wrenchIds = targetTools.map(t => t.wrench_id);

      const res = await api.put('/thresholds-bulk', {
        wrenchIds,
        delta: parseInt(bulkDelta, 10)
      });

      if (res.data.success) {
        showToast(`✅ Successfully adjusted pulse limit (${bulkDelta > 0 ? '+' : ''}${bulkDelta}) for ${wrenchIds.length} tools!`);
        fetchThresholds();
        setShowBulkModal(false);
      }
    } catch (err) {
      showToast('Bulk update failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtered List
  const filteredTools = tools.filter(t => {
    const matchesAssy = selectedAssembly === 'ALL' || t.assembly_name === selectedAssembly;
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      t.tool_name.toLowerCase().includes(q) ||
      t.wrench_id.toLowerCase().includes(q) ||
      String(t.station).toLowerCase().includes(q) ||
      String(t.folder).includes(q) ||
      (t.line_code && t.line_code.toLowerCase().includes(q));
    return matchesAssy && matchesSearch;
  });

  return (
    <div>
      {/* Overview & Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="panel-card" style={{ padding: '18px 20px', marginBottom: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Monitored Tools</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{tools.length}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> Active in TNGA Asset Register
          </div>
        </div>

        <div className="panel-card" style={{ padding: '18px 20px', marginBottom: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Email Alert Triggers</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', marginTop: '6px' }}>
            {tools.filter(t => t.email_trigger_enabled !== false).length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Tools configured with automatic email dispatch
          </div>
        </div>

        <div className="panel-card" style={{ padding: '18px 20px', marginBottom: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Average Pulse Limit</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b', marginTop: '6px' }}>
            {tools.length > 0 ? (tools.reduce((acc, t) => acc + (t.pulse_limit || 25), 0) / tools.length).toFixed(1) : '24.2'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Approved engineering baseline across lines
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Pulse Count Limit & Email Trigger Manager</h2>
            <p className="panel-desc">
              Change the pulse count thresholds for any tool. When actual tightening pulses cross this limit, automated emails are triggered.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-secondary"
            >
              <ArrowUpDown size={15} />
              <span>Bulk Shift Limits</span>
            </button>
            <button
              onClick={fetchThresholds}
              className="btn-secondary"
              title="Refresh List"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tool name, station (e.g. 28), folder (e.g. 016), or ID..."
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {['ALL', 'Assembly 1', 'Assembly 2', 'Assembly 3'].map(assy => (
              <button
                key={assy}
                onClick={() => setSelectedAssembly(assy)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: selectedAssembly === assy ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedAssembly === assy ? '#eff6ff' : 'white',
                  color: selectedAssembly === assy ? '#2563eb' : '#475569',
                  fontWeight: selectedAssembly === assy ? '600' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {assy}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tool Description</th>
                <th>Station / Folder</th>
                <th>Assembly Line</th>
                <th>Target Torque</th>
                <th>Warning Limit</th>
                <th style={{ color: '#2563eb' }}>Pulse Count Limit</th>
                <th>Email Trigger</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading threshold definitions...
                  </td>
                </tr>
              ) : filteredTools.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No tools found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTools.map((t) => (
                  <tr key={t.wrench_id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{t.tool_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{t.wrench_id}</div>
                    </td>
                    <td>
                      <span className="badge-blue">
                        Station {t.station}
                      </span>
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: '#64748b' }}>
                        F-{t.folder}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#334155' }}>{t.assembly_name || 'Assembly 2'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Line: {t.line_code || 'MK'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{t.target_torque || 22.0}</span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '3px' }}>N·m</span>
                    </td>
                    <td>
                      <span className="badge-amber">
                        {t.warning_limit || Math.max(1, t.pulse_limit - 3)} pulses
                      </span>
                    </td>
                    <td>
                      {/* Highlighted Pulse Count Limit */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#2563eb',
                          background: '#eff6ff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe'
                        }}>
                          {t.pulse_limit} pulses
                        </span>
                      </div>
                    </td>
                    <td>
                      {t.email_trigger_enabled !== false ? (
                        <span className="badge-green">
                          <Mail size={12} /> Enabled
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Disabled</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : 'Initial'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        by {t.updated_by || 'System'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(t)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Edit2 size={13} />
                        <span>Change Limit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      {editingTool && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                  Update Pulse Threshold
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {editingTool.tool_name} (Station {editingTool.station})
                </div>
              </div>
              <button
                onClick={closeEditModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveThreshold}>
              <div className="modal-body">
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tool Identifier</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                    {editingTool.wrench_id}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    Current Limit: <strong style={{ color: '#2563eb' }}>{editingTool.pulse_limit} pulses</strong>
                  </div>
                </div>

                {/* Primary Field: Pulse Limit */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                    New Pulse Count Limit (Critical Threshold)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      className="form-input"
                      style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb' }}
                      value={newLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setNewLimit(val);
                        if (!isNaN(val)) setNewWarningLimit(Math.max(1, val - 3));
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontWeight: '700' }}
                        onClick={() => {
                          const v = Math.max(1, newLimit - 1);
                          setNewLimit(v);
                          setNewWarningLimit(Math.max(1, v - 3));
                        }}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontWeight: '700' }}
                        onClick={() => {
                          const v = newLimit + 1;
                          setNewLimit(v);
                          setNewWarningLimit(Math.max(1, v - 3));
                        }}
                      >
                        +1
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    For example: change from <strong>{editingTool.pulse_limit}</strong> to <strong>{editingTool.pulse_limit + 1}</strong>. When cycle pulses exceed this, an email alert will be sent.
                  </p>
                </div>

                {/* Warning Limit */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                    Warning Limit (Pre-Alert Threshold)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    className="form-input"
                    value={newWarningLimit}
                    onChange={(e) => setNewWarningLimit(parseInt(e.target.value, 10))}
                  />
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Flags tools in warning state on the dashboard prior to full threshold breach.
                  </p>
                </div>

                {/* Email Trigger Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                      Enable Email Alerts for This Tool
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Dispatch automated email to quality engineers when limit is exceeded
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailTriggerEnabled}
                    onChange={(e) => setEmailTriggerEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : `Save Limit as ${newLimit}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ADJUST MODAL */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                Bulk Adjust Pulse Limits
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Target Assembly Line
                </label>
                <select
                  className="form-input"
                  value={bulkAssembly}
                  onChange={(e) => setBulkAssembly(e.target.value)}
                >
                  <option value="ALL">All 73 Tools Across Plant</option>
                  <option value="Assembly 1">Assembly 1 (Sub-Assemblies)</option>
                  <option value="Assembly 2">Assembly 2 (MK1, MK2, MK3)</option>
                  <option value="Assembly 3">Assembly 3 (ET, SPS)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Limit Offset (+ / - Pulses)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[-2, -1, 1, 2].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBulkDelta(num)}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '6px',
                        border: bulkDelta === num ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: bulkDelta === num ? '#eff6ff' : 'white',
                        fontWeight: '700',
                        color: bulkDelta === num ? '#2563eb' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {num > 0 ? `+${num}` : num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpdate}
                className="btn-primary"
                disabled={saving}
              >
                <Save size={15} />
                <span>{saving ? 'Applying...' : 'Apply Bulk Shift'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
