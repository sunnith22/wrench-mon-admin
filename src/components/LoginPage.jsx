import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        localStorage.setItem('tnga_admin_token', res.data.token);
        localStorage.setItem('tnga_admin_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '420px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: 'white',
          padding: '28px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
          }}>
            <ShieldCheck size={26} color="white" />
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>
            TNGA Admin Control Center
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
            Impact Wrench Pulse & Schedule Management
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 24px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                required
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center'
          }}>
            Default Credentials: <strong>admin</strong> / <strong>admin123</strong>
          </div>
        </form>
      </div>
    </div>
  );
}
