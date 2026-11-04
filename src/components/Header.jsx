import React from 'react';
import { ShieldCheck, Calendar, Sliders, Mail, FileText, ExternalLink, LogOut, Activity } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <header className="top-navbar">
      {/* Brand Logo & Name */}
      <div className="brand-wrap">
        <div className="brand-badge">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="brand-name">
            <span>TNGA Impact Wrench</span>
            <span className="brand-pill">Admin Console</span>
          </div>
          <div className="brand-sub">Toyota Kirloskar Engine Production Line</div>
        </div>
      </div>

      {/* Modern Center Navigation Pills */}
      <nav className="nav-pills">
        <button
          className={`nav-pill ${activeTab === 'thresholds' ? 'active' : ''}`}
          onClick={() => setActiveTab('thresholds')}
        >
          <Sliders size={16} />
          <span>Pulse Count Limits</span>
        </button>

        <button
          className={`nav-pill ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={16} />
          <span>Pulling Times & Schedule</span>
        </button>

        <button
          className={`nav-pill ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail size={16} />
          <span>Email Alert Triggers</span>
        </button>

        <button
          className={`nav-pill ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <FileText size={16} />
          <span>Audit Trail</span>
        </button>
      </nav>

      {/* Right Side Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Safe Mode Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#065f46'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>Protected Shift Mode</span>
        </div>

        {/* Link to Main Monitoring Dashboard */}
        <a
          href="http://localhost:3010"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ padding: '7px 13px', fontSize: '12px', gap: '6px' }}
          title="Open the real-time operational dashboard in a new tab"
        >
          <span>Main Dashboard</span>
          <ExternalLink size={13} />
        </a>

        {/* User Pill & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '14px',
          borderLeft: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#e0e7ff',
            color: '#3730a3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
              {user?.username || 'admin'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Super Admin
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out of Admin Console"
            className="btn-ghost"
            style={{ marginLeft: '4px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
