import React, { useState, useEffect, useMemo } from 'react';
import { wordsAPI } from '../services/api';
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers
} from 'lucide-react';
import { speakNativeWord, playSuccessChime } from '../utils/audio';
import { saveOfflineWords, getOfflineWords } from '../utils/offlineStorage';
import { AddWordModal } from './AddWordModal';

export const Dictionary: React.FC = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<WordItem[]>(LARI_WORDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedLevel, setSelectedLevel] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFromDB, setIsFromDB] = useState(false);

  const categories = [
    'Toutes',
    'Salutations',
    'Famille',
    'Corps Humain',
    'Maison',
    'Nourriture',
    'Animaux',
    'Temps & Saisons',
    'Transports & Ville',
    'Métiers & Activités',
    'Nature & Éléments',
    'Nombres',
    'Verbes',
    'Sentiments & Qualités',
    'Patrimoine & Sagesse'
  ];

  const levels = [
    { id: 'ALL', label: 'Tous Niveaux' },
    { id: 1, label: 'Niv 1 • Découverte (3-5 ans)' },
    { id: 2, label: 'Niv 2 • Initiation (6-8 ans)' },
    { id: 3, label: 'Niv 3 • Communication (9-11 ans)' },
    { id: 4, label: 'Niv 4 • Expression (12-15 ans)' },
    { id: 5, label: 'Niv 5 • Patrimoine & Sagesse' },
  ];

  const canAddWords = user && ['ADMIN', 'LINGUIST', 'TEACHER'].includes(user.role);

  // Fetch words with fallback to offline dataset
  const fetchWords = async () => {
    setLoading(true);
    try {
      const results = await wordsAPI.searchWords({
        q: searchTerm.trim() || undefined,
        category: selectedCategory !== 'Toutes' ? selectedCategory : undefined,
      });

      if (results && results.length > 0) {
        setWords(results);
        setIsFromDB(true);
        saveOfflineWords(results as any).catch(() => {});
      } else {
        const localMatches = LARI_WORDS.filter((item) => {
          const matchesSearch =
            !searchTerm.trim() ||
            item.wordNative.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.translationFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.culturalNote && item.culturalNote.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesCat = selectedCategory === 'Toutes' || item.category === selectedCategory;
          const matchesLevel = selectedLevel === 'ALL' || item.difficultyLevel === selectedLevel;
          return matchesSearch && matchesCat && matchesLevel;
        });
        setWords(localMatches);
      }
    } catch (err) {
      console.warn('API non joignable, utilisation du lexique complet:', err);
      const localMatches = LARI_WORDS.filter((item) => {
        const matchesSearch =
          !searchTerm.trim() ||
          item.wordNative.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.translationFr.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'Toutes' || item.category === selectedCategory;
        const matchesLevel = selectedLevel === 'ALL' || item.difficultyLevel === selectedLevel;
        return matchesSearch && matchesCat && matchesLevel;
      });
      setWords(localMatches);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedLevel]);

  // Paginated entries
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return words.slice(start, start + itemsPerPage);
  }, [words, currentPage]);

  const totalPages = Math.ceil(words.length / itemsPerPage) || 1;

  const handleWordAdded = (newWord: WordItem) => {
    setWords((prev) => [newWord, ...prev]);
    setIsFromDB(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border-2 border-blue-300 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <h2 className="font-extrabold text-2xl text-savanna-950">
              📚 Grande Base Lexicale & Culturelle Lari
            </h2>
          </div>
          <p className="text-sm text-savanna-900 font-medium mt-1">
            Explorez plus de 300 mots authentiques Lari certifiés selon le standard <strong>MBUTA</strong> avec phonétique, classes nominales et audio HD !
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1.5 shadow-sm">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              {words.length} entrées lexicales certifiées
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-forest-100 text-forest-900 border border-forest-200 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
              Standard MBUTA & Brazzaville/Pool
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {canAddWords && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Mot (DB)</span>
            </button>
          )}

          {/* Search Bar */}
          <div className="relative min-w-[260px] flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-700" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher 'Nitu', 'Mbote', 'Maison'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border-2 border-blue-300 text-savanna-950 placeholder-savanna-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
            />
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <GraduationCap className="w-4 h-4 text-savanna-800 flex-shrink-0 ml-1" />
        {levels.map((lvl) => (
          <button
            key={String(lvl.id)}
            onClick={() => setSelectedLevel(lvl.id as any)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold flex-shrink-0 transition-all ${
              selectedLevel === lvl.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-savanna-800 border border-blue-200'
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {/* Category Pills Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-savanna-800 flex-shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex-shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-forest-600 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-savanna-800 border border-brand-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full glass-card p-12 rounded-3xl text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-savanna-900">
              Chargement des entrées lexicales...
            </p>
          </div>
        ) : paginatedWords.length > 0 ? (
          paginatedWords.map((word) => (
            <div
              key={word.id}
              className="glass-card p-5 rounded-3xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-3 relative group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Card Header: Category & Audio */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {word.category}
                    </span>
                    {word.difficultyLevel && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Niveau {word.difficultyLevel}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => speakNativeWord(word.wordNative, word.audioUrl)}
                    className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-md hover:scale-110 active:scale-95 transition-transform"
                    title="Écouter la prononciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Native Word & Phonetics */}
                <div>
                  <h3 className="font-extrabold text-2xl text-savanna-950">
                    {word.wordNative}
                  </h3>
                  <div className="text-xs font-semibold text-savanna-700 flex items-center gap-2">
                    <span>{word.phonetic}</span>
                    {word.nounClass && (
                      <span className="text-[10px] bg-savanna-200/70 px-1.5 py-0.5 rounded font-mono text-savanna-900">
                        {word.nounClass}
                      </span>
                    )}
                  </div>
                </div>

                {/* Translations */}
                <div className="text-sm font-bold text-savanna-900 border-t border-blue-100 pt-2">
                  🇫🇷 {word.translationFr}
                  {word.translationEn && (
                    <span className="text-xs font-normal text-savanna-700 block mt-0.5">
                      🇬🇧 {word.translationEn}
                    </span>
                  )}
                </div>

                {/* Example sentence */}
                {word.exampleSentenceNative && (
                  <div className="bg-blue-50/70 p-2.5 rounded-xl text-xs font-medium text-blue-950 space-y-0.5 border border-blue-100">
                    <div className="font-extrabold text-blue-900">💬 Exemple :</div>
                    <div>« {word.exampleSentenceNative} »</div>
                    <div className="text-savanna-800 font-normal">→ {word.exampleSentenceFr}</div>
                  </div>
                )}

                {/* Cultural explanation */}
                {word.culturalNote && (
                  <p className="text-xs text-savanna-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 font-medium">
                    💡 <span className="font-bold">Usage :</span> {word.culturalNote}
                  </p>
                )}
              </div>

              {/* Speaker verification tag */}
              <div className="flex items-center justify-between text-[11px] font-bold text-forest-700 pt-2 border-t border-savanna-200">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                  <span>Validé par {word.speakerName || 'Mbuta Lari'}</span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Audio HD
                </span>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full glass-card p-12 rounded-3xl text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="font-extrabold text-xl text-savanna-900">Aucun mot trouvé</h3>
            <p className="text-sm text-savanna-800">
              Essayez une autre recherche ou réinitialisez les filtres.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-savanna-300 text-savanna-800 disabled:opacity-40 hover:bg-savanna-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-extrabold text-savanna-900 px-3 py-1 rounded-xl bg-white border border-savanna-200 shadow-sm">
            Page {currentPage} sur {totalPages} ({words.length} mots)
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white border border-savanna-300 text-savanna-800 disabled:opacity-40 hover:bg-savanna-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
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
