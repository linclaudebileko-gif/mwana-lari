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

function MwanaLariApp() {
  const { activeChild, activeRole, updateActiveChildStats } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(checkIsOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [customRole, setCustomRole] = useState<UserRole | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);

  const currentRole = customRole || activeRole;

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
      setActiveTab('school');
    } else if (role === 'ELDER') {
      setActiveTab('heritage');
    } else if (role === 'PARENT') {
      setActiveTab('family');
    } else {
      setActiveTab('dashboard');
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
      <nav className="bg-white/80 border-b border-brand-300 backdrop-blur-md sticky top-[69px] z-40 px-4 py-2 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <span>🌳</span>
            <span>Académie & Parcours</span>
          </button>

          <button
            onClick={() => handleTabChange('audiolab')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'audiolab'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Studio Audio & Prononciation</span>
          </button>

          <button
            onClick={() => handleTabChange('games')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'games'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-emerald-600" />
            <span>Jeux de Koko (4 modes)</span>
          </button>

          <button
            onClick={() => handleTabChange('dictionary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'dictionary'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Grand Dictionnaire (+300 mots)</span>
          </button>

          <button
            onClick={() => handleTabChange('heritage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'heritage'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <span>👵</span>
            <span>Voix des Aînés & Contes</span>
          </button>

          <button
            onClick={() => handleTabChange('family')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'family'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Espace Famille</span>
          </button>

          <button
            onClick={() => handleTabChange('school')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs transition-all whitespace-nowrap ${
              activeTab === 'school'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'text-savanna-900 hover:bg-savanna-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Espace École & Classes</span>
          </button>

        </div>
      </nav>

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
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
