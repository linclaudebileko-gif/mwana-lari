import React, { useState, useEffect } from 'react';
import { ChildProfile, LessonUnit } from '../types';
import { KokoMascot } from './KokoMascot';
import { LESSON_UNITS } from '../data/mockData';
import { lessonsAPI } from '../services/api';
import {
  Play,
  CheckCircle2,
  Lock,
  Mic,
  BookOpen,
  Volume2,
  Users,
  Trophy,
  Award,
  ArrowRight,
  Gamepad2,
  Database,
  RefreshCw,
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface DashboardProps {
  profile: ChildProfile;
  onSelectTab: (tab: 'dashboard' | 'audiolab' | 'games' | 'dictionary' | 'heritage' | 'family' | 'school') => void;
  onStartLesson: (lesson: LessonUnit) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, onSelectTab, onStartLesson }) => {
  const [lessons, setLessons] = useState<LessonUnit[]>(LESSON_UNITS);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [isFromDB, setIsFromDB] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      setLoadingLessons(true);
      try {
        const data = await lessonsAPI.getLessons(profile.id);
        if (data && data.length > 0) {
          setLessons(data);
          setIsFromDB(true);
        }
      } catch (err) {
        console.warn('API Leçons non disponible, utilisation du mock:', err);
        setLessons(LESSON_UNITS);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, [profile.id, profile.xpPoints]);

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      
      {/* Koko Mascot Welcome */}
      <KokoMascot
        message={`Mbote, ${profile.firstName} ! 👋 Tu as une série de ${profile.streakDays} jours ! Viens relever les énigmes et faire grandir ton Baobab.`}
        audioPhrase={`Mbote ${profile.firstName}, tu wa kwiza mu baka ndandu.`}
      />

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        
        {/* Labo Audio Card */}
        <div
          onClick={() => { playSuccessChime(); onSelectTab('audiolab'); }}
          className="glass-card p-3.5 sm:p-4 rounded-3xl border-2 border-brand-300 hover:border-brand-500 hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-savanna-900 group-hover:text-brand-700 transition-colors">
              🎧 Labo Audio
            </h3>
            <p className="text-[11px] sm:text-xs text-savanna-800 font-medium mt-0.5 sm:mt-1 line-clamp-2">
              Écoute, répète & teste ta voix
            </p>
          </div>
        </div>

        {/* Mini-Jeux de Koko Card */}
        <div
          onClick={() => { playSuccessChime(); onSelectTab('games'); }}
          className="glass-card p-3.5 sm:p-4 rounded-3xl border-2 border-purple-300 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 bg-gradient-to-b from-purple-50/50 to-white flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-purple-950 group-hover:text-purple-700 transition-colors">
              🎮 Mini-Jeux
            </h3>
            <p className="text-[11px] sm:text-xs text-purple-900 font-medium mt-0.5 sm:mt-1 line-clamp-2">
              Énigmes, memory & blind tests Koko
            </p>
          </div>
        </div>

        {/* Voix des Aînés Card */}
        <div
          onClick={() => { playSuccessChime(); onSelectTab('heritage'); }}
          className="glass-card-forest p-3.5 sm:p-4 rounded-3xl border-2 border-forest-400 hover:border-forest-600 hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-forest-600 to-emerald-400 flex items-center justify-center text-white mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-forest-950 group-hover:text-forest-800 transition-colors">
              👵 Voix des Aînés
            </h3>
            <p className="text-[11px] sm:text-xs text-forest-900 font-medium mt-0.5 sm:mt-1 line-clamp-2">
              Contes, proverbes & souvenirs
            </p>
          </div>
        </div>

        {/* Dictionnaire Intelligent Card */}
        <div
          onClick={() => { playSuccessChime(); onSelectTab('dictionary'); }}
          className="glass-card p-3.5 sm:p-4 rounded-3xl border-2 border-blue-300 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-savanna-900 group-hover:text-blue-700 transition-colors">
              📚 Dictionnaire
            </h3>
            <p className="text-[11px] sm:text-xs text-savanna-800 font-medium mt-0.5 sm:mt-1 line-clamp-2">
              +500 mots Lari avec audio HD
            </p>
          </div>
        </div>

        {/* Espace Famille Card */}
        <div
          onClick={() => { playSuccessChime(); onSelectTab('family'); }}
          className="glass-card-terracotta p-3.5 sm:p-4 rounded-3xl border-2 border-terracotta-400 hover:border-terracotta-600 hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 col-span-2 sm:col-span-1 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-terracotta-600 to-orange-400 flex items-center justify-center text-white mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-terracotta-950 group-hover:text-terracotta-800 transition-colors">
              👨‍👩‍👧 Ma Famille
            </h3>
            <p className="text-[11px] sm:text-xs text-terracotta-900 font-medium mt-0.5 sm:mt-1 line-clamp-2">
              Défis du soir & progrès
            </p>
          </div>
        </div>

      </div>

      {/* Learning Roadmap / Académie du Lari */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border-2 border-brand-300 shadow-xl space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-extrabold text-[11px] sm:text-xs">
                Niveau {profile.level}
              </span>
              <h2 className="font-extrabold text-lg sm:text-2xl text-savanna-900">
                📖 Académie du Lari — Ton Parcours
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-savanna-800 mt-1 font-medium">
              Complète chaque étape pour faire grandir ton Baobab linguistique !
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold text-forest-700 bg-forest-100 px-3 py-1.5 rounded-full border border-forest-300 self-start sm:self-auto">
            <span>{progressPercent}% Complété ({completedCount}/{lessons.length})</span>
          </div>
        </div>

        {/* Units Roadmap */}
        <div className="space-y-3 sm:space-y-4">
          {lessons.map((unit, idx) => (
            <div
              key={unit.id}
              onClick={() => unit.isUnlocked && onStartLesson(unit)}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                unit.isCompleted
                  ? 'bg-forest-50/90 border-forest-400 hover:border-forest-600'
                  : unit.isUnlocked
                  ? 'bg-white/95 border-brand-400 hover:border-brand-600 hover:shadow-md cursor-pointer'
                  : 'bg-gray-100/70 border-gray-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                {/* Icon Circle */}
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner flex-shrink-0 ${
                  unit.isCompleted
                    ? 'bg-forest-500 text-white'
                    : unit.isUnlocked
                    ? 'bg-gradient-to-tr from-brand-400 to-amber-300 text-brand-950'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {unit.icon}
                </div>

                {/* Lesson Title & Info */}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-extrabold text-brand-800">
                      Unité {idx + 1}
                    </span>
                    <span className="text-[11px] sm:text-xs text-savanna-700 font-bold">
                      • {unit.wordCount} mots audio
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-savanna-950 leading-tight">
                    {unit.titleFr} <span className="text-xs font-semibold text-brand-700 italic block sm:inline">({unit.titleNative})</span>
                  </h3>
                  <p className="text-xs text-savanna-800 font-medium hidden md:block">
                    {unit.description}
                  </p>
                </div>
              </div>

              {/* Status / Action Button */}
              <div className="flex items-center justify-end gap-2 self-end sm:self-center">
                {unit.isCompleted ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-forest-100 text-forest-800 text-xs font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-forest-600" />
                    <span>Maîtrisé</span>
                  </div>
                ) : unit.isUnlocked ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStartLesson(unit); }}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-md transition-colors active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Commencer</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-500 text-xs font-extrabold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Verrouillé</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
