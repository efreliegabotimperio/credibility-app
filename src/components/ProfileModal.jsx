import { useState } from 'react';
import { supabase } from '../supabase';

export default function ProfileModal({ currentUser, onClose }) {
  const [firstName, setFirstName] = useState(currentUser?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(currentUser?.user_metadata?.last_name || '');
  const [middleName, setMiddleName] = useState(currentUser?.user_metadata?.middle_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName || !lastName) {
      setError('First and Last name are required.');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setError('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    if (newPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
      });
      if (signInError) {
        setLoading(false);
        setError('Current password is incorrect.');
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({
      ...(newPassword && { password: newPassword }),
      data: {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
      }
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      // Log the activity
      await supabase.from('activity_logs').insert({
        user_id: currentUser.id,
        action: 'Updated Profile',
        details: 'User updated their profile information.'
      });

      setSuccess('Profile updated successfully!');
      setTimeout(onClose, 1000);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        <h2 className="modal-title" id="profile-modal-title">
          Edit Profile
        </h2>
        <p className="modal-sub">
          Update your personal information.
        </p>

        <form onSubmit={handleUpdate} id="profile-form">
          <div className="form-group">
            <label className="form-label" htmlFor="profile-first-name">First Name</label>
            <input
              id="profile-first-name"
              type="text"
              className="form-input"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-middle-name">Middle Name (Optional)</label>
            <input
              id="profile-middle-name"
              type="text"
              className="form-input"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              autoComplete="additional-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-last-name">Last Name</label>
            <input
              id="profile-last-name"
              type="text"
              className="form-input"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>

          <div style={{ height: 1, background: 'var(--linen-mid)', margin: '16px 0' }} />

          <div className="form-group">
            <label className="form-label" htmlFor="profile-current-password">Current Password (to change password)</label>
            <input
              id="profile-current-password"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profile-new-password">New Password</label>
            <input
              id="profile-new-password"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
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
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 10, padding: '14px' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
