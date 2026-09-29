import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { INITIAL_CHILD_PROFILE, LARI_WORDS, CULTURAL_STORIES } from './data/mockData';
import { UserRole, ChildProfile } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { Header } from './components/Header';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { Dashboard } from './components/Dashboard';
import { AudioLab } from './components/AudioLab';
import { KokoGames } from './components/KokoGames';
import { Dictionary } from './components/Dictionary';
import { BakuluHeritage } from './components/BakuluHeritage';
import { FamilyChallenges } from './components/FamilyChallenges';
import { SchoolDashboard } from './components/SchoolDashboard';
import { AdminSubscriptionsDashboard } from './components/AdminSubscriptionsDashboard';
import { LessonModal } from './components/LessonModal';
import { ParentalPinModal } from './components/ParentalPinModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { BookOpen, Mic, Volume2, Users, GraduationCap, Sparkles, Gamepad2, Shield, Scale, ShieldCheck } from 'lucide-react';
import { playSuccessChime } from './utils/audio';
import { registerServiceWorker, isOnline as checkIsOnline, addNetworkStatusListener, syncPendingProgressWithBackend } from './utils/pwa';
import {
  initOfflineDB,
  saveOfflineWords,
  saveOfflineStories,
  queueOfflineProgress,
  getPendingSyncQueue,
  saveLocalChildState,
  getLocalChildState
} from './utils/offlineStorage';
import { lessonsAPI } from './services/api';

export type ActiveTab = 'landing' | 'dashboard' | 'audiolab' | 'games' | 'dictionary' | 'heritage' | 'family' | 'school' | 'admin';

// Helper to get initial tab from URL hash (#dictionary) or query param (?tab=dictionary)
const getInitialTab = (): ActiveTab => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['landing', 'dashboard', 'audiolab', 'games', 'dictionary', 'heritage', 'family', 'school', 'admin'].includes(hash)) {
      return hash as ActiveTab;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam && ['landing', 'dashboard', 'audiolab', 'games', 'dictionary', 'heritage', 'family', 'school', 'admin'].includes(tabParam)) {
      return tabParam as ActiveTab;
    }
    // If user already used app directly, go to dashboard
    try {
      if (localStorage.getItem('mwana_direct_app') === 'true') {
        return 'dashboard';
      }
    } catch {}
  }
  return 'landing';
};

