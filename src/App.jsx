import { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import CaptureForm from './components/CaptureForm';
import ResultCard from './components/ResultCard';
import Library from './components/Library';
import AdminModal from './components/AdminModal';
import UserManagement from './components/UserManagement';
import ActivityLogs from './components/ActivityLogs';
import { supabase } from './supabase';
import './index.css';

// Toast component
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="saved-toast" role="status">
      <span>✓</span>
      <span>{message}</span>
    </div>
  );
}

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [userRole, setUserRole] = useState('owner'); // 'owner', 'admin', 'superadmin'

  // SOP state
  const [sops, setSops] = useState([]);
  const [pendingSop, setPendingSop] = useState(null); // { sop, rawText }

  // UI state
  const [toast, setToast] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [isSavingSop, setIsSavingSop] = useState(false);

  // Listen to Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) checkRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id);
      } else {
        setUserRole('owner');
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
        setShowAuth(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkRole(userId) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setUserRole(data.role);
    } else {
      if (error) console.error("Error fetching role:", error);
      setUserRole('owner');
    }
  }

  // Fetch SOPs when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchSops();
    } else {
      setSops([]); // Clear on logout
    }
  }, [currentUser]);

  async function fetchSops() {
    const { data, error } = await supabase
      .from('sops')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setSops(data);
    } else if (error) {
      console.error("Error fetching SOPs:", error);
    }
  }

  function handleResult(sop, rawText) {
    setPendingSop({ sop, rawText });
    // Scroll to result
    setTimeout(() => {
      document.getElementById('result-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  async function handleSave() {
    if (!pendingSop || isSavingSop) return;
    
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    setIsSavingSop(true);

    const { data, error } = await supabase
      .from('sops')
      .insert([
        {
          title: pendingSop.sop.title,
          owner_role: pendingSop.sop.owner_role,
          steps: pendingSop.sop.steps,
          why_not_you: pendingSop.sop.why_not_you,
          type: pendingSop.sop.type,
          edited_text: pendingSop.sop.edited_text,
          user_id: currentUser.id
        }
      ])
      .select();

    if (error) {
      console.error("Error saving SOP:", error);
      setToast('Error saving SOP.');
    } else if (data) {
      setSops(prev => [data[0], ...prev]);
      setPendingSop(null);
      
      // Log the activity
      await supabase.from('activity_logs').insert({
        user_id: currentUser.id,
        action: 'Created SOP',
        details: `Created SOP for ${pendingSop.sop.title}`
      });

      setToast('SOP saved to your library!');
      setTimeout(() => {
        document.getElementById('sop-library')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
    
    setIsSavingSop(false);
  }

  function handleDiscard() {
    setPendingSop(null);
  }

  async function handleDeleteSop(id) {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    
    const { error } = await supabase.from('sops').delete().eq('id', id);
    if (error) {
      console.error("Error deleting SOP:", error);
      setToast("Error deleting item.");
    } else {
      setSops(prev => prev.filter(sop => sop.id !== id));
      setToast("Item deleted.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app-wrapper">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-logo">The Credibility<span> Edit</span></div>
        <div className="header-right">
          <span className="header-tagline">Your business, written down.</span>
          <div className="header-auth">
            {currentUser ? (
              <>
                {(userRole === 'admin' || userRole === 'superadmin') && (
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setShowUserManagement(true)}
                    title="Manage Users"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                  >
                    👥 <span className="hide-mobile">Users</span>
                  </button>
                )}
                {userRole === 'superadmin' && (
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setShowAdmin(true)}
                    title="Admin Settings"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                  >
                    ⚙️ <span className="hide-mobile">Settings</span>
                  </button>
                )}
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setShowActivityLogs(true)}
                  title="Activity Logs"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                >
                  📋 <span className="hide-mobile">Activity</span>
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setShowProfile(true)}
                  title="Edit Profile"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                >
                  👤 <span className="hide-mobile">{currentUser.user_metadata?.first_name 
                      ? currentUser.user_metadata.first_name 
                      : currentUser.email}</span>
                </button>
                <button id="btn-logout" className="btn btn-ghost" onClick={handleLogout} title="Log out" style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </>
            ) : (
              <button id="btn-open-auth" className="btn btn-secondary btn-sm" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>
                Log in / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────────────────────── */}
      <main className="main-content">
        {/* Hero section */}
        <div className="hero-section">
          <div className="hero-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="headline">The Credibility Edit</h1>
          <p className="hero-byline">By community builder <span className="byline-icon">👤</span></p>
          <p className="subheadline">
            A practical writing tool for business owners and team leads who want their processes documented clearly, step by step, and ready to delegate.
          </p>
        </div>

        {/* Prompt suggestion cards */}
        <div className="prompt-cards">
          {[
            'Rewrite this email so it sounds more confident and direct.',
            'Remove weak language from this message.',
            'Make this proposal easier to approve.',
            'Help me say this firmly without sounding harsh.',
          ].map((prompt, i) => (
            <button
              key={i}
              className={`prompt-card${selectedPrompt === prompt ? ' prompt-card--active' : ''}`}
              onClick={() => {
                setSelectedPrompt(prompt);
                setTimeout(() => {
                  const ta = document.getElementById('capture-textarea');
                  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
                }, 50);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Capture */}
        <CaptureForm
          onResult={handleResult}
          selectedPrompt={selectedPrompt}
          onPromptUsed={() => setSelectedPrompt('')}
          isLoggedIn={!!currentUser}
          onRequireAuth={() => { setAuthMode('login'); setShowAuth(true); }}
        />

        {/* Result */}
        {pendingSop && (
          <ResultCard
            sop={pendingSop.sop}
            onSave={handleSave}
            onDiscard={handleDiscard}
            isSaving={isSavingSop}
          />
        )}

        <div className="divider" />

        {/* Library */}
        <Library
          sops={sops}
          isLoggedIn={!!currentUser}
          onDelete={handleDeleteSop}
        />
      </main>

      {/* ─── Auth Modal ──────────────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onClose={() => { setShowAuth(false); setAuthMode('login'); }}
        />
      )}

      {/* ─── Profile Modal ───────────────────────────────────────────────────── */}
      {showProfile && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* ─── Admin Modal ─────────────────────────────────────────────────────── */}
      {showAdmin && (
        <AdminModal
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* ─── User Management Modal ───────────────────────────────────────────── */}
      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
          currentUserRole={userRole}
          currentUserId={currentUser?.id}
        />
      )}

      {/* ─── Activity Logs Modal ─────────────────────────────────────────────── */}
      {showActivityLogs && (
        <ActivityLogs
          onClose={() => setShowActivityLogs(false)}
        />
      )}

      {/* ─── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
