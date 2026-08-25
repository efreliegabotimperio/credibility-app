import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function UserManagement({ onClose, currentUserRole, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const isSuperadmin = currentUserRole === 'superadmin';

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError('');
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error("Error fetching users:", profilesError);
      setError("Failed to load users.");
      setLoading(false);
      return;
    }

    // Fetch user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }

    // Combine them and filter out the current user
    const mapped = profiles
      .filter(u => u.id !== currentUserId)
      .map(u => {
        const userRole = roles?.find(r => r.user_id === u.id);
        return {
          ...u,
          role: userRole?.role || 'owner' // default to owner if missing
        };
      })
      // Hide superadmins from the list if the current user is only an admin
      .filter(u => isSuperadmin || u.role !== 'superadmin');

    setUsers(mapped);
    setLoading(false);
  }

  async function handleRoleChange(userId, currentRole, newRole) {
    // Admins cannot change superadmin roles, nor make someone a superadmin
    if (!isSuperadmin) {
      if (currentRole === 'superadmin') {
        alert("You cannot modify a superadmin's role.");
        return;
      }
      if (newRole === 'superadmin') {
        alert("You do not have permission to grant superadmin status.");
        return;
      }
    }

    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

    if (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role: " + error.message);
    } else {
      // Log the activity
      const updatedUser = users.find(u => u.id === userId);
      const updatedUserName = updatedUser?.first_name 
        ? `${updatedUser.first_name} ${updatedUser.last_name || ''}`.trim() 
        : (updatedUser?.email || 'Unknown user');
      
      await supabase.from('activity_logs').insert({
        user_id: currentUserId,
        action: 'Changed Role',
        details: `Changed role of ${updatedUserName} to ${newRole}`
      });

      setToast('Role updated successfully!');
      setTimeout(() => setToast(''), 2500);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box modal-box-fixed" role="dialog" aria-modal="true" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
          <h2 className="modal-title">Manage Users</h2>
          <p className="modal-sub">
            {isSuperadmin 
              ? "As a superadmin, you can view and modify all user roles." 
              : "As an admin, you can view users and promote/demote owners."}
          </p>
        </div>
        
        <div className="modal-content">
        {error && (
          <div className="error-banner" role="alert" style={{ marginBottom: 12 }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}
        
        {toast && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 12 }}>
            ✓ {toast}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading users...</div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>User</th>
                  <th style={{ padding: '12px 8px' }}>Email</th>
                  <th style={{ padding: '12px 8px' }}>Role</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td data-label="Name" style={{ padding: '12px 8px', fontWeight: '500' }}>
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}` : '-'}
                    </td>
                    <td data-label="Email" style={{ padding: '12px 8px', color: '#6b7280' }}>
                      {user.email}
                    </td>
                    <td data-label="Current Role" style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: '#f3f4f6', 
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td data-label="Action" style={{ padding: '12px 8px' }}>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, user.role, e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', height: 'auto', minHeight: '36px', fontSize: '0.85rem' }}
                        disabled={!isSuperadmin && user.role === 'superadmin'}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        {isSuperadmin && <option value="superadmin">Superadmin</option>}
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
