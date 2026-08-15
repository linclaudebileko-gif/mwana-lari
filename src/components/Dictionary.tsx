import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { speakNativeWord, playSuccessChime } from '../utils/audio';
import { saveOfflineWords, getOfflineWords } from '../utils/offlineStorage';
import { AddWordModal } from './AddWordModal';

export const Dictionary: React.FC = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<WordItem[]>(LARI_WORDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFromDB, setIsFromDB] = useState(false);

  const categories = ['Toutes', 'Salutations', 'Famille', 'Maison', 'Nourriture', 'Animaux', 'Nombres', 'Culture'];

  const canAddWords = user && ['ADMIN', 'LINGUIST', 'TEACHER'].includes(user.role);

  // Fetch words from REST API with fallback to IndexedDB / mock
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
        // Cache to IndexedDB for offline access
        saveOfflineWords(results as any).catch(() => {});
      } else {
        // Fallback filter on local
        const localMatches = LARI_WORDS.filter((item) => {
          const matchesSearch =
            !searchTerm.trim() ||
            item.wordNative.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.translationFr.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCat = selectedCategory === 'Toutes' || item.category === selectedCategory;
          return matchesSearch && matchesCat;
        });
        setWords(localMatches);
      }
    } catch (err) {
      console.warn('API non joignable, utilisation du cache local:', err);
      try {
        const offlineWords = await getOfflineWords();
        if (offlineWords && offlineWords.length > 0) {
          const filtered = (offlineWords as WordItem[]).filter((item) => {
            const matchesSearch =
              !searchTerm.trim() ||
              item.wordNative.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.translationFr.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = selectedCategory === 'Toutes' || item.category === selectedCategory;
            return matchesSearch && matchesCat;
          });
          setWords(filtered);
        } else {
          setWords(LARI_WORDS);
        }
      } catch {
        setWords(LARI_WORDS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const handleWordAdded = (newWord: WordItem) => {
    setWords((prev) => [newWord, ...prev]);
    setIsFromDB(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border-2 border-blue-300 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <h2 className="font-extrabold text-2xl text-savanna-950">
              🧠 Dictionnaire Intelligent & Culturel Lari
            </h2>
          </div>
          <p className="text-sm text-savanna-900 font-medium mt-1">
            Recherchez un mot en Français ou en Lari pour découvrir sa prononciation audio, son contexte culturel et ses exemples !
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-600" />
              {words.length} mots synchronisés avec la base de données
            </span>
            {isFromDB && (
              <span className="text-[10px] text-forest-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live SQLite
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Add Word Button for authenticated linguists/teachers/admins */}
          {canAddWords && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Mot (DB)</span>
            </button>
          )}

          {/* Search Bar Input */}
          <div className="relative min-w-[260px] flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-700" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher 'Maison', 'Mbote'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border-2 border-blue-300 text-savanna-950 placeholder-savanna-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Category Pills Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-savanna-800 flex-shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex-shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-savanna-800 border border-blue-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 glass-card p-12 rounded-3xl text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-savanna-900">
              Interrogation de la base de données Mwana Lari...
            </p>
          </div>
        ) : words.length > 0 ? (
          words.map((word) => (
            <div
              key={word.id}
              className="glass-card p-5 rounded-3xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-3 relative group"
            >
              {/* Card Header: Word & Audio Button */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {word.category}
                  </span>
                  <h3 className="font-extrabold text-2xl text-savanna-950 mt-1">
                    {word.wordNative} <span className="text-xs font-normal text-savanna-700">{word.phonetic}</span>
                  </h3>
                </div>

                <button
                  onClick={() => speakNativeWord(word.wordNative)}
                  className="p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-md hover:scale-110 active:scale-95 transition-transform"
                  title="Écouter le mot"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Translations */}
              <div className="text-sm font-bold text-savanna-900 border-t border-blue-100 pt-2">
                🇫🇷 {word.translationFr} <span className="text-xs font-normal text-savanna-700 ml-2">🇬🇧 {word.translationEn}</span>
              </div>

              {/* Example Sentence if present */}
              {word.exampleSentenceNative && (
                <div className="bg-blue-50/70 p-2.5 rounded-xl text-xs font-medium text-blue-950 space-y-0.5 border border-blue-100">
                  <div className="font-extrabold text-blue-900">💬 Exemple :</div>
                  <div>« {word.exampleSentenceNative} »</div>
                  <div className="text-savanna-800 font-normal">→ {word.exampleSentenceFr}</div>
                </div>
              )}

              {/* Cultural Context */}
              {word.culturalNote && (
                <p className="text-xs text-savanna-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 font-medium">
                  💡 <span className="font-bold">Explication Culturelle :</span> {word.culturalNote}
                </p>
              )}

              {/* Verification Tag & Audio status */}
              <div className="flex items-center justify-between text-[11px] font-bold text-forest-700 pt-1">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                  <span>Validé par {word.speakerName || 'Locuteur Lari'}</span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Audio WAV HD
                </span>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-2 glass-card p-12 rounded-3xl text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="font-extrabold text-xl text-savanna-900">Aucun mot trouvé</h3>
            <p className="text-sm text-savanna-800">
              Essayez une autre recherche ou réinitialisez le filtre par catégorie.
            </p>
          </div>
        )}
      </div>

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWordAdded={handleWordAdded}
      />

    </div>
  );
};
