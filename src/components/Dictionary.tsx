import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { LARI_WORDS } from '../data/mockData';
import { WordItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Volume2,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Filter,
  Plus,
  RefreshCw,
  Database,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  X
} from 'lucide-react';
import { speakNativeWord, playSuccessChime, preloadAudio } from '../utils/audio';
import { AddWordModal } from './AddWordModal';

interface IndexedWordItem extends WordItem {
  _searchIndex: string;
}

export const Dictionary: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [selectedLevel, setSelectedLevel] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [customWords, setCustomWords] = useState<WordItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const itemsPerPage = 24;

  const handlePlayWord = (word: WordItem) => {
    setPlayingWordId(word.id);
    speakNativeWord(word.wordNative, word.audioUrl, {
      onEnd: () => setPlayingWordId(null),
    });
  };

  const categories = [
    'Toutes',
    'Salutations & Politesse',
    'Actions & Verbes',
    'Famille & Relations',
    'Nourriture & Cuisine',
    'Corps & Santé',
    'Nature, Faune & Flore',
    'Maison & Quotidien',
    'Nombres & Temps',
    'Patrimoine & Culture',
    'Qualités & Descriptions',
    'Vocabulaire Général',
  ];

  const levels = [
    { id: 'ALL', label: 'Tous Niveaux (1 à 5)' },
    { id: 1, label: 'Niv 1 • Découverte (3-5 ans)' },
    { id: 2, label: 'Niv 2 • Initiation (6-8 ans)' },
    { id: 3, label: 'Niv 3 • Communication (9-11 ans)' },
    { id: 4, label: 'Niv 4 • Expression (12-15 ans)' },
    { id: 5, label: 'Niv 5 • Patrimoine & Sagesse' },
  ];

  const canAddWords = user && ['ADMIN', 'LINGUIST', 'TEACHER'].includes(user.role);

  // Pre-indexed words for ultra-fast matching (0ms)
  const indexedWords = useMemo<IndexedWordItem[]>(() => {
    const rawList = [...customWords, ...LARI_WORDS];
    return rawList.map((item) => ({
      ...item,
      _searchIndex: `${item.wordNative} ${item.translationFr} ${item.translationEn || ''} ${item.phonetic || ''} ${item.culturalNote || ''}`.toLowerCase(),
    }));
  }, [customWords]);

  // Ultra-fast filter with deferred search term (never freezes keystrokes)
  const filteredWords = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    const isAllCat = selectedCategory === 'Toutes';
    const isAllLevel = selectedLevel === 'ALL';

    return indexedWords.filter((item) => {
      const matchesSearch = !q || item._searchIndex.includes(q);
      const matchesCat = isAllCat || item.category === selectedCategory || (item.category && item.category.includes(selectedCategory));
      const matchesLevel = isAllLevel || item.difficultyLevel === selectedLevel;
      return matchesSearch && matchesCat && matchesLevel;
    });
  }, [indexedWords, deferredSearchTerm, selectedCategory, selectedLevel]);

  // Paginated slice
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWords.slice(start, start + itemsPerPage);
  }, [filteredWords, currentPage]);

  // Preload audio only for the first 4 visible items to save bandwidth and connections
  useEffect(() => {
    const timer = setTimeout(() => {
      paginatedWords.slice(0, 4).forEach((w) => {
        preloadAudio(w.audioUrl || w.wordNative);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [paginatedWords]);

  const totalPages = Math.ceil(filteredWords.length / itemsPerPage) || 1;

  const handleWordAdded = (newWord: WordItem) => {
    setCustomWords((prev) => [newWord, ...prev]);
    playSuccessChime();
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLevelSelect = (lvlId: number | 'ALL') => {
    setSelectedLevel(lvlId);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border-2 border-blue-300 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />
            <h2 className="font-extrabold text-xl sm:text-2xl text-savanna-950">
              📚 Grand Dictionnaire Lari — Standard MBUTA
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-savanna-900 font-medium mt-1">
            Explorez les <strong>{indexedWords.length} mots et expressions Lari authentiques</strong> du Pool et de Brazzaville avec prononciation audio, classes nominales et contextes culturels.
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1 shadow-sm">
              <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              {indexedWords.length} mots enregistrés
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 sm:px-3 py-1 rounded-full bg-forest-100 text-forest-900 border border-forest-300 flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-forest-600" />
              Validé MBUTA
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {filteredWords.length} résultat(s)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {canAddWords && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Mot</span>
            </button>
          )}

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-700" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher 'Nitu', 'Mbote', 'Lion'..."
              className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 rounded-2xl bg-white/90 border-2 border-blue-300 text-savanna-950 placeholder-savanna-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-savanna-500 hover:text-savanna-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="glass-card p-2.5 sm:p-3 rounded-2xl border border-blue-200 shadow-sm space-y-1.5 sm:space-y-2">
        <div className="text-[11px] font-extrabold text-savanna-800 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Filtrer par Niveau Pédagogique :</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          {levels.map((lvl) => (
            <button
              key={String(lvl.id)}
              onClick={() => handleLevelSelect(lvl.id as any)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-2xl text-xs font-extrabold flex-shrink-0 transition-all ${
                selectedLevel === lvl.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-savanna-800 border border-blue-200'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills Filters */}
      <div className="glass-card p-2.5 sm:p-3 rounded-2xl border border-forest-200 shadow-sm space-y-1.5 sm:space-y-2">
        <div className="text-[11px] font-extrabold text-savanna-800 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-forest-600 flex-shrink-0" />
          <span>Filtrer par Thématique ({categories.length - 1} catégories) :</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex-shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-forest-600 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-savanna-800 border border-brand-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Word Cards Grid (Responsive 1 to 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {paginatedWords.length > 0 ? (
          paginatedWords.map((word) => (
            <div
              key={word.id}
              className="glass-card p-4 sm:p-5 rounded-3xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-2.5 sm:space-y-3 relative group flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Card Header: Category & Audio */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {word.category}
                    </span>
                    {word.difficultyLevel && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Niv {word.difficultyLevel}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePlayWord(word)}
                    className={`p-2 sm:p-2.5 rounded-2xl text-white shadow-md transition-all flex items-center justify-center ${
                      playingWordId === word.id
                        ? 'bg-gradient-to-tr from-emerald-500 to-green-400 ring-4 ring-emerald-300 scale-110 animate-pulse'
                        : 'bg-gradient-to-tr from-blue-500 to-cyan-400 hover:scale-110 active:scale-95'
                    }`}
                    title={playingWordId === word.id ? 'Lecture audio en cours...' : 'Écouter la prononciation'}
                  >
                    <Volume2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${playingWordId === word.id ? 'animate-bounce' : ''}`} />
                  </button>
                </div>

                {/* Native Word & Phonetics */}
                <div>
                  <h3 className="font-extrabold text-xl sm:text-2xl text-savanna-950">
                    {word.wordNative}
                  </h3>
                  <div className="text-[11px] sm:text-xs font-semibold text-savanna-700 flex items-center gap-2 mt-0.5">
                    <span>{word.phonetic}</span>
                    {word.nounClass && (
                      <span className="text-[10px] bg-savanna-200/70 px-1.5 py-0.5 rounded font-mono text-savanna-900 font-bold">
                        {word.nounClass}
                      </span>
                    )}
                  </div>
                </div>

                {/* Translations */}
                <div className="text-xs sm:text-sm font-bold text-savanna-900 border-t border-blue-100 pt-1.5">
                  🇫🇷 {word.translationFr}
                  {word.translationEn && (
                    <span className="text-[11px] font-normal text-savanna-700 block mt-0.5">
                      🇬🇧 {word.translationEn}
                    </span>
                  )}
                </div>

                {/* Example sentence */}
                {word.exampleSentenceNative && (
                  <div className="bg-blue-50/70 p-2 sm:p-2.5 rounded-xl text-[11px] sm:text-xs font-medium text-blue-950 space-y-0.5 border border-blue-100">
                    <div className="font-extrabold text-blue-900 text-[10px] uppercase tracking-wide">💬 Exemple :</div>
                    <div className="font-bold">« {word.exampleSentenceNative} »</div>
                    <div className="text-savanna-800 font-normal">→ {word.exampleSentenceFr}</div>
                  </div>
                )}

                {/* Cultural explanation */}
                {word.culturalNote && (
                  <p className="text-[11px] sm:text-xs text-savanna-800 bg-amber-50/80 p-2 sm:p-2.5 rounded-xl border border-amber-200 font-medium">
                    💡 <span className="font-bold">Usage :</span> {word.culturalNote}
                  </p>
                )}
              </div>

              {/* Speaker verification tag */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-forest-700 pt-2 border-t border-savanna-200">
                <div className="flex items-center gap-1 truncate mr-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                  <span className="truncate">{word.speakerName || 'Mbuta Jean-Baptiste'}</span>
                </div>
                <span className="text-[9px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex-shrink-0">
                  Audio HD
                </span>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full glass-card p-8 sm:p-12 rounded-3xl text-center space-y-3">
            <div className="text-3xl sm:text-4xl">🔍</div>
            <h3 className="font-extrabold text-lg sm:text-xl text-savanna-900">Aucun mot trouvé</h3>
            <p className="text-xs sm:text-sm text-savanna-800">
              Aucune entrée ne correspond à votre recherche « {searchTerm} ».
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Toutes');
                setSelectedLevel('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 pt-4 flex-wrap">
          <button
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-savanna-300 text-savanna-800 disabled:opacity-40 hover:bg-savanna-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-xs font-extrabold text-savanna-900 px-3 py-1.5 rounded-xl bg-white border border-savanna-200 shadow-sm text-center">
            Page {currentPage} sur {totalPages} ({filteredWords.length} mots)
          </span>
          <button
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white border border-savanna-300 text-savanna-800 disabled:opacity-40 hover:bg-savanna-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWordAdded={handleWordAdded}
      />

    </div>
  );
};
