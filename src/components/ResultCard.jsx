import { RoleBadge } from './SopCard';

export default function ResultCard({ sop, onSave, onDiscard }) {
  return (
    <section className="result-section" aria-label="Generated SOP">
      <div className="result-card" id="result-card">
        <div className="result-header">
          <h2 className="result-title">{sop.title}</h2>
          <RoleBadge role={sop.owner_role} />
        </div>

        <p className="steps-label">Steps</p>
        <ol className="steps-list">
          {sop.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <p className="why-not-you">{sop.why_not_you}</p>

        <div className="result-footer">
          <button id="btn-save-sop" className="btn btn-primary" onClick={onSave}>
            Save to my library
          </button>
          <button id="btn-discard-sop" className="btn btn-ghost" onClick={onDiscard}>
            Discard
          </button>
        </div>
      </div>
    </section>
  );
}
