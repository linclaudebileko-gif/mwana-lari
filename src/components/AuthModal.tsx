import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  X,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Phone,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, loginAsDemo } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('PARENT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [childName, setChildName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      playSuccessChime();
      setSuccessMsg('Connexion réussie ! Bienvenue sur Mwana Lari.');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides ou serveur inaccessible.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(
        {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          phoneNumber: phoneNumber.trim(),
          countryCode: 'CG',
        },
        childName.trim() || undefined
      );
      playSuccessChime();
      setSuccessMsg('Compte créé avec succès ! Vos données sont synchronisées.');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demo: 'parent' | 'teacher' | 'linguist' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemo(demo);
      playSuccessChime();
      setSuccessMsg(`Connecté en mode Démo (${demo.toUpperCase()}) !`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au compte démo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 border-2 border-brand-300 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-500 to-terracotta-500 flex items-center justify-center text-3xl shadow-lg shadow-brand-500/30">
            🇨🇬
          </div>
          <h2 className="text-2xl font-extrabold text-savanna-950">
            {tab === 'login' ? 'Connexion à Mwana Lari' : 'Créer un Compte Mwana Lari'}
          </h2>
          <p className="text-xs font-medium text-savanna-800">
            {tab === 'login'
              ? 'Accédez à vos progrès réels synchronisés avec la base de données'
              : 'Rejoignez la plateforme éducative et préservez votre patrimoine linguistique'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-savanna-100 p-1 border border-brand-200">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-savanna-800 hover:text-savanna-950'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Se Connecter</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'register'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-savanna-800 hover:text-savanna-950'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un Compte</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {tab === 'login' && (
          <div className="space-y-5">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: parent@mwanalari.cg"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-terracotta-500 hover:from-brand-600 hover:to-terracotta-600 text-white font-extrabold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Se Connecter</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins Section */}
            <div className="border-t border-brand-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-savanna-800 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  Comptes de Démonstration (1-clic)
                </span>
                <span className="text-[10px] text-savanna-600">Base SQLite</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('parent')}
                  className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-left transition-all hover:scale-102 flex items-center gap-2 text-xs font-extrabold text-amber-900"
                >
                  <Users className="w-4 h-4 text-terracotta-600 flex-shrink-0" />
                  <div>
                    <div>👨‍👩‍👧 Parent</div>
                    <div className="text-[10px] font-normal text-savanna-700">Mavoungou Jean</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('teacher')}
                  className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-left transition-all hover:scale-102 flex items-center gap-2 text-xs font-extrabold text-indigo-900"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div>👨‍🏫 Enseignant</div>
                    <div className="text-[10px] font-normal text-savanna-700">Maitre Clarisse</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('linguist')}
                  className="p-2.5 rounded-2xl bg-forest-50 hover:bg-forest-100 border border-forest-300 text-left transition-all hover:scale-102 flex items-center gap-2 text-xs font-extrabold text-forest-900"
                >
                  <BookOpen className="w-4 h-4 text-forest-600 flex-shrink-0" />
                  <div>
                    <div>👵 Linguiste / Aîné</div>
                    <div className="text-[10px] font-normal text-savanna-700">Mamma Pauline</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2.5 rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-300 text-left transition-all hover:scale-102 flex items-center gap-2 text-xs font-extrabold text-brand-900"
                >
                  <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <div>
                    <div>🛡️ Administrateur</div>
                    <div className="text-[10px] font-normal text-savanna-700">Prof. Massamba</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Nom complet & Prénom
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Mavoungou Guy"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: mon.adresse@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Mot de Passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Votre Rôle
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="PARENT">👨‍👩‍👧 Parent</option>
                  <option value="TEACHER">👨‍🏫 Enseignant</option>
                  <option value="ELDER">👵 Aîné / Gardien</option>
                  <option value="LINGUIST">🔬 Linguiste</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Téléphone (optionnel)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+242 06..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {role === 'PARENT' && (
              <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 space-y-1.5">
                <label className="block text-xs font-extrabold text-brand-900">
                  👶 Prénom de votre enfant (création automatique du profil)
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="ex: Kamba, Mireille, Yannick..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-savanna-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-forest-600 to-emerald-600 hover:from-forest-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-forest-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Finaliser l'Inscription</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
