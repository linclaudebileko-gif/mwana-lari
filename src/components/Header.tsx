import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChildProfile, UserRole } from '../types';
import {
  Flame,
  Award,
  TreePine,
  Sparkles,
  UserCheck,
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  LogIn,
  LogOut,
  User,
  Plus,
  ChevronDown,
  Database,
  GraduationCap,
  Users,
  BookOpen,
  CheckCircle2,
  X
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { AddChildModal } from './AddChildModal';
import { playSuccessChime } from '../utils/audio';
import { CURRENT_APP_VERSION, checkForAppUpdates, applyAppUpdate } from '../utils/pwa';

interface HeaderProps {
  profile: ChildProfile;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeRole,
  onRoleChange,
  isOnline = true,
  pendingSyncCount = 0,
  onManualSync,
  isSyncing = false,
}) => {
  const { user, isAuthenticated, logout, isServerOnline, childrenList, activeChild, setActiveChild } = useAuth();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusMessage, setUpdateStatusMessage] = useState<string | null>(null);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold border border-red-200">🛡️ Admin</span>;
      case 'LINGUIST':
        return <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 text-[10px] font-extrabold border border-forest-200">🔬 Linguiste</span>;
      case 'TEACHER':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold border border-indigo-200">👨‍🏫 Enseignant</span>;
      case 'PARENT':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200">👨‍👩‍👧 Parent</span>;
      case 'ELDER':
        return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-extrabold border border-orange-200">👵 Aîné</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-extrabold border border-brand-200">👶 Enfant</span>;
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMessage('Vérification des mises à jour auprès des serveurs...');
    try {
      const hasUpdate = await checkForAppUpdates();
      setTimeout(() => {
        setIsCheckingUpdate(false);
        if (hasUpdate) {
          setUpdateStatusMessage('✨ Une nouvelle version est disponible ! Cliquez sur Actualiser pour l\'appliquer.');
        } else {
          setUpdateStatusMessage('✅ Votre application Mwana Lari est à jour avec les derniers mots et contes !');
        }
      }, 800);
    } catch {
      setIsCheckingUpdate(false);
      setUpdateStatusMessage('✅ Votre application est à jour avec le cache local.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-card border-b border-brand-300 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-amber-400 to-terracotta-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30 transform hover:scale-105 transition-transform cursor-pointer">
              🇨🇬
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-700 via-terracotta-600 to-forest-700 bg-clip-text text-transparent">
                  Mwana Lari
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 font-bold border border-forest-500/30 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5 text-forest-600" />
                  v2.1
                </span>
              </div>
              <p className="text-xs text-savanna-800 font-medium hidden sm:block">
                Apprendre sa langue • Comprendre ses racines
              </p>
            </div>
          </div>

          {/* Center: Gamification Stats (XP, Streaks, Baobab Tree) */}
          {activeRole === 'CHILD' && (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Streak Counter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300 shadow-sm">
                <Flame className="w-4 h-4 text-orange-600 animate-bounce" />
                <span className="font-extrabold text-xs text-orange-950">
                  {profile.streakDays} jours
                </span>
              </div>

              {/* XP Points */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-brand-100 to-amber-100 border border-brand-300 shadow-sm">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span className="font-extrabold text-xs text-savanna-950">
                  {profile.xpPoints} XP
                </span>
              </div>

              {/* Baobab Growth Level */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-forest-100 to-emerald-100 border border-forest-300 shadow-sm">
                <TreePine className="w-4 h-4 text-forest-600" />
                <span className="font-extrabold text-xs text-forest-950">
                  Baobab Niv. {profile.level}
                </span>
              </div>
            </div>
          )}

          {/* Right: Actions, Updates, Network & Profile */}
          <div className="flex items-center gap-2">
            
            {/* Updates Button */}
            <button
              onClick={() => {
                setIsUpdateModalOpen(true);
                handleCheckUpdates();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 border border-brand-300 text-brand-900 text-xs font-extrabold transition-all shadow-sm active:scale-95"
              title="Vérifier les mises à jour"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-700" />
              <span className="hidden sm:inline">Mises à jour</span>
            </button>

            {/* Network / PWA Status Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border shadow-sm bg-savanna-100 border-savanna-300 text-savanna-900">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-forest-600" />
                  <span className="hidden sm:inline">En Ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hors-ligne (PWA)</span>
                </>
              )}
            </div>

            {/* Pending Sync Button if items in queue */}
            {pendingSyncCount > 0 && (
              <button
                onClick={onManualSync}
                disabled={isSyncing || !isOnline}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all ${
                  isSyncing ? 'opacity-70 cursor-wait' : ''
                }`}
                title="Synchroniser la file d'attente vers la base de données"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount}</span>
              </button>
            )}

            {/* If Logged In: User Profile Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 border-2 border-brand-400 hover:border-brand-500 shadow-sm transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-extrabold text-savanna-950 leading-tight">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-savanna-700">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-savanna-600" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border-2 border-brand-200 shadow-2xl p-3 space-y-3 z-50 animate-fadeIn">
                    <div className="border-b border-brand-100 pb-2">
                      <div className="font-extrabold text-sm text-savanna-950">{user.fullName}</div>
                      <div className="text-xs text-savanna-700 truncate">{user.email}</div>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>

                    {/* For Parents: Child Selector */}
                    {user.role === 'PARENT' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-savanna-800">
                          <span>👶 Profils Enfants :</span>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsAddChildModalOpen(true);
                            }}
                            className="text-brand-600 hover:text-brand-700 flex items-center gap-0.5 text-[10px]"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajouter</span>
                          </button>
                        </div>

                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {childrenList.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => {
                                setActiveChild(child);
                                setIsUserMenuOpen(false);
                                playSuccessChime();
                              }}
                              className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                                activeChild.id === child.id
                                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                  : 'bg-savanna-50 hover:bg-savanna-100 text-savanna-900'
                              }`}
                            >
                              <span>{child.firstName} ({child.ageGroup} ans)</span>
                              <span className="text-[10px] text-brand-700">{child.xpPoints} XP</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Role view switch */}
                    <div className="border-t border-brand-100 pt-2">
                      <label className="block text-[10px] font-extrabold text-savanna-700 mb-1">
                        Vue Interactive :
                      </label>
                      <select
                        value={activeRole}
                        onChange={(e) => {
                          onRoleChange(e.target.value as UserRole);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-xs font-bold bg-savanna-50 border border-brand-300 rounded-xl px-2 py-1.5 text-savanna-900 cursor-pointer"
                      >
                        <option value="CHILD">👶 Vue Enfant ({activeChild.firstName})</option>
                        <option value="PARENT">👨‍👩‍👧 Espace Famille</option>
                        <option value="TEACHER">👨‍🏫 Espace École</option>
                        <option value="ELDER">👵 Voix des Aînés</option>
                      </select>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se Déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* If Not Logged In: Login / Register Buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connexion</span>
                </button>

                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white hover:bg-savanna-100 border border-brand-400 text-savanna-900 font-extrabold text-xs shadow-sm transition-all"
                >
                  <span>S'inscrire</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Interactive Updates Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 border-2 border-brand-400 shadow-2xl p-6 sm:p-7 space-y-4">
            
            <button
              onClick={() => setIsUpdateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white text-2xl shadow-md">
                🔄
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-savanna-950">
                  Centre des Mises à Jour
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-300">
                  {CURRENT_APP_VERSION}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-savanna-50 border border-brand-200 text-xs text-savanna-900 font-medium space-y-2">
              <div className="font-extrabold text-savanna-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-600" />
                <span>Nouveautés actives :</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-savanna-800">
                <li><strong>+300 Mots Lari MBUTA</strong> avec phonétique et audio HD</li>
                <li><strong>Studio Micro des Bambuta</strong> pour enregistrer contes et voix</li>
                <li><strong>5 Niveaux Pédagogiques</strong> filtrables dans le Dictionnaire</li>
                <li><strong>Mode Hors-Ligne Total (PWA)</strong> avec synchronisation automatique</li>
              </ul>
            </div>

            {updateStatusMessage && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-amber-700 flex-shrink-0 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{updateStatusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdate}
                className="px-4 py-2 rounded-xl border border-brand-300 text-savanna-900 font-extrabold text-xs hover:bg-savanna-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>Vérifier</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSuccessChime();
                  applyAppUpdate();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-forest-600 to-emerald-600 hover:from-forest-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Actualiser le Contenu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
      />
    </>
  );
};
