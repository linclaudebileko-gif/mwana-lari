import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AgeGroup } from '../types';
import { X, UserPlus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'koko_happy', label: 'Koko Joyeux', emoji: '🦜' },
  { id: 'koko_smart', label: 'Koko Savant', emoji: '🦉' },
  { id: 'koko_explorer', label: 'Koko Explorateur', emoji: '🦁' },
  { id: 'koko_artist', label: 'Koko Artiste', emoji: '🎨' },
];

export const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose }) => {
  const { addChild } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-8');
  const [avatarId, setAvatarId] = useState('koko_happy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Veuillez entrer le prénom de l\'enfant.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await addChild({
        firstName: firstName.trim(),
        ageGroup,
        avatarId,
      });
      playSuccessChime();
      onClose();
      setFirstName('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout de l\'enfant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white/95 border-2 border-brand-300 shadow-2xl p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-brand-500 flex items-center justify-center text-2xl shadow-md">
            👶
          </div>
          <h2 className="text-xl font-extrabold text-savanna-950">
            Ajouter un Profil Enfant
          </h2>
          <p className="text-xs text-savanna-800 font-medium">
            Créez un espace personnalisé pour suivre son parcours en langue Lari
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Prénom de l'Enfant
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex: Kamba, Mireille, Elikia..."
              className="w-full px-4 py-2.5 rounded-2xl bg-savanna-50/70 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Tranche d'Âge
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['3-5', '6-8', '9-11', '12-15'] as AgeGroup[]).map((group) => (
                <button
                  type="button"
                  key={group}
                  onClick={() => setAgeGroup(group)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                    ageGroup === group
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md'
                      : 'bg-savanna-100/80 hover:bg-savanna-200 text-savanna-900 border-brand-200'
                  }`}
                >
                  {group} ans
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Avatar Compagnon
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setAvatarId(av.id)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    avatarId === av.id
                      ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-sm'
                      : 'bg-white hover:bg-savanna-50 border-gray-200 text-savanna-800'
                  }`}
                >
                  <span className="text-xl">{av.emoji}</span>
                  <span className="text-xs">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-terracotta-500 hover:from-brand-600 hover:to-terracotta-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Enregistrer l'Enfant</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
