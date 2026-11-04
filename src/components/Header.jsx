import React from 'react';
import { Calendar, Sliders, Mail, FileText, ExternalLink, LogOut } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <header className="top-navbar">
      {/* Brand: TIEI Logo + Portal Title */}
      <div className="brand-wrap">
        <img
          src="/tiei-logo.png"
          alt="TIEI Logo"
          className="brand-logo-img"
        />
        <div className="brand-divider" />
        <div className="brand-title-group">
          <span className="brand-title">TNGA Admin Portal</span>
          <span className="brand-pill">Console</span>
        </div>
      </div>

      {/* Modern Center Navigation Tabs */}
      <nav className="nav-pills">
        <button
          className={`nav-pill ${activeTab === 'thresholds' ? 'active' : ''}`}
          onClick={() => setActiveTab('thresholds')}
          type="button"
        >
          <Sliders size={15} />
          <span>Pulse Limits</span>
        </button>

        <button
          className={`nav-pill ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
          type="button"
        >
          <Calendar size={15} />
          <span>Sync Schedule</span>
        </button>

        <button
          className={`nav-pill ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
          type="button"
        >
          <Mail size={15} />
          <span>Email Alerts</span>
        </button>

        <button
          className={`nav-pill ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
          type="button"
        >
          <FileText size={15} />
          <span>Audit Trail</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Protected Mode Badge */}
        <div className="status-badge" title="Line protection active - shop-floor polling restricted to scheduled shift windows">
          <span className="status-dot" />
          <span>Protected Mode</span>
        </div>

        {/* Link to Main Monitoring Dashboard */}
        <a
          href={typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : 'http://localhost:3010'}
          target="_blank"
          rel="noreferrer"
          className="btn-main-dashboard"
          title="Open real-time operational dashboard (Port 3010) in a new tab"
        >
          <span>Main Dashboard</span>
          <ExternalLink size={13} />
        </a>

        {/* Divider */}
        <div className="header-vdivider" />

        {/* User Pill & Logout */}
        <div className="user-profile-wrap">
          <div className="user-avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-meta">
            <span className="user-name">{user?.username || 'admin'}</span>
            <span className="user-role">Super Admin</span>
          </div>

          <button
            onClick={onLogout}
            title="Sign out of Admin Console"
            className="btn-logout"
            type="button"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
