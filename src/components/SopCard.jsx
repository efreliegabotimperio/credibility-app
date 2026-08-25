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

export default function SopCard({ sop, index }) {
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
          <RoleBadge role={sop.owner_role} size="small" />
          <span className="sop-card-title">{sop.title}</span>
        </div>
        <span className={`sop-card-chevron${open ? ' open' : ''}`}>
          &#8964;
        </span>
      </div>

      {open && (
        <div className="sop-card-body">
          <div className="sop-card-meta">
            Saved {sop.created_at ? new Date(sop.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
          </div>
          <ol className="sop-steps-mini">
            {sop.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {sop.why_not_you && (
            <p className="sop-why-mini">{sop.why_not_you}</p>
          )}
        </div>
      )}
    </div>
  );
}
