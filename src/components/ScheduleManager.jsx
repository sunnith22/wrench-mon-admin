import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
  Save,
  ShieldCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
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
      showToast('Error loading schedule: ' + (err.response?.data?.message || err.message), 'error');
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
      startTime: '11:15',
      endTime: '11:25',
      enabled: true,
      description: 'Scheduled conveyor stop or tea break'
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
    if (!window.confirm(`Are you sure you want to remove the window "${name}"?`)) return;
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
      {/* Manual Trigger & Immediate Sync Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: syncStatus?.isRunning ? '#f59e0b' : '#10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Dynamic Scheduler Status: {syncStatus?.isRunning ? 'ACTIVE EXTRACTION IN PROGRESS' : 'ONLINE & MONITORING'}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {syncStatus?.lastSync?.timestamp ? (
              <span>Last Sync: <strong>{new Date(syncStatus.lastSync.timestamp).toLocaleTimeString()}</strong> ({syncStatus.lastSync.windowName}) • Stored: <strong>{syncStatus.lastSync.totalFetched} cycles</strong></span>
            ) : (
              <span>Ready for next scheduled availability window</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={openAddModal}
            className="btn btn-secondary"
          >
            <Plus size={15} />
            <span>Add Pulling Window</span>
          </button>

          <button
            onClick={handleTriggerSyncNow}
            disabled={triggering || syncStatus?.isRunning}
            className="btn btn-primary"
            style={{ padding: '10px 18px', background: '#2563eb' }}
          >
            <Zap size={15} />
            <span>{triggering ? 'Pulling Data...' : '⚡ Trigger Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Active Windows Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {schedule.map((w) => {
          const [sh, sm] = w.startTime.split(':').map(Number);
          const [eh, em] = w.endTime.split(':').map(Number);
          const durationMin = (eh * 60 + em) - (sh * 60 + sm);

          return (
            <div
              key={w.id}
              className="card"
              style={{
                position: 'relative',
                borderLeft: w.enabled ? '4px solid #2563eb' : '4px solid #cbd5e1',
                background: w.enabled ? '#ffffff' : '#fcfdfe'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    {w.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {w.description || 'Production break / line stop'}
                  </div>
                </div>

                {/* Enable/Disable Switch */}
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={w.enabled}
                    onChange={() => handleToggleEnabled(w)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Time Badge Box */}
              <div style={{
                background: w.enabled ? '#eff6ff' : '#f1f5f9',
                border: w.enabled ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color={w.enabled ? '#2563eb' : '#64748b'} />
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    color: w.enabled ? '#1e40af' : '#64748b'
                  }}>
                    {w.startTime} — {w.endTime}
                  </span>
                </div>
                <span className="badge badge-blue">
                  {durationMin > 0 ? `${durationMin} mins` : 'Instant'}
                </span>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', color: w.enabled ? '#10b981' : '#94a3b8', fontWeight: '600' }}>
                  {w.enabled ? '● Active in scheduler' : '○ Paused'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(w)}
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteWindow(w.id, w.name)}
                    className="btn btn-danger"
                    style={{ padding: '5px 8px' }}
                    title="Delete Window"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {editingId ? 'Edit Pulling Window Time' : 'Add New Line Pulling Window'}
              </h3>
              <button onClick={closeModal} className="btn-ghost">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWindow}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Window Name / Label
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Afternoon Tea Break, Conveyor Stop, Lunch"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      Start Time (24h)
                    </label>
                    <input
                      type="time"
                      required
                      className="input-field"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      End Time (24h)
                    </label>
                    <input
                      type="time"
                      required
                      className="input-field"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Operational Reason / Notes
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Scheduled morning tea break. Conveyor line halted."
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Active in Scheduler</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>If enabled, worker triggers extraction inside this range</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
