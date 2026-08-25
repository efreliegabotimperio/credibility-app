import { RoleBadge } from './SopCard';

export default function ResultCard({ sop, onSave, onDiscard, isSaving }) {
  const isEdit = sop.type === 'edit';

  return (
    <section className="result-section" aria-label="Generated Result">
      <div className="result-card" id="result-card">

        {/* ── Header ── */}
        <div className="result-header">
          <h2 className="result-title">{sop.title}</h2>
          {!isEdit && <RoleBadge role={sop.owner_role} />}
          {isEdit && (
            <span className="edit-badge">✏️ Credibility Edit</span>
          )}
        </div>

        {/* ── Edit result: show rewritten text ── */}
        {isEdit ? (
          <div className="edit-result-body">
            <p className="steps-label">Your edited text</p>
            <div className="edited-text-block">
              {sop.edited_text.split('\n').map((line, i) => (
                line.trim() === ''
                  ? <br key={i} />
                  : <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ) : (
          /* ── SOP result: show numbered steps ── */
          <>
            <p className="steps-label">Steps</p>
            <ol className="steps-list">
              {sop.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <p className="why-not-you">{sop.why_not_you}</p>
          </>
        )}

        <div className="result-footer">
          <button id="btn-save-sop" className="btn btn-primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save to my library'}
          </button>
          <button id="btn-discard-sop" className="btn btn-ghost" onClick={onDiscard} disabled={isSaving}>
            Discard
          </button>
        </div>
      </div>
    </section>
  );
}
