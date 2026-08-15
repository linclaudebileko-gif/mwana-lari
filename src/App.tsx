import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { INITIAL_CHILD_PROFILE, LARI_WORDS, CULTURAL_STORIES } from './data/mockData';
import { UserRole, ChildProfile } from './types';
import { Header } from './components/Header';
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

  const currentRole = customRole || activeRole;

  // Initialize PWA, Service Worker, and IndexedDB cache
  useEffect(() => {
    // 1. Register Service Worker
    registerServiceWorker();

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
  };

  const handleEarnXp = async (amount: number) => {
    const updatedXp = activeChild.xpPoints + amount;
    const newLevel = Math.floor(updatedXp / 100) + 1;

    // Update in Context & Local state
    updateActiveChildStats({
      xpPoints: updatedXp,
      level: newLevel,
    });

    // Save to IndexedDB
    await saveLocalChildState({
      xp: updatedXp,
      streak: activeChild.streakDays,
      level: newLevel,
    });

    // Try direct backend sync with SQLite API
    let syncedDirectly = false;
    if (isOnline) {
      try {
        await lessonsAPI.submitProgress({
          childId: activeChild.id,
          lessonId: `quiz_session_${Date.now()}`,
          score: 100,
          xpEarned: amount,
        });
        syncedDirectly = true;
      } catch (e) {
        console.warn('Synchro directe échouée, mise en file d\'attente offline:', e);
      }
    }

    if (!syncedDirectly) {
      // If offline or failed, record progress item in IndexedDB queue
      await queueOfflineProgress({
        childId: activeChild.id,
        lessonId: `quiz_session_${Date.now()}`,
        score: 100,
        xpEarned: amount,
      });
      refreshPendingSyncCount();
    }
  };

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
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
      
      {/* Header Bar with PWA & Backend API status */}
      <Header
        profile={activeChild}
        activeRole={currentRole}
        onRoleChange={handleRoleChange}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Navigation Tabs Subheader */}
      <nav className="bg-white/80 border-b border-brand-300 backdrop-blur-md sticky top-[69px] z-40 px-4 py-2 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 Tableau de Bord</span>
          </button>

          <button
            onClick={() => handleTabChange('audiolab')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'audiolab'
                ? 'bg-gradient-to-r from-brand-500 to-amber-500 text-white shadow-md'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <Mic className="w-4 h-4 text-brand-600" />
            <span>🎧 Labo Audio</span>
          </button>

          <button
            onClick={() => handleTabChange('games')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/30'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-purple-600" />
            <span>🎮 Mini-jeux & Énigmes</span>
          </button>

          <button
            onClick={() => handleTabChange('dictionary')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'dictionary'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>🧠 Dictionnaire</span>
          </button>

          <button
            onClick={() => handleTabChange('heritage')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'heritage'
                ? 'bg-forest-600 text-white shadow-md'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-forest-600" />
            <span>👵 Nzolo ya Bakulu</span>
          </button>

          <button
            onClick={() => handleTabChange('family')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'family'
                ? 'bg-terracotta-600 text-white shadow-md'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <Users className="w-4 h-4 text-terracotta-600" />
            <span>👨‍👩‍👧 Espace Famille</span>
          </button>

          <button
            onClick={() => handleTabChange('school')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-extrabold text-xs flex-shrink-0 transition-all ${
              activeTab === 'school'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border border-brand-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>🏫 Espace École</span>
          </button>

        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            profile={activeChild}
            onSelectTab={handleTabChange}
            onStartLesson={() => handleTabChange('audiolab')}
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
        <div className="text-[11px] text-savanna-700 font-semibold">
          Propulsé par Mwana Languages SaaS Platform • Démonstrateur MVP V1.0 Connecté REST API
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
