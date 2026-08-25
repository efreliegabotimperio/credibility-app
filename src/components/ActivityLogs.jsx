import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function ActivityLogs({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    setError('');
    
    // 1. Fetch the activity logs that this user is allowed to see
    const { data: activityData, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (activityError) {
      console.error("Error fetching logs:", activityError);
      setError("Failed to load activity logs.");
      setLoading(false);
      return;
    }

    // 2. Fetch profiles so we can show names instead of just UUIDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name');

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // 3. Map the names to the logs
    const mappedLogs = activityData.map(log => {
      const userProfile = profiles?.find(p => p.id === log.user_id);
      const name = userProfile?.first_name 
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() 
        : (userProfile?.email || 'Unknown User');
        
      return {
        ...log,
        userName: name
      };
    });

    setLogs(mappedLogs);
    setLoading(false);
  }

  // Helper to format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box modal-box-fixed" role="dialog" aria-modal="true" style={{ maxWidth: '800px', width: '100%' }}>
        
        <div className="modal-header">
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
          <h2 className="modal-title">Activity Logs</h2>
          <div className="modal-header-actions">
            <p className="modal-sub">
              History of actions performed in the system.
            </p>
            <input
              type="text"
              className="form-input"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-content">

        {error && (
          <div className="error-banner" role="alert" style={{ marginBottom: 12 }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Date & Time</th>
                  <th style={{ padding: '12px 8px' }}>User</th>
                  <th style={{ padding: '12px 8px' }}>Action</th>
                  <th style={{ padding: '12px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td data-label="Date & Time" style={{ padding: '12px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td data-label="User" style={{ padding: '12px 8px', fontWeight: '500' }}>
                      {log.userName}
                    </td>
                    <td data-label="Action" style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: '#f3f4f6', 
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td data-label="Details" style={{ padding: '12px 8px', color: '#4b5563' }}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
                {currentLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      No activity logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredLogs.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
