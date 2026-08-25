import { useState } from 'react';

const ROLE_CLASSES = {
  'General VA':          'role-va',
  'Tech VA':             'role-tech',
  'Bookkeeper':          'role-book',
  'Social Media VA':     'role-social',
  'Customer Service VA': 'role-cs',
  'Executive Assistant': 'role-ea',
  'Specialist':          'role-spec',
};

const ROLE_ICONS = {
  'General VA':          '👤',
  'Tech VA':             '💻',
  'Bookkeeper':          '📊',
  'Social Media VA':     '📱',
  'Customer Service VA': '💬',
  'Executive Assistant': '📋',
  'Specialist':          '⭐',
};

export function RoleBadge({ role, size = 'normal' }) {
  const cls = ROLE_CLASSES[role] || '';
  const icon = ROLE_ICONS[role] || '👤';
  return (
    <span className={`owner-badge ${cls}`} style={size === 'small' ? { fontSize: '11px', padding: '4px 10px' } : {}}>
      <span className="owner-badge-icon">{icon}</span>
      {role}
    </span>
  );
}

export default function SopCard({ sop, index, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sop-card">
      <div
        className="sop-card-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        id={`sop-card-${index}`}
      >
        <div className="sop-card-left">
          {sop.type !== 'edit' && <RoleBadge role={sop.owner_role} size="small" />}
          {sop.type === 'edit' && <span className="owner-badge" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg-surface)', color: 'var(--taupe)', border: '1px solid var(--border)' }}>✏️ Edit</span>}
          <span className="sop-card-title">{sop.title}</span>
        </div>
        <span className={`sop-card-chevron${open ? ' open' : ''}`}>
          &#8964;
        </span>
      </div>

      {open && (
        <div className="sop-card-body">
          <div className="sop-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Saved {sop.created_at ? new Date(sop.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
            {onDelete && (
              <button 
                onClick={onDelete}
                className="btn btn-ghost" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', height: 'auto', minHeight: 'auto' }}
              >
                Delete
              </button>
            )}
          </div>
          {sop.type === 'edit' ? (
            <div className="edited-text-block" style={{ marginTop: '16px', background: 'var(--bg-surface)', borderLeft: '3px solid var(--accent)', padding: '16px', borderRadius: '4px', fontSize: '14px', color: 'var(--brown)', lineHeight: '1.6' }}>
              {(sop.edited_text || '').split('\n').map((line, i) => (
                line.trim() === '' ? <br key={i} /> : <p key={i} style={{ margin: '0 0 8px 0' }}>{line}</p>
              ))}
            </div>
          ) : (
            <>
              <ol className="sop-steps-mini">
                {(sop.steps || []).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {sop.why_not_you && (
                <p className="sop-why-mini">{sop.why_not_you}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
