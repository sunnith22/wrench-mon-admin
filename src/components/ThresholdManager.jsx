import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Edit2,
  CheckCircle2,
  Mail,
  ArrowUpDown,
  Filter,
  Save,
  X,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Check,
  AlertTriangle,
  Layers
} from 'lucide-react';
import api from '../api';

export default function ThresholdManager({ showToast }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  // Inline editing state: { [wrench_id]: draft_limit }
  const [draftLimits, setDraftLimits] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Edit Modal State
  const [editingTool, setEditingTool] = useState(null);
  const [newLimit, setNewLimit] = useState(25);
  const [newWarningLimit, setNewWarningLimit] = useState(22);
  const [emailTriggerEnabled, setEmailTriggerEnabled] = useState(true);
  const [modalSaving, setModalSaving] = useState(false);

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
        // Initialize draft limits
        const initialDrafts = {};
        res.data.data.forEach(t => {
          initialDrafts[t.wrench_id] = t.pulse_limit;
        });
        setDraftLimits(initialDrafts);
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

  // Quick inline limit increment/decrement
  const handleInlineStep = (wrenchId, delta) => {
    setDraftLimits(prev => {
      const cur = prev[wrenchId] !== undefined ? prev[wrenchId] : 25;
      const nextVal = Math.max(5, Math.min(80, cur + delta));
      return { ...prev, [wrenchId]: nextVal };
    });
  };

  // Quick inline save
  const handleQuickSave = async (tool) => {
    const targetLimit = draftLimits[tool.wrench_id];
    if (targetLimit === tool.pulse_limit) return; // no change

    setSavingId(tool.wrench_id);
    try {
      const res = await api.put(`/thresholds/${tool.wrench_id}`, {
        pulse_limit: targetLimit,
        warning_limit: Math.max(1, targetLimit - 3),
        email_trigger_enabled: tool.email_trigger_enabled !== false
      });

      if (res.data.success) {
        showToast(`✅ ${tool.tool_name} limit updated from ${tool.pulse_limit} to ${targetLimit} pulses!`);
        setTools(prev => prev.map(t => t.wrench_id === tool.wrench_id ? res.data.data : t));
      }
    } catch (err) {
      showToast('Update failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Modal open
  const openEditModal = (tool) => {
    setEditingTool(tool);
    setNewLimit(tool.pulse_limit);
    setNewWarningLimit(tool.warning_limit || Math.max(1, tool.pulse_limit - 3));
    setEmailTriggerEnabled(tool.email_trigger_enabled !== false);
  };

  const closeEditModal = () => {
    setEditingTool(null);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!editingTool) return;

    setModalSaving(true);
    try {
      const res = await api.put(`/thresholds/${editingTool.wrench_id}`, {
        pulse_limit: parseInt(newLimit, 10),
        warning_limit: parseInt(newWarningLimit, 10),
        email_trigger_enabled: emailTriggerEnabled
      });

      if (res.data.success) {
        showToast(`✅ Pulse count limit for ${editingTool.tool_name} successfully set to ${newLimit}!`);
        setTools(prev => prev.map(t => t.wrench_id === editingTool.wrench_id ? res.data.data : t));
        setDraftLimits(prev => ({ ...prev, [editingTool.wrench_id]: parseInt(newLimit, 10) }));
        closeEditModal();
      }
    } catch (err) {
      showToast('Failed to update limit: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setModalSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
    setModalSaving(true);
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
        showToast(`✅ Bulk shift (${bulkDelta > 0 ? '+' : ''}${bulkDelta} pulses) applied to ${wrenchIds.length} tools!`);
        fetchThresholds();
        setShowBulkModal(false);
      }
    } catch (err) {
      showToast('Bulk update failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setModalSaving(false);
    }
  };

  // Filter tools
  const filteredTools = tools.filter(t => {
    const matchesAssy = selectedAssembly === 'ALL' || t.assembly_name === selectedAssembly;
    const matchesBrand = selectedBrand === 'ALL' || t.brand?.toUpperCase() === selectedBrand;
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      t.tool_name.toLowerCase().includes(q) ||
      t.wrench_id.toLowerCase().includes(q) ||
      String(t.station).toLowerCase().includes(q) ||
      String(t.folder).includes(q) ||
      (t.line_code && t.line_code.toLowerCase().includes(q));
    return matchesAssy && matchesBrand && matchesSearch;
  });

  return (
    <div>
      {/* Top High-Level Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Monitored Fasteners
            </span>
            <span className="badge badge-blue">73 Registered</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
            {tools.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Active across Assembly 1, 2, and 3
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Email Alarm Triggers
            </span>
            <span className="badge badge-green">Automated</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>
            {tools.filter(t => t.email_trigger_enabled !== false).length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Tools dispatching alerts when limit exceeded
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Avg Pulse Limit
            </span>
            <span className="badge badge-amber">Baseline</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#f59e0b', marginTop: '8px' }}>
            {tools.length > 0 ? (tools.reduce((acc, t) => acc + (t.pulse_limit || 25), 0) / tools.length).toFixed(1) : '24.5'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Plant-wide average shut-off pulse baseline
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Quick Action
            </span>
            <Sparkles size={16} color="#2563eb" />
          </div>
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '9px 12px', fontSize: '12px', justifyContent: 'center' }}
            >
              <ArrowUpDown size={14} />
              <span>Bulk Shift Line Limits (+1/-1)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Pulse Count Limit & Email Trigger Control</h2>
            <p className="card-desc">
              Change the pulse count threshold for any tool. When actual tightening pulses cross this limit (e.g. from 25 to 26), automated email notifications are dispatched.
            </p>
          </div>
          <button onClick={fetchThresholds} className="btn btn-secondary" title="Refresh Tool Thresholds">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '38px', height: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tool name, station (e.g. 28), folder (016), or ID..."
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'Assembly 1', 'Assembly 2', 'Assembly 3'].map(assy => (
              <button
                key={assy}
                onClick={() => setSelectedAssembly(assy)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: selectedAssembly === assy ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedAssembly === assy ? '#eff6ff' : '#ffffff',
                  color: selectedAssembly === assy ? '#2563eb' : '#475569',
                  fontWeight: selectedAssembly === assy ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {assy}
              </button>
            ))}

            <span style={{ width: '1px', height: '26px', background: '#e2e8f0', margin: '4px 2px' }} />

            {['ALL', 'URYU', 'YOKOTA'].map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '20px',
                  border: selectedBrand === brand ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: selectedBrand === brand ? '#0f172a' : '#ffffff',
                  color: selectedBrand === brand ? '#ffffff' : '#64748b',
                  fontWeight: selectedBrand === brand ? '700' : '500',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '26%' }}>Tool Description & ID</th>
                <th style={{ width: '14%' }}>Station / Folder</th>
                <th style={{ width: '14%' }}>Assembly Line</th>
                <th style={{ width: '11%' }}>Target Torque</th>
                <th style={{ width: '20%', color: '#2563eb' }}>Pulse Limit (Changeable)</th>
                <th style={{ width: '8%' }}>Email Alert</th>
                <th style={{ width: '7%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading tool parameters...
                  </td>
                </tr>
              ) : filteredTools.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No wrenches found matching your query.
                  </td>
                </tr>
              ) : (
                filteredTools.map((t) => {
                  const currentDraft = draftLimits[t.wrench_id] !== undefined ? draftLimits[t.wrench_id] : t.pulse_limit;
                  const hasChanged = currentDraft !== t.pulse_limit;
                  const isSavingThis = savingId === t.wrench_id;

                  return (
                    <tr key={t.wrench_id}>
                      {/* Tool Name & Wrench ID */}
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                          {t.tool_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                          {t.wrench_id}
                        </div>
                      </td>

                      {/* Station & Folder */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-blue">
                            ST-{t.station}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                            F-{t.folder}
                          </span>
                        </div>
                      </td>

                      {/* Line Code */}
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                          {t.assembly_name || 'Assembly 2'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Line: {t.line_code || 'MK'} • {t.brand}
                        </div>
                      </td>

                      {/* Approved Torque */}
                      <td>
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>{t.target_torque || 22.0}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '3px' }}>N·m</span>
                      </td>

                      {/* Pulse Limit (Interactive Stepper Control) */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Stepper */}
                          <div className="stepper-box">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => handleInlineStep(t.wrench_id, -1)}
                              title="Decrease limit by 1"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className="stepper-val"
                              value={currentDraft}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  setDraftLimits(prev => ({ ...prev, [t.wrench_id]: val }));
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => handleInlineStep(t.wrench_id, 1)}
                              title="Increase limit by 1"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Save Check Button (Lights up when modified) */}
                          {hasChanged ? (
                            <button
                              type="button"
                              onClick={() => handleQuickSave(t)}
                              disabled={isSavingThis}
                              className="btn btn-primary"
                              style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
                              title="Save this new limit immediately"
                            >
                              <Save size={13} />
                              <span>{isSavingThis ? 'Saving...' : `Save ${currentDraft}`}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Warn: {t.warning_limit || Math.max(1, t.pulse_limit - 3)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email Trigger Active */}
                      <td>
                        {t.email_trigger_enabled !== false ? (
                          <span className="badge badge-green" title="Email dispatched on limit breach">
                            <Mail size={12} /> ON
                          </span>
                        ) : (
                          <span className="badge badge-gray" title="Email alerts muted for this tool">
                            OFF
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(t)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Open detailed configuration modal"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED EDIT MODAL */}
      {editingTool && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Adjust Pulse Limit & Email Alert
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {editingTool.tool_name} (Station {editingTool.station} • Folder {editingTool.folder})
                </div>
              </div>
              <button onClick={closeEditModal} className="btn-ghost">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="modal-body">
                {/* Information Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Wrench Asset ID:</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                      {editingTool.wrench_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Current Baseline Limit:</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
                      {editingTool.pulse_limit} pulses
                    </span>
                  </div>
                </div>

                {/* Primary Field: Pulse Limit */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                    Approved Pulse Limit (Critical Threshold)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="5"
                      max="80"
                      required
                      className="input-field"
                      style={{ fontSize: '17px', fontWeight: '800', color: '#2563eb' }}
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
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontWeight: '700' }}
                        onClick={() => {
                          const v = Math.max(5, newLimit - 1);
                          setNewLimit(v);
                          setNewWarningLimit(Math.max(1, v - 3));
                        }}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontWeight: '700' }}
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
                    Example: change from <strong>{editingTool.pulse_limit}</strong> to <strong>{editingTool.pulse_limit + 1}</strong>. Any cycle above this value triggers an immediate alert.
                  </p>
                </div>

                {/* Warning Limit */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                    Warning Limit (Pre-Alert Threshold)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    required
                    className="input-field"
                    value={newWarningLimit}
                    onChange={(e) => setNewWarningLimit(parseInt(e.target.value, 10))}
                  />
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Pre-alerts maintenance team on the dashboard before catastrophic shut-off failure.
                  </p>
                </div>

                {/* Email Trigger Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      Dispatch Email Alert on Breach
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Sends email to registered quality engineers when &gt; {newLimit} pulses
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={emailTriggerEnabled}
                      onChange={(e) => setEmailTriggerEnabled(e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                  disabled={modalSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalSaving}
                >
                  <Save size={15} />
                  <span>{modalSaving ? 'Saving...' : `Save Limit as ${newLimit}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ADJUST MODAL */}
      {showBulkModal && (
        <div className="modal-backdrop" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Bulk Adjust Pulse Limits
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="btn-ghost">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Target Assembly Line
                </label>
                <select
                  className="input-field"
                  value={bulkAssembly}
                  onChange={(e) => setBulkAssembly(e.target.value)}
                >
                  <option value="ALL">All 73 Fasteners in Plant</option>
                  <option value="Assembly 1">Assembly 1 (Sub-Assemblies)</option>
                  <option value="Assembly 2">Assembly 2 (MK1, MK2, MK3)</option>
                  <option value="Assembly 3">Assembly 3 (ET & SPS)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Delta Shift (+ / - Pulses)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[-2, -1, 1, 2].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBulkDelta(num)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: bulkDelta === num ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: bulkDelta === num ? '#eff6ff' : '#ffffff',
                        fontWeight: '800',
                        fontSize: '14px',
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

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn btn-secondary"
                disabled={modalSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpdate}
                className="btn btn-primary"
                disabled={modalSaving}
              >
                <Save size={15} />
                <span>{modalSaving ? 'Applying...' : 'Apply Bulk Shift'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
