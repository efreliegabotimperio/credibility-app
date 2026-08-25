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

  // Listen to Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) checkRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id);
      } else {
        setUserRole('owner');
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
    if (!pendingSop) return;
    
    if (!currentUser) {
      setShowAuth(true);
      return;
    }

    const { data, error } = await supabase
      .from('sops')
      .insert([
        {
          title: pendingSop.sop.title,
          owner_role: pendingSop.sop.owner_role,
          steps: pendingSop.sop.steps,
          why_not_you: pendingSop.sop.why_not_you,
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
  }

  function handleDiscard() {
    setPendingSop(null);
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
              <button id="btn-open-auth" className="btn btn-secondary btn-sm" onClick={() => setShowAuth(true)}>
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
            'Document how I onboard a new client.',
            'Write the steps for our weekly content review.',
            'Turn my daily opening routine into an SOP.',
            'Help me document my invoicing process.',
          ].map((prompt, i) => (
            <button
              key={i}
              className="prompt-card"
              onClick={() => document.getElementById('capture-textarea')?.focus()}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Capture */}
        <CaptureForm
          onResult={handleResult}
        />

        {/* Result */}
        {pendingSop && (
          <ResultCard
            sop={pendingSop.sop}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        )}

        <div className="divider" />

        {/* Library */}
        <Library
          sops={sops}
          isLoggedIn={!!currentUser}
        />
      </main>

      {/* ─── Auth Modal ──────────────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
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