function MwanaLariApp() {
  const { user, activeChild, activeRole, updateActiveChildStats, isParentUnlocked } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [isOnline, setIsOnline] = useState<boolean>(checkIsOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [customRole, setCustomRole] = useState<UserRole | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isParentalPinModalOpen, setIsParentalPinModalOpen] = useState<boolean>(false);
  const [pendingTabTarget, setPendingTabTarget] = useState<ActiveTab | null>(null);
  const [pendingRoleTarget, setPendingRoleTarget] = useState<UserRole | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

  const currentRole = customRole || activeRole;

  // Auto-redirect if non-admin tries to access admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
      if (window.location.hash.replace('#', '').toLowerCase() === 'admin') {
        window.location.hash = '';
      }
    }
  }, [isAdmin, activeTab]);

  // Listen to browser hash changes (e.g. #dictionary or #landing)
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '').toLowerCase();
      if (['landing', 'dashboard', 'audiolab', 'games', 'dictionary', 'heritage', 'family', 'school', 'admin'].includes(currentHash)) {
        if (currentHash === 'admin' && !isAdmin) {
          setActiveTab('dashboard');
          return;
        }
        if ((currentHash === 'family' || currentHash === 'school' || currentHash === 'admin') && !isParentUnlocked) {
          setPendingTabTarget(currentHash as ActiveTab);
          setIsParentalPinModalOpen(true);
        } else {
          setActiveTab(currentHash as ActiveTab);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isParentUnlocked, isAdmin]);

  // Initialize PWA, Service Worker, and IndexedDB cache
  useEffect(() => {
    // 1. Register Service Worker with Auto-Update Callback
    registerServiceWorker(() => {
      setIsUpdateAvailable(true);
    });

    // 2. Setup network listener
    const unsubscribe = addNetworkStatusListener((online) => {
      setIsOnline(online);
      refreshPendingSyncCount();
    });

    // 3. Initialize IndexedDB & Seed local cache non-blocking in background
    const setupLocalDatabase = async () => {
      try {
        await initOfflineDB();
        await saveOfflineWords(LARI_WORDS);
        await saveOfflineStories(CULTURAL_STORIES);
        
        // Restore local child state if previously saved
        const savedState = await getLocalChildState();
        if (savedState) {
          updateActiveChildStats({
            xpPoints: savedState.xp,
            streakDays: savedState.streak,
            level: savedState.level,
          });
        }

        refreshPendingSyncCount();
      } catch (err) {
        console.warn('Erreur initialisation IndexedDB:', err);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => setupLocalDatabase());
    } else {
      setTimeout(setupLocalDatabase, 300);
    }

    return () => unsubscribe();
  }, []);

  const refreshPendingSyncCount = async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingSyncCount(queue.length);
    } catch {
      setPendingSyncCount(0);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'landing') {
      setActiveTab('landing');
      window.location.hash = 'landing';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      localStorage.setItem('mwana_direct_app', 'true');
    } catch {}

    if (tab === 'admin' && !isAdmin) {
      return;
    }
    if ((tab === 'family' || tab === 'school' || tab === 'admin') && !isParentUnlocked) {
      setPendingTabTarget(tab);
      setIsParentalPinModalOpen(true);
      return;
    }
    playSuccessChime();
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEarnXp = async (amount: number, lessonId?: string) => {
    const newXp = activeChild.xpPoints + amount;
    const newLevel = Math.floor(newXp / 200) + 1;
    
    updateActiveChildStats({
      xpPoints: newXp,
      level: newLevel,
    });

    // Save to IndexedDB
    await saveLocalChildState({
      xp: newXp,
      level: newLevel,
      streak: activeChild.streakDays,
    });

    // If completed a lesson, record progress
    if (lessonId) {
      if (isOnline) {
        try {
          await lessonsAPI.submitProgress({
            childId: activeChild.id,
            lessonId,
            score: 100,
            xpEarned: amount,
          });
        } catch {
          await queueOfflineProgress({
            childId: activeChild.id,
            lessonId,
            score: 100,
            xpEarned: amount,
          });
          refreshPendingSyncCount();
        }
      } else {
        await queueOfflineProgress({
          childId: activeChild.id,
          lessonId,
          score: 100,
          xpEarned: amount,
        });
        refreshPendingSyncCount();
      }
    }
  };

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingProgressWithBackend();
    } finally {
      setIsSyncing(false);
      refreshPendingSyncCount();
    }
  };

  const handleRoleChange = (role: UserRole) => {
    if (role === 'ADMIN' && !isAdmin) {
      return;
    }
    if ((role === 'PARENT' || role === 'TEACHER' || role === 'ADMIN') && !isParentUnlocked) {
      setPendingRoleTarget(role);
      setIsParentalPinModalOpen(true);
      return;
    }
    setCustomRole(role);
    if (role === 'TEACHER') {
      handleTabChange('school');
    } else if (role === 'ELDER') {
      handleTabChange('heritage');
    } else if (role === 'PARENT') {
      handleTabChange('family');
    } else if (role === 'ADMIN') {
      handleTabChange('admin');
    } else {
      handleTabChange('dashboard');
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-savanna-100">
      
      {/* Network & Offline Status Banner (Instant feedback for offline mode & sync) */}
      <NetworkStatusBanner />

      {/* Auto-Update Notification Banner */}
      <UpdateNotificationBanner
        isUpdateAvailable={isUpdateAvailable}
        onDismiss={() => setIsUpdateAvailable(false)}
      />

      {activeTab === 'landing' ? (
        <LandingPage
          onStartLearning={() => handleTabChange('dashboard')}
          onNavigateTab={(tab) => handleTabChange(tab)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
          onOpenPwaModal={() => setIsPwaInstallModalOpen(true)}
          onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
          onOpenLegal={() => setIsLegalModalOpen(true)}
        />
      ) : (
        <>
          {/* Header Bar with PWA & Backend API status & Updates center */}
          <Header
            profile={activeChild}
            activeRole={currentRole}
            onRoleChange={handleRoleChange}
            isOnline={isOnline}
            pendingSyncCount={pendingSyncCount}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
            onOpenInstallPrompt={() => setIsPwaInstallModalOpen(true)}
            onLogoClick={() => handleTabChange('landing')}
          />

          {/* Navigation Tabs Subheader */}
          <nav className="bg-white/90 border-b border-brand-300 backdrop-blur-md sticky top-[60px] sm:top-[69px] z-40 px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-pan-x">
              
              <button
                id="nav-tab-landing"
                onClick={() => handleTabChange('landing')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 text-brand-900 bg-amber-100/80 hover:bg-amber-200 border border-brand-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Accueil / Site Vitrine</span>
              </button>

              <button
                id="nav-tab-dashboard"
                onClick={() => handleTabChange('dashboard')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-savanna-900 hover:bg-savanna-200/60'
                }`}
              >
                <span>🌳</span>
                <span>Académie & Parcours</span>
              </button>

              <button
                id="nav-tab-audiolab"
                onClick={() => handleTabChange('audiolab')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'audiolab'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-savanna-900 hover:bg-savanna-200/60'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Studio Audio</span>
              </button>

              <button
                id="nav-tab-games"
                onClick={() => handleTabChange('games')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'games'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-savanna-900 hover:bg-savanna-200/60'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                <span>Jeux de Koko (4)</span>
              </button>

              <button
                id="nav-tab-dictionary"
                onClick={() => handleTabChange('dictionary')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'dictionary'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300'
                    : 'text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span>Grand Dictionnaire (+500)</span>
              </button>

              <button
                id="nav-tab-heritage"
                onClick={() => handleTabChange('heritage')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'heritage'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-savanna-900 hover:bg-savanna-200/60'
                }`}
              >
                <span>👵</span>
                <span>Voix des Aînés</span>
              </button>

              <button
                id="nav-tab-family"
                onClick={() => handleTabChange('family')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'family'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-savanna-900 hover:bg-savanna-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Famille</span>
              </button>

              <button
                id="nav-tab-school"
                onClick={() => handleTabChange('school')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'school'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-savanna-900 hover:bg-savanna-200/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>École</span>
              </button>

              {isAdmin && (
                <button
                  id="nav-tab-admin"
                  onClick={() => handleTabChange('admin')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-extrabold text-[11px] sm:text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-brand-700 via-amber-600 to-terracotta-600 text-white shadow-md shadow-brand-500/30 ring-2 ring-amber-300'
                      : 'text-brand-900 bg-brand-50/90 hover:bg-brand-100 border border-brand-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  <span>Administration & Abonnements</span>
                </button>
              )}

            </div>
          </nav>

          {/* Main Content View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-4 sm:py-6">
            {activeTab === 'dashboard' && (
              <Dashboard
                profile={activeChild}
                onEarnXp={handleEarnXp}
                onNavigate={(tab) => handleTabChange(tab as ActiveTab)}
              />
            )}

            {activeTab === 'audiolab' && <AudioLab />}

            {activeTab === 'games' && (
              <KokoGames
                onEarnXp={handleEarnXp}
                onBackToDashboard={() => handleTabChange('dashboard')}
              />
            )}

            {activeTab === 'dictionary' && <Dictionary />}

            {activeTab === 'heritage' && <BakuluHeritage />}

            {activeTab === 'family' && <FamilyChallenges />}

            {activeTab === 'school' && <SchoolDashboard />}

            {activeTab === 'admin' && isAdmin && <AdminSubscriptionsDashboard />}
          </main>

          {/* Footer */}
          <footer className="glass-card border-t border-brand-300 py-6 px-4 text-center text-xs text-savanna-800 space-y-3 mt-12">
            <div className="font-extrabold text-brand-800 text-sm">
              🇨🇬 Mwana Lari — EdTech & Patrimoine Linguistique
            </div>
            <p className="max-w-xl mx-auto font-medium">
              « Apprendre sa langue. Comprendre ses racines. Préparer son avenir. »
            </p>
            
            {/* Compliance & Privacy Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-savanna-800 pt-1 border-t border-brand-200/60 max-w-lg mx-auto">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:text-brand-700 underline decoration-brand-400 transition-colors flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-forest-600" />
                <span>Vie Privée & Données Mineurs (Loi n° 29-2019)</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setIsLegalModalOpen(true)}
                className="hover:text-brand-700 underline decoration-brand-400 transition-colors flex items-center gap-1"
              >
                <Scale className="w-3 h-3 text-amber-700" />
                <span>Mentions Légales & Sécurité (RFC 9116)</span>
              </button>
            </div>

            <div className="text-[11px] text-savanna-700 font-semibold flex items-center justify-center gap-2">
              <span>Propulsé par Mwana Languages SaaS Platform</span>
              <span>•</span>
              <span className="text-forest-700 font-bold">Mises à jour automatiques PWA actives (v2.1)</span>
            </div>
          </footer>
        </>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Parental Gate PIN Modal for Protected Tabs & Role Switches */}
      <ParentalPinModal
        isOpen={isParentalPinModalOpen}
        onClose={() => {
          setIsParentalPinModalOpen(false);
          setPendingTabTarget(null);
          setPendingRoleTarget(null);
        }}
        onSuccess={() => {
          if (pendingTabTarget) {
            playSuccessChime();
            setActiveTab(pendingTabTarget);
            window.location.hash = pendingTabTarget;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPendingTabTarget(null);
          }
          if (pendingRoleTarget) {
            setCustomRole(pendingRoleTarget);
            if (pendingRoleTarget === 'TEACHER') handleTabChange('school');
            else if (pendingRoleTarget === 'PARENT') handleTabChange('family');
            else if (pendingRoleTarget === 'ELDER') handleTabChange('heritage');
            else if (pendingRoleTarget === 'ADMIN') handleTabChange('admin');
            setPendingRoleTarget(null);
          }
        }}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Legal Notice & Security Modal */}
      <LegalNoticeModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* PWA Native Installation Prompt & Guide Modal */}
      <PWAInstallPrompt
        forceOpen={isPwaInstallModalOpen}
        onClose={() => setIsPwaInstallModalOpen(false)}
      />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MwanaLariApp />
    </AuthProvider>
  );
}

export default App;
