import React from 'react';
import { ShieldCheck, Calendar, Sliders, Mail, FileText, ExternalLink, LogOut } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <header className="admin-header">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="brand-title">TNGA Wrench Admin Portal</div>
          <div className="brand-subtitle">Pulse Limits & Schedule Controller</div>
        </div>
      </div>

      <nav className="admin-nav">
        <button
          className={`nav-tab-btn ${activeTab === 'thresholds' ? 'active' : ''}`}
          onClick={() => setActiveTab('thresholds')}
        >
          <Sliders size={16} />
          <span>Pulse Count Limits</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={16} />
          <span>Pulling Time Schedule</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail size={16} />
          <span>Email Alert Triggers</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <FileText size={16} />
          <span>Audit Logs</span>
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a
          href="http://localhost:3010"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ textDecoration: 'none', padding: '7px 12px', fontSize: '12px' }}
        >
          <span>Open Main Dashboard</span>
          <ExternalLink size={14} />
        </a>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '12px',
          borderLeft: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#e0e7ff',
            color: '#3730a3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            A
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
            {user?.username || 'Admin'}
          </span>

          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
