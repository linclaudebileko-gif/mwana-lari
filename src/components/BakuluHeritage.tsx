import React, { useState, useEffect } from 'react';
import { heritageAPI } from '../services/api';
import { CULTURAL_STORIES } from '../data/mockData';
import { CulturalStory } from '../types';
import {
  Play,
  Pause,
  Volume2,
  ShieldCheck,
  Heart,
  Sparkles,
  BookOpenCheck,
  Music,
  Gauge,
  Plus,
  RefreshCw,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { playStoryAudio, stopActiveAudio, playSuccessChime } from '../utils/audio';
import { saveOfflineStories, getOfflineStories } from '../utils/offlineStorage';
import { ContributeStoryModal } from './ContributeStoryModal';

export const BakuluHeritage: React.FC = () => {
  const [stories, setStories] = useState<CulturalStory[]>(CULTURAL_STORIES);
  const [selectedStory, setSelectedStory] = useState<CulturalStory>(CULTURAL_STORIES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STORY' | 'PROVERB' | 'SONG'>('ALL');
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isFromDB, setIsFromDB] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const typeParam = activeFilter !== 'ALL' ? activeFilter : undefined;
      const data = await heritageAPI.getStories(typeParam);
      if (data && data.length > 0) {
        setStories(data);
        setIsFromDB(true);
        if (!data.some((s) => s.id === selectedStory.id)) {
          setSelectedStory(data[0]);
        }
        saveOfflineStories(data).catch(() => {});
      } else {
        setStories(CULTURAL_STORIES);
      }
    } catch (err) {
      console.warn('API Contes non accessible, fallback offline:', err);
      try {
        const offlineStories = await getOfflineStories();
        if (offlineStories && offlineStories.length > 0) {
          setStories(offlineStories);
        } else {
          setStories(CULTURAL_STORIES);
        }
      } catch {
        setStories(CULTURAL_STORIES);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [activeFilter]);

  const handlePlayStory = (story: CulturalStory) => {
    if (isPlaying && selectedStory.id === story.id) {
      stopActiveAudio();
      setIsPlaying(false);
      return;
    }

    setSelectedStory(story);
    setIsPlaying(true);
    playStoryAudio(story.id, {
      playbackRate: playbackSpeed,
      onEnd: () => setIsPlaying(false),
    });
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isPlaying) {
      playStoryAudio(selectedStory.id, {
        playbackRate: speed,
        onEnd: () => setIsPlaying(false),
      });
    }
  };

  const handleStoryContributed = (newStory: CulturalStory) => {
    setStories((prev) => [newStory, ...prev]);
    setSelectedStory(newStory);
  };

  return (
    <div className="space-y-6">
      
      {/* Module Banner */}
      <div className="glass-card-forest p-6 rounded-3xl border-2 border-forest-400 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">👵</span>
            <div>
              <h2 className="font-extrabold text-2xl text-forest-950">
                NZOLO YA BAKULU — La Voix de nos Aînés
              </h2>
              <p className="text-xs text-forest-800 font-bold uppercase tracking-wider">
                Bibliothèque numérique de la mémoire orale du peuple Lari • Audio Réel WAV/MP3
              </p>
            </div>
          </div>
          <p className="text-sm text-forest-900 font-medium mt-2">
            Écoutez les grands-parents raconter les contes traditionnels et transmettre les proverbes ancrés dans la sagesse ancestrale.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-900 border border-forest-300 flex items-center gap-1">
              <Database className="w-3 h-3 text-forest-700" />
              {stories.length} récits enregistrés dans la base de données
            </span>
            {isFromDB && (
              <span className="text-[10px] text-forest-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live SQLite
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsContributeModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-forest-700 to-emerald-600 hover:from-forest-800 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Transmettre un Récit (DB)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
            activeFilter === 'ALL'
              ? 'bg-forest-600 text-white shadow-md'
              : 'bg-white/80 hover:bg-white text-forest-900 border border-forest-200'
          }`}
        >
          🌟 Tous les Enregistrements
        </button>
        <button
          onClick={() => setActiveFilter('PROVERB')}
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
            activeFilter === 'PROVERB'
              ? 'bg-forest-600 text-white shadow-md'
              : 'bg-white/80 hover:bg-white text-forest-900 border border-forest-200'
          }`}
        >
          📜 Proverbes & Sagesse
        </button>
        <button
          onClick={() => setActiveFilter('STORY')}
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
            activeFilter === 'STORY'
              ? 'bg-forest-600 text-white shadow-md'
              : 'bg-white/80 hover:bg-white text-forest-900 border border-forest-200'
          }`}
        >
          🦁 Contes Traditionnels
        </button>
        <button
          onClick={() => setActiveFilter('SONG')}
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
            activeFilter === 'SONG'
              ? 'bg-forest-600 text-white shadow-md'
              : 'bg-white/80 hover:bg-white text-forest-900 border border-forest-200'
          }`}
        >
          🎶 Chants & Berceuses
        </button>
      </div>

      {/* Featured Audio Player & Tale Reader */}
      {selectedStory && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-forest-300 shadow-2xl space-y-6">
          
          {/* Story Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest-200 pb-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-forest-100 text-forest-900 font-extrabold text-xs">
                {selectedStory.category || selectedStory.type}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-savanna-950 mt-1">
                {selectedStory.titleNative}
              </h1>
              <p className="text-sm font-bold text-forest-800">
                🇫🇷 {selectedStory.titleFr}
              </p>
            </div>

            {/* Elder Speaker Tag */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-forest-100/90 text-forest-900 border border-forest-300">
              <ShieldCheck className="w-5 h-5 text-forest-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-forest-700">Raconteur Aîné</div>
                <div className="text-xs font-extrabold text-forest-950">{selectedStory.elderSpeakerName}</div>
              </div>
            </div>
          </div>

          {/* Big Interactive Audio Control Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-forest-700 via-emerald-600 to-forest-800 text-white space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayStory(selectedStory)}
                  className={`w-14 h-14 rounded-2xl bg-brand-400 text-savanna-950 flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-all ${
                    isPlaying ? 'animate-pulse ring-4 ring-brand-200' : ''
                  }`}
                  title={isPlaying ? 'Mettre en pause' : 'Écouter l\'enregistrement audio'}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-savanna-950" /> : <Play className="w-6 h-6 fill-savanna-950 ml-0.5" />}
                </button>
                <div>
                  <div className="text-sm font-extrabold">
                    {isPlaying ? 'Lecture audio en cours...' : 'Prêt à écouter'}
                  </div>
                  <div className="text-xs text-forest-100 flex items-center gap-2">
                    <span>Voix authentique de Brazzaville</span>
                    <span>•</span>
                    <span>HD 48kHz</span>
                  </div>
                </div>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl self-end sm:self-auto">
                <Gauge className="w-4 h-4 text-brand-300" />
                <span className="text-xs font-bold text-forest-100">Vitesse :</span>
                {[0.75, 1.0, 1.25].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-extrabold transition-colors ${
                      playbackSpeed === speed ? 'bg-brand-400 text-savanna-950 font-black' : 'hover:bg-white/20 text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bilingual Dual Column Reader */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Lari Column */}
            <div className="p-6 rounded-2xl bg-forest-50/80 border-2 border-forest-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-forest-900 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span>🇨🇬</span> Version Originale en Lari
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-200">Texte Intégral</span>
              </div>
              <p className="text-base text-forest-950 leading-relaxed font-semibold italic">
                « {selectedStory.contentNative} »
              </p>
            </div>

            {/* French Column */}
            <div className="p-6 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span>🇫🇷</span> Traduction & Explication en Français
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200">Sens & Contexte</span>
              </div>
              <p className="text-sm text-savanna-900 leading-relaxed font-medium">
                « {selectedStory.contentFr} »
              </p>
            </div>

          </div>

          {/* Moral Lesson Footer Callout */}
          {selectedStory.moralLesson && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-forest-100 via-amber-100 to-savanna-100 border-2 border-forest-300 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold uppercase text-forest-950 tracking-wider">
                  Sagesse & Enseignement Transmis par les Anciens :
                </h4>
                <p className="text-xs text-savanna-900 font-bold mt-0.5">
                  {selectedStory.moralLesson}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Stories Carousel / Selection Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-lg text-savanna-950 flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-forest-600" />
          <span>Explorer les Enregistrements Disponibles ({stories.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 group ${
                selectedStory.id === story.id
                  ? 'bg-forest-100/90 border-forest-500 shadow-md ring-2 ring-forest-400'
                  : 'glass-card border-forest-200 hover:border-forest-400 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-forest-800">
                <span className="px-2 py-0.5 rounded-full bg-white/80 border border-forest-300">
                  {story.category || story.type}
                </span>
                <span>{story.elderSpeakerName}</span>
              </div>

              <h4 className="font-extrabold text-base text-savanna-950 group-hover:text-forest-800 transition-colors">
                {story.titleNative}
              </h4>
              <p className="text-xs text-forest-900 font-medium">
                🇫🇷 {story.titleFr}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-forest-100 text-[11px] font-extrabold text-forest-700">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  Écouter le conte
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-200 text-forest-900">
                  WAV Réel
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Modal */}
      <ContributeStoryModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        onStoryContributed={handleStoryContributed}
      />

    </div>
  );
};
