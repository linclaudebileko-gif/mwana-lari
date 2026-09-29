import React, { useState, useRef } from 'react';
import { wordsAPI } from '../services/api';
import { WordItem } from '../types';
import { X, Plus, BookOpen, CheckCircle2, AlertCircle, Sparkles, Upload, Mic, Square, Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWordAdded: (word: WordItem) => void;
}

const CATEGORIES = ['Salutations', 'Famille', 'Maison', 'Nourriture', 'Animaux', 'Nombres', 'Culture', 'Corps Humain', 'Nature', 'Actions & Verbes', 'Vocabulaire Général'];

export const AddWordModal: React.FC<AddWordModalProps> = ({ isOpen, onClose, onWordAdded }) => {
  const [wordNative, setWordNative] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [translationFr, setTranslationFr] = useState('');
  const [translationEn, setTranslationEn] = useState('');
  const [category, setCategory] = useState('Salutations');
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [culturalNote, setCulturalNote] = useState('');
  const [exampleSentenceNative, setExampleSentenceNative] = useState('');
  const [exampleSentenceFr, setExampleSentenceFr] = useState('');
  const [speakerName, setSpeakerName] = useState('');

  // Audio import & recording state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file upload (WAV, MP3, M4A, OGG, WEBM)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|m4a|ogg|webm)$/i.test(file.name)) {
      setError('Format audio non supporté. Veuillez sélectionner un fichier .wav, .mp3, .m4a ou .ogg.');
      return;
    }

    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAudioUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Start mic recording
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
          setAudioFileName(`enregistrement_vocal_${Date.now()}.webm`);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setError('Impossible d\'accéder au microphone. Vous pouvez importer un fichier audio ci-dessous.');
    }
  };

  // Stop mic recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Toggle play audio preview
  const togglePlayAudio = () => {
    if (!audioUrl) return;

    if (!previewAudioRef.current || previewAudioRef.current.src !== audioUrl) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      previewAudioRef.current.onerror = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((e) => {
        console.warn('Preview error:', e);
        setIsPlayingPreview(false);
      });
    }
  };

  const handleRemoveAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setIsPlayingPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordNative.trim() || !translationFr.trim()) {
      setError('Veuillez renseigner le mot en Lari et sa traduction française.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newWord = await wordsAPI.createWord({
        wordNative: wordNative.trim(),
        phonetic: phonetic.trim() || `[${wordNative.toLowerCase().trim()}]`,
        translationFr: translationFr.trim(),
        translationEn: translationEn.trim(),
        category,
        difficultyLevel,
        culturalNote: culturalNote.trim(),
        exampleSentenceNative: exampleSentenceNative.trim(),
        exampleSentenceFr: exampleSentenceFr.trim(),
        speakerName: speakerName.trim() || undefined,
        audioUrl: audioUrl || undefined,
      });

      playSuccessChime();
      onWordAdded({
        ...newWord,
        audioUrl: audioUrl || newWord.audioUrl || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement du mot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 border-2 border-blue-300 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-savanna-950">
            Enrichir le Dictionnaire Lari
          </h2>
          <p className="text-xs text-savanna-800 font-medium">
            Ajoutez un nouveau mot au corpus linguistique avec son audio authentique
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Mot en Lari *
              </label>
              <input
                type="text"
                value={wordNative}
                onChange={(e) => setWordNative(e.target.value)}
                placeholder="ex: Kiese"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-sm font-bold text-savanna-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Phonétique
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="ex: [kye-se]"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Traduction Français *
              </label>
              <input
                type="text"
                value={translationFr}
                onChange={(e) => setTranslationFr(e.target.value)}
                placeholder="ex: Joie / Bonheur"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-sm font-bold text-savanna-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Traduction Anglais
              </label>
              <input
                type="text"
                value={translationEn}
                onChange={(e) => setTranslationEn(e.target.value)}
                placeholder="ex: Joy / Happiness"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* AUDIO ATTACHMENT SECTION (FILE IMPORT OR MIC RECORDING) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Audio de prononciation (Fichier ou Micro)</span>
              </span>
              {isRecording && (
                <span className="text-xs font-extrabold text-red-600 animate-pulse">
                  ● En cours ({recordingSeconds}s)
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.m4a,.ogg,.webm,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!audioUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-blue-50 border border-blue-300 text-blue-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Importer un fichier (.wav/.mp3)</span>
                </button>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Mic className="w-3.5 h-3.5 text-blue-200" />
                    <span>Enregistrer au micro</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Arrêter ({recordingSeconds}s)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-blue-200 shadow-sm gap-2">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Écouter l'audio</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] font-bold text-savanna-800 truncate flex-1 px-1">
                  {audioFileName || 'Audio attaché'}
                </span>

                <button
                  type="button"
                  onClick={handleRemoveAudio}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer l'audio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Locuteur / Référent
              </label>
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="ex: Mamma Pauline (Brazzaville)"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Phrase d'Exemple (Lari & Français)
            </label>
            <input
              type="text"
              value={exampleSentenceNative}
              onChange={(e) => setExampleSentenceNative(e.target.value)}
              placeholder="En Lari: Beto ke na kiese..."
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <input
              type="text"
              value={exampleSentenceFr}
              onChange={(e) => setExampleSentenceFr(e.target.value)}
              placeholder="En Français: Nous sommes dans la joie..."
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Note Culturelle & Historique
            </label>
            <textarea
              value={culturalNote}
              onChange={(e) => setCulturalNote(e.target.value)}
              placeholder="Expliquez la symbolique ou le contexte traditionnel de ce mot..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-blue-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Enregistrer le Mot dans le Dictionnaire</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
