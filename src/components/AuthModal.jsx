import { useState } from 'react';
import { supabase } from '../supabase';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    
    if (!email || !password) { 
      setError('Please fill in all fields.'); 
      return; 
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email === 'super_admin' ? 'superadmin@example.com' : email,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      onClose();
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !firstName || !lastName) { 
      setError('Please fill in all required fields.'); 
      return; 
    }
    if (password.length < 6) { 
      setError('Password must be at least 6 characters.'); 
      return; 
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email === 'super_admin' ? 'superadmin@example.com' : email,
      password,
      options: {
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
        data: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
        }
      }
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created! Welcome.');
      setTimeout(onClose, 800);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        <h2 className="modal-title" id="auth-modal-title">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="modal-sub">
          {mode === 'login'
            ? 'Log in to access and download your SOP library.'
            : 'Register to save and download your SOPs across sessions.'}
        </p>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} id="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-first-name">First Name</label>
                <input
                  id="auth-first-name"
                  type="text"
                  className="form-input"
                  placeholder="Jane"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-middle-name">Middle Name (Optional)</label>
                <input
                  id="auth-middle-name"
                  type="text"
                  className="form-input"
                  placeholder="A."
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value)}
                  autoComplete="additional-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-last-name">Last Name</label>
                <input
                  id="auth-last-name"
                  type="text"
                  className="form-input"
                  placeholder="Doe"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email or Username</label>
            <input
              id="auth-email"
              type="text"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="error-banner" role="alert" style={{ marginBottom: 12 }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 12 }}>
              ✓ {success}
            </div>
          )}

          <div className="modal-actions">
            <button id="btn-auth-submit" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 10, padding: '14px' }} disabled={loading}>
              {loading ? 'Processing...' : (mode === 'login' ? 'Log in' : 'Create account')}
            </button>
          </div>
        </form>

        <div className="modal-switch">
          {mode === 'login' ? (
            <span>Don&apos;t have an account? <button id="btn-switch-register" onClick={() => { setMode('register'); setError(''); }}>Register</button></span>
          ) : (
            <span>Already have an account? <button id="btn-switch-login" onClick={() => { setMode('login'); setError(''); }}>Log in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
