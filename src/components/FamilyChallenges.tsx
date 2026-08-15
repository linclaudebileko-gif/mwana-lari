import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FAMILY_CHALLENGES } from '../data/mockData';
import { parentsAPI } from '../services/api';
import { Users, Trophy, Mic, CheckCircle2, Heart, Award, Sparkles, Plus, RefreshCw, Crown, Zap, Smartphone, CreditCard } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';
import { AddChildModal } from './AddChildModal';
import { SubscriptionModal } from './SubscriptionModal';

export const FamilyChallenges: React.FC = () => {
  const { user, childrenList, activeChild, setActiveChild, updateActiveChildStats, isPremium, subscription } = useAuth();
  const [challenges, setChallenges] = useState(FAMILY_CHALLENGES);
  const [isRecordingElder, setIsRecordingElder] = useState(false);
  const [recordedAudioSuccess, setRecordedAudioSuccess] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [childStats, setChildStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Load real child stats from backend
  useEffect(() => {
    const loadStats = async () => {
      if (!user || user.role !== 'PARENT' || !childrenList.length) return;
      setLoadingStats(true);
      const statsMap: Record<string, any> = {};
      for (const child of childrenList) {
        try {
          const s = await parentsAPI.getChildProgressStats(child.id);
          statsMap[child.id] = s;
        } catch {
          // ignore error per child
        }
      }
      setChildStats(statsMap);
      setLoadingStats(false);
    };

    loadStats();
  }, [user, childrenList]);

  const handleCompleteChallenge = (id: string, bonusXp: number) => {
    playSuccessChime();
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, currentCount: c.targetCount, isCompleted: true } : c))
    );
    // Add bonus XP to active child
    updateActiveChildStats({
      xpPoints: activeChild.xpPoints + bonusXp,
    });
  };

  const handleRecordElder = () => {
    setIsRecordingElder(true);
    setRecordedAudioSuccess(false);

    setTimeout(() => {
      setIsRecordingElder(false);
      setRecordedAudioSuccess(true);
      playSuccessChime();
      // Reward XP for recording
      updateActiveChildStats({
        xpPoints: activeChild.xpPoints + 50,
      });
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="glass-card-terracotta rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-2 border-terracotta-300 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-terracotta-700" />
            <h2 className="font-extrabold text-2xl text-terracotta-950">
              👨‍👩‍👧 Espace Famille & Monétisation Mobile Money
            </h2>
          </div>
          <p className="text-sm text-terracotta-950 font-medium mt-1">
            Reconnectez les générations ! Gérez les profils de vos enfants, votre abonnement Mobile Money et conservez la mémoire orale de vos aînés.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/90 p-3 rounded-2xl border border-terracotta-300 shadow-sm">
          <div className="flex -space-x-2">
            <span className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm border-2 border-white">👵</span>
            <span className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm border-2 border-white">👨</span>
            <span className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-sm border-2 border-white">👩</span>
            <span className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-sm border-2 border-white">👶</span>
          </div>
          <div>
            <div className="text-xs font-extrabold text-terracotta-950">
              {user ? `Compte Famille : ${user.fullName}` : 'Famille Kamba'}
            </div>
            <div className="text-[10px] text-savanna-700 font-bold">
              {childrenList.length} enfant(s) enregistré(s)
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Mobile Money Management Banner */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border-3 border-amber-300 shadow-xl bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 flex items-center justify-center text-white shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isPremium
                  ? 'bg-forest-100 text-forest-800 border-forest-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {isPremium ? '👑 Abonnement Actif' : '🟡 Forfait Gratuit (Découverte)'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-savanna-950">
                {isPremium ? subscription?.planName : 'Passez au Forfait Famille Mwana Lari'}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-savanna-800 font-medium max-w-xl">
            {isPremium ? (
              <span>
                Votre famille bénéficie d'un accès illimité aux <strong>529 mots Lari</strong>, aux 5 niveaux, contes audio des aînés et mini-jeux.
                {subscription?.expiresAt && ` (Valable jusqu'au ${new Date(subscription.expiresAt).toLocaleDateString('fr-FR')})`}
              </span>
            ) : (
              <span>
                Abonnez votre famille pour seulement <strong>1 500 FCFA / mois</strong> via <strong>MTN Mobile Money (*105#)</strong> ou <strong>Airtel Money (*128#)</strong>.
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-savanna-700">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>MTN MoMo Congo</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-red-600" />
              <span>Airtel Money Congo</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Visa / Mastercard</span>
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-amber-500 to-terracotta-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>{isPremium ? 'Gérer / Modifier l\'Abonnement' : 'S\'abonner (1 500 FCFA / mois)'}</span>
          </button>
        </div>
      </div>

      {/* Children Accounts Grid in Family Space */}
      <div className="glass-card p-6 rounded-3xl border-2 border-amber-200 shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-lg text-savanna-950 flex items-center gap-2">
              <span>👶</span> Profils Enfants de la Famille
            </h3>
            <p className="text-xs text-savanna-800 font-medium">
              Cliquez pour sélectionner l'enfant actif ou suivre ses progrès réels
            </p>
          </div>

          <button
            onClick={() => setIsAddChildModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Enfant</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {childrenList.map((child) => {
            const isSelected = activeChild.id === child.id;
            const stats = childStats[child.id];
            return (
              <div
                key={child.id}
                onClick={() => {
                  setActiveChild(child);
                  playSuccessChime();
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-amber-100/90 border-amber-500 shadow-md ring-2 ring-amber-400'
                    : 'bg-white hover:bg-savanna-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🦜</span>
                    <div>
                      <div className="font-extrabold text-sm text-savanna-950">{child.firstName}</div>
                      <div className="text-[10px] text-savanna-700 font-bold">{child.ageGroup} ans</div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-extrabold">
                      Actif
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-forest-800 pt-1 border-t border-gray-100">
                  <span>Niveau {child.level}</span>
                  <span className="text-brand-700">{child.xpPoints} XP</span>
                  <span className="text-terracotta-600">🔥 {child.streakDays}j</span>
                </div>

                {stats && (
                  <div className="text-[10px] text-savanna-700 font-semibold bg-white/60 p-1.5 rounded-lg">
                    📊 {stats.completed_lessons_count} leçons • ~{stats.words_mastered_count} mots
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sunday Challenge Highlight Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-terracotta-300 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-terracotta-600" />
            <h3 className="font-extrabold text-xl text-savanna-950">
              🔥 Les Défis de la Semaine
            </h3>
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
            +150 XP Famille à gagner
          </span>
        </div>

        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                challenge.isCompleted
                  ? 'bg-forest-50/90 border-forest-400'
                  : 'bg-white/95 border-terracotta-300 hover:border-terracotta-500'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-terracotta-100 text-terracotta-900">
                    Défi Famille
                  </span>
                  <h4 className="font-extrabold text-lg text-savanna-950">
                    {challenge.title}
                  </h4>
                </div>
                <p className="text-xs text-savanna-800 font-medium">
                  {challenge.description}
                </p>

                {/* Progress */}
                <div className="flex items-center gap-2 text-xs font-extrabold text-terracotta-800 pt-1">
                  <span>Progression : {challenge.currentCount} / {challenge.targetCount}</span>
                  <span className="text-brand-700">({challenge.bonusXp} XP Bonus)</span>
                </div>
              </div>

              <div>
                {challenge.isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-forest-700 bg-forest-100 px-4 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-forest-600" />
                    <span>Défi Validé !</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCompleteChallenge(challenge.id, challenge.bonusXp)}
                    className="px-4 py-2 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-extrabold text-xs shadow-md transition-all whitespace-nowrap"
                  >
                    Valider le Défi (+{challenge.bonusXp} XP)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elder Audio Recording Mini-Studio */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-forest-300 shadow-xl space-y-4 bg-gradient-to-r from-forest-50/70 via-emerald-50/60 to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-600 text-white flex items-center justify-center shadow-md">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-forest-950">
              🎙️ Enregistrer une Voix d'Aîné (Grand-parent / Oncle)
            </h3>
            <p className="text-xs text-forest-800 font-medium">
              Chaque mot prononcé par un aîné est sauvegardé pour enrichir l'apprentissage familial.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-forest-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm text-savanna-950">
              Mot recommandé aujourd'hui : <span className="font-extrabold text-forest-800 text-base">« Matondo »</span> (Merci)
            </div>
            <div className="text-xs text-savanna-700 mt-0.5">
              Demandez à un aîné de prononcer ce mot ou de raconter une anecdote de 10 secondes.
            </div>
          </div>

          <button
            onClick={handleRecordElder}
            disabled={isRecordingElder}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
              isRecordingElder
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-forest-600 hover:bg-forest-700 text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isRecordingElder ? 'Enregistrement en cours...' : 'Démarrer l\'Enregistrement (+50 XP)'}</span>
          </button>
        </div>

        {recordedAudioSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Bravo ! L'enregistrement a été validé et +50 XP ont été ajoutés au profil de {activeChild.firstName} !</span>
          </div>
        )}
      </div>

      <AddChildModal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

    </div>
  );
};
