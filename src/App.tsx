import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { INITIAL_CHILD_PROFILE, LARI_WORDS, CULTURAL_STORIES } from './data/mockData';
import { UserRole, ChildProfile } from './types';
import { Header } from './components/Header';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { Dashboard } from './components/Dashboard';
import { AudioLab } from './components/AudioLab';
import { Dictionary } from './components/Dictionary';
import { BakuluHeritage } from './components/BakuluHeritage';
import { FamilyChallenges } from './components/FamilyChallenges';
import { SchoolDashboard } from './components/SchoolDashboard';
import { KokoGames } from './components/KokoGames';
import { BookOpen, Mic, Volume2, Users, GraduationCap, Sparkles, Gamepad2 } from 'lucide-react';
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

export type ActiveTab = 'dashboard' | 'audiolab' | 'games' | 'dictionary' | 'heritage' | 'family' | 'school';

// Helper to get initial tab from URL hash (#dictionary) or query param (?tab=dictionary)
const getInitialTab = (): ActiveTab => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['dashboard', 'audiolab', 'games', 'dictionary', 'heritage', 'family', 'school'].includes(hash)) {
      return hash as ActiveTab;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam && ['dashboard', 'audiolab', 'games', 'dictionary', 'heritage', 'family', 'school'].includes(tabParam)) {
      return tabParam as ActiveTab;
    }
  }
  return 'dashboard';
};

function MwanaLariApp() {
  const { activeChild, activeRole, updateActiveChildStats } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [isOnline, setIsOnline] = useState<boolean>(checkIsOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [customRole, setCustomRole] = useState<UserRole | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);

  const currentRole = customRole || activeRole;

  // Listen to browser hash changes (e.g. #dictionary)
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'audiolab', 'games', 'dictionary', 'heritage', 'family', 'school'].includes(currentHash)) {
        setActiveTab(currentHash as ActiveTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

    // 3. Initialize IndexedDB & Seed local cache
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

    setupLocalDatabase();

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
      lastUpdated: new Date().toISOString(),
    });

    // If completed a lesson, record progress
    if (lessonId) {
      if (isOnline) {
        try {
          await lessonsAPI.completeLesson(lessonId, 100, amount);
        } catch {
          await queueOfflineProgress(activeChild.id, lessonId, 100, amount);
          refreshPendingSyncCount();
        }
      } else {
        await queueOfflineProgress(activeChild.id, lessonId, 100, amount);
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
    setCustomRole(role);
    if (role === 'TEACHER') {
      handleTabChange('school');
    } else if (role === 'ELDER') {
      handleTabChange('heritage');
    } else if (role === 'PARENT') {
      handleTabChange('family');
    } else {
      handleTabChange('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-savanna-100">
      
      {/* Header Bar with PWA & Backend API status & Updates center */}
      <Header
        profile={activeChild}
        activeRole={currentRole}
        onRoleChange={handleRoleChange}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Auto-Update Notification Banner */}
      <UpdateNotificationBanner
        isUpdateAvailable={isUpdateAvailable}
        onDismiss={() => setIsUpdateAvailable(false)}
      />

      {/* Navigation Tabs Subheader */}
      <nav className="bg-white/90 border-b border-brand-300 backdrop-blur-md sticky top-[60px] sm:top-[69px] z-40 px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-pan-x">
          
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
            <span>Grand Dictionnaire (+300)</span>
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
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-brand-300 py-6 px-4 text-center text-xs text-savanna-800 space-y-2 mt-12">
        <div className="font-extrabold text-brand-800 text-sm">
          🇨🇬 Mwana Lari — EdTech & Patrimoine Linguistique
        </div>
        <p className="max-w-xl mx-auto font-medium">
          « Apprendre sa langue. Comprendre ses racines. Préparer son avenir. »
        </p>
        <div className="text-[11px] text-savanna-700 font-semibold flex items-center justify-center gap-2">
          <span>Propulsé par Mwana Languages SaaS Platform</span>
          <span>•</span>
          <span className="text-forest-700 font-bold">Mises à jour automatiques PWA actives (v2.1)</span>
        </div>
      </footer>

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
