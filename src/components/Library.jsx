import SopCard from './SopCard';

export default function Library({ sops, onDownload, isLoggedIn, onDelete }) {
  const count = sops.length;

  function handleDownloadJSON() {
    const blob = new Blob([JSON.stringify(sops, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sop-library.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadText() {
    const lines = sops.map((sop, i) => {
      if (sop.type === 'edit') {
        return `─────────────────────────────────────\n${i + 1}. ${sop.title}\nType: Edit\n\nEdited Text:\n${sop.edited_text}`;
      } else {
        const steps = (sop.steps || []).map((s, j) => `  ${j + 1}. ${s}`).join('\n');
        return `─────────────────────────────────────\n${i + 1}. ${sop.title}\nOwner: ${sop.owner_role || 'N/A'}\n\nSteps:\n${steps}\n\nWhy not you:\n  ${sop.why_not_you || 'N/A'}`;
      }
    });
    const content = `SOP LIBRARY\nExported ${new Date().toLocaleDateString()}\n\n${lines.join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sop-library.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="library-section" id="sop-library" aria-label="SOP Library">
      <div className="library-counter">
        <h2>
          You&apos;ve written{' '}
          <span className="count-num">{count}</span>{' '}
          {count === 1 ? 'edit' : 'edits'}
        </h2>
        <p className="library-sub">
          {count === 0
            ? 'Your library is empty. The first one is the hardest.'
            : `${count} ${count === 1 ? 'thing' : 'things'} that no longer ${count === 1 ? 'has' : 'have'} to live in your head.`}
        </p>
      </div>

      {count > 0 && (
        <>
          <div className="library-download-row">
            {isLoggedIn ? (
              <>
                <button
                  id="btn-download-txt"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadText}
                  style={{ marginRight: 8 }}
                >
                  ↓ Download as Text
                </button>
                <button
                  id="btn-download-json"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadJSON}
                >
                  ↓ Download as JSON
                </button>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--taupe)', fontStyle: 'italic' }}>
                Log in to download your library
              </span>
            )}
          </div>

          <div className="sop-list">
            {sops.map((sop, i) => (
              <SopCard key={sop.id} sop={sop} index={i} onDelete={() => onDelete(sop.id)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
