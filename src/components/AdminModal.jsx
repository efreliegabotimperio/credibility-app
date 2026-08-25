import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      setFetching(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'OPENAI_API_KEY')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means zero rows, which is fine initially.
        console.error("Error fetching settings:", error);
      } else if (data) {
        setApiKey(data.value);
      }
      setFetching(false);
    }
    fetchSettings();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'OPENAI_API_KEY', value: apiKey, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        <h2 className="modal-title" id="admin-modal-title">
          Superadmin Settings
        </h2>
        <p className="modal-sub">
          Configure application-wide settings.
        </p>

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : (
          <form onSubmit={handleSave} id="admin-form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-openai-key">OpenAI API Key</label>
              <input
                id="admin-openai-key"
                type="password"
                className="form-input"
                placeholder="sk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <small style={{ display: 'block', marginTop: '4px', color: 'var(--taupe)', fontSize: '0.8rem' }}>
                This key will be securely used by Edge Functions for all users.
              </small>
            </div>

            {error && (
              <div className="error-banner" role="alert" style={{ marginBottom: 12 }}>
                <span>⚠</span><span>{error}</span>
              </div>
            )}
            {message && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 12 }}>
                ✓ {message}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 10, padding: '14px' }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
