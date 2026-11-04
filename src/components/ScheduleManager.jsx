import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Play, CheckCircle2, AlertTriangle, Trash2, Edit3, X, Save, Power } from 'lucide-react';
import api from '../api';

export default function ScheduleManager({ showToast }) {
  const [schedule, setSchedule] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '10:00',
    endTime: '10:10',
    enabled: true,
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/schedule');
      if (res.data.success) {
        setSchedule(res.data.schedule || []);
        setSyncStatus(res.data.syncStatus || null);
      }
    } catch (err) {
      showToast('Error fetching schedule: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 15000);
    return () => clearInterval(interval);
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      startTime: '11:00',
      endTime: '11:10',
      enabled: true,
      description: 'Line availability window'
    });
    setShowModal(true);
  };

  const openEditModal = (win) => {
    setEditingId(win.id);
    setFormData({
      name: win.name,
      startTime: win.startTime,
      endTime: win.endTime,
      enabled: win.enabled,
      description: win.description || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSaveWindow = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put(`/schedule/${editingId}`, formData);
        if (res.data.success) {
          showToast(`✅ Window "${formData.name}" updated successfully!`);
        }
      } else {
        const res = await api.post('/schedule', formData);
        if (res.data.success) {
          showToast(`✅ New pulling window "${formData.name}" added to schedule!`);
        }
      }
      fetchSchedule();
      closeModal();
    } catch (err) {
      showToast('Failed to save window: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWindow = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove the window "${name}" from the schedule?`)) return;
    try {
      const res = await api.delete(`/schedule/${id}`);
      if (res.data.success) {
        showToast(`Window "${name}" removed`);
        fetchSchedule();
      }
    } catch (err) {
      showToast('Failed to delete window: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleToggleEnabled = async (win) => {
    try {
      const res = await api.put(`/schedule/${win.id}`, { enabled: !win.enabled });
      if (res.data.success) {
        showToast(`Window "${win.name}" ${!win.enabled ? 'activated' : 'paused'}`);
        fetchSchedule();
      }
    } catch (err) {
      showToast('Toggle failed: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleTriggerSyncNow = async () => {
    setTriggering(true);
    try {
      const res = await api.post('/schedule/trigger-now');
      if (res.data.success) {
        const r = res.data.result;
        showToast(`⚡ Manual sync completed: ${r.totalFetched} cycles pulled, ${r.alertsTriggered} alerts evaluated!`);
        fetchSchedule();
      }
    } catch (err) {
      showToast('Sync trigger failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div>
      {/* Status Bar Card */}
      <div className="panel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: syncStatus?.isRunning ? '#f59e0b' : '#10b981',
              display: 'inline-block'
            }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Dynamic Scheduler: {syncStatus?.isRunning ? 'ACTIVE EXTRACTION RUNNING' : 'ONLINE & MONITORING'}
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Line extraction is strictly locked to the dynamic availability windows below to protect the shop floor PC.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleTriggerSyncNow}
            disabled={triggering || syncStatus?.isRunning}
            className="btn-primary"
            style={{ padding: '10px 18px', background: '#2563eb' }}
          >
            <Play size={15} />
            <span>{triggering ? 'Pulling Data...' : '⚡ Trigger Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Main Schedule Table Card */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Line Availability Pulling Windows</h2>
            <p className="panel-desc">
              Define the exact start and end times during which the backend is authorized to pull data from the shop floor PC.
            </p>
          </div>

          <button onClick={openAddModal} className="btn-primary">
            <Plus size={16} />
            <span>Add New Pulling Window</span>
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Window Name</th>
              <th>Allowed Time Range</th>
              <th>Duration</th>
              <th>Description / Purpose</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading schedule configuration...
                </td>
              </tr>
            ) : schedule.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No active windows defined. Click "Add New Pulling Window" to configure one.
                </td>
              </tr>
            ) : (
              schedule.map((w) => {
                const [sh, sm] = w.startTime.split(':').map(Number);
                const [eh, em] = w.endTime.split(':').map(Number);
                const durationMin = (eh * 60 + em) - (sh * 60 + sm);

                return (
                  <tr key={w.id}>
                    <td style={{ width: '80px' }}>
                      <button
                        onClick={() => handleToggleEnabled(w)}
                        title={w.enabled ? 'Click to pause this window' : 'Click to enable this window'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Power size={16} color={w.enabled ? '#10b981' : '#94a3b8'} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: w.enabled ? '#047857' : '#94a3b8' }}>
                          {w.enabled ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </button>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{w.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {w.id}</div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#2563eb',
                          background: '#eff6ff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          fontFamily: 'monospace'
                        }}>
                          {w.startTime} — {w.endTime}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="badge-blue">
                        <Clock size={12} /> {durationMin > 0 ? `${durationMin} mins` : 'Instant'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '13px', color: '#475569' }}>
                        {w.description || 'Production break / line stop'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(w)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Edit Window Time"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteWindow(w.id, w.name)}
                          className="btn-danger"
                          title="Delete Window"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                {editingId ? 'Edit Pulling Window' : 'Add New Line Pulling Window'}
              </h3>
              <button
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWindow}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Window Label / Name
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Afternoon Tea Break, Conveyor Stop, Lunch"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                      Start Time (24h)
                    </label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                      End Time (24h)
                    </label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Operational Description
                  </label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Scheduled morning break. Conveyor halted."
                  />
                </div>

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
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Window Enabled</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>If enabled, worker triggers during this period</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
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
                  <span>{saving ? 'Saving...' : 'Save Window'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
