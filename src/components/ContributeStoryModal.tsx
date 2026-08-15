import React, { useState } from 'react';
import { heritageAPI } from '../services/api';
import { CulturalStory } from '../types';
import { X, Mic, Volume2, Sparkles, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface ContributeStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryContributed?: (story: CulturalStory) => void;
}

export const ContributeStoryModal: React.FC<ContributeStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryContributed,
}) => {
  const [type, setType] = useState<'STORY' | 'PROVERB' | 'SONG'>('PROVERB');
  const [titleNative, setTitleNative] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [contentNative, setContentNative] = useState('');
  const [contentFr, setContentFr] = useState('');
  const [elderSpeakerName, setElderSpeakerName] = useState('');
  const [moralLesson, setMoralLesson] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleNative.trim() || !contentNative.trim() || !elderSpeakerName.trim()) {
      setError('Veuillez renseigner le titre en Lari, le texte et le nom du grand-parent / aîné.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await heritageAPI.contributeStory({
        type,
        titleNative: titleNative.trim(),
        titleFr: titleFr.trim() || titleNative.trim(),
        contentNative: contentNative.trim(),
        contentFr: contentFr.trim(),
        elderSpeakerName: elderSpeakerName.trim(),
        moralLesson: moralLesson.trim(),
      });

      playSuccessChime();
      setSuccess(true);
      if (onStoryContributed) {
        onStoryContributed({
          id: res.id || `story_${Date.now()}`,
          type,
          titleNative: titleNative.trim(),
          titleFr: titleFr.trim() || titleNative.trim(),
          contentNative: contentNative.trim(),
          contentFr: contentFr.trim(),
          elderSpeakerName: elderSpeakerName.trim(),
          durationSeconds: 60,
          moralLesson: moralLesson.trim(),
          category: type === 'PROVERB' ? 'Proverbes & Sagesse' : 'Contes Traditionnels',
        });
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de la contribution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 border-2 border-forest-400 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-forest-600 to-emerald-400 flex items-center justify-center text-white text-2xl shadow-md">
            👵
          </div>
          <h2 className="text-xl font-extrabold text-forest-950">
            Transmettre la Mémoire des Aînés
          </h2>
          <p className="text-xs text-forest-900 font-medium">
            Partagez un conte, un proverbe ou un chant traditionnel Lari avec la communauté
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Contribution transmise ! Elle a été enregistrée dans la base de données.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Type de Transmission
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('PROVERB')}
                className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                  type === 'PROVERB'
                    ? 'bg-forest-600 text-white border-forest-600 shadow-md'
                    : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border-brand-200'
                }`}
              >
                📜 Proverbe
              </button>
              <button
                type="button"
                onClick={() => setType('STORY')}
                className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                  type === 'STORY'
                    ? 'bg-forest-600 text-white border-forest-600 shadow-md'
                    : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border-brand-200'
                }`}
              >
                🦁 Conte
              </button>
              <button
                type="button"
                onClick={() => setType('SONG')}
                className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                  type === 'SONG'
                    ? 'bg-forest-600 text-white border-forest-600 shadow-md'
                    : 'bg-savanna-100 hover:bg-savanna-200 text-savanna-900 border-brand-200'
                }`}
              >
                🎶 Chant
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Titre en Lari *
              </label>
              <input
                type="text"
                value={titleNative}
                onChange={(e) => setTitleNative(e.target.value)}
                placeholder="ex: Moko Mosi"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-sm font-bold text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Titre en Français
              </label>
              <input
                type="text"
                value={titleFr}
                onChange={(e) => setTitleFr(e.target.value)}
                placeholder="ex: Une Seule Main"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Nom de l'Aîné ou Raconteur *
            </label>
            <input
              type="text"
              value={elderSpeakerName}
              onChange={(e) => setElderSpeakerName(e.target.value)}
              placeholder="ex: Papa Jean-Baptiste (Pointe-Noire)"
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-bold text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Contenu / Récit en Lari *
            </label>
            <textarea
              value={contentNative}
              onChange={(e) => setContentNative(e.target.value)}
              placeholder="Écrivez le texte ou la transcription en Lari..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Traduction ou Explication en Français
            </label>
            <textarea
              value={contentFr}
              onChange={(e) => setContentFr(e.target.value)}
              placeholder="Signification en français..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Morale ou Leçon de Vie
            </label>
            <input
              type="text"
              value={moralLesson}
              onChange={(e) => setMoralLesson(e.target.value)}
              placeholder="ex: La solidarité et le travail d'équipe..."
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-forest-700 to-emerald-600 hover:from-forest-800 hover:to-emerald-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Soumettre au Patrimoine Linguistique</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
