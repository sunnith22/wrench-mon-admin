import React, { useState } from 'react';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  KeyRound
} from 'lucide-react';
import api from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot / Reset Password state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const getApiErrorMessage = (err, fallback) => {
    if (!err.response) {
      return `Cannot reach Backend API on port 8143 (${err.message}). Make sure the backend server is running.`;
    }
    return err.response?.data?.message || fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        localStorage.setItem('tnga_admin_token', res.data.token);
        localStorage.setItem('tnga_admin_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid administrator credentials. Please check username and password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await api.post('/auth/forgot-password');
      if (res.data.success) {
        setInfoMessage(res.data.message);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('reset');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send OTP email. Check backend logs or SMTP configuration.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { otp: otp.trim(), newPassword });
      if (res.data.success) {
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setInfoMessage(res.data.message || 'Password updated in .env. Please sign in with your new password.');
        setMode('login');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'OTP verification failed. Please check the 6-digit code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (targetMode) => {
    setError(null);
    setInfoMessage(null);
    setMode(targetMode);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #f1f5f9 0%, #e2e8f0 100%)',
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '440px',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          padding: '32px 28px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '8px 18px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)'
          }}>
            <img
              src="/tiei-logo.png"
              alt="TIEI Logo"
              style={{
                height: '26px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>
            TNGA Admin Control Center
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
            Toyota Industries Engine India • Line Management Portal
          </p>
        </div>

        {/* Form Area */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{infoMessage}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Administrator Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="text"
                    required
                    className="input-field"
                    style={{ paddingLeft: '38px', height: '40px' }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#2563eb',
                      cursor: 'pointer'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field"
                    style={{ paddingLeft: '38px', paddingRight: '38px', height: '40px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '11px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px' }}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>Sign In to Admin Console</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleRequestOtp}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#334155',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  <Mail size={16} color="#2563eb" />
                  <span>Reset Admin Password via Email OTP</span>
                </div>
                <p style={{ margin: 0 }}>
                  A 6-digit One-Time Password (OTP) will be sent to the default recovery mail ID:
                </p>
                <div style={{ marginTop: '8px', fontWeight: '700', color: '#1e293b', fontFamily: 'monospace', fontSize: '13px' }}>
                  g.sunnith@tiei.toyota-industries.com
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', marginBottom: '12px' }}
              >
                {loading ? 'Sending OTP...' : (
                  <>
                    <Mail size={16} />
                    <span>Send OTP to Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  6-Digit Email OTP
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    className="input-field"
                    style={{ paddingLeft: '38px', height: '40px', letterSpacing: '3px', fontWeight: '700' }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input-field"
                    style={{ paddingLeft: '38px', paddingRight: '38px', height: '40px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '11px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input-field"
                    style={{ paddingLeft: '38px', height: '40px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', marginBottom: '12px' }}
              >
                {loading ? 'Updating Password...' : (
                  <>
                    <span>Verify OTP & Reset Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '4px 0',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestOtp}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '4px 0',
                    cursor: 'pointer'
                  }}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
