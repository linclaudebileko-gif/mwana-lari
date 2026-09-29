import React, { useState, useRef, useEffect } from 'react';
import { heritageAPI } from '../services/api';
import { CulturalStory } from '../types';
import { X, Mic, Square, Play, Pause, Volume2, Sparkles, CheckCircle2, AlertCircle, Send, MapPin, User, Upload, Trash2 } from 'lucide-react';
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
  const [originLocation, setOriginLocation] = useState('Brazzaville (Bacongo)');
  const [moralLesson, setMoralLesson] = useState('');

  // Audio Recording & Import State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      if (isRecording) stopRecording();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setAudioUrl(null);
      setAudioFileName(null);
      setIsPlayingRecordedAudio(false);
      setRecordingTime(0);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local file import (WAV, MP3, M4A, OGG, WEBM)
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
      setRecordingTime(120);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Start microphone recording
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
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
          setAudioFileName(`enregistrement_conte_${Date.now()}.webm`);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      setError('Impossible d\'accéder au microphone. Vous pouvez importer un fichier audio ci-dessous.');
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Play / Pause preview of recorded/imported voice
  const togglePlayRecordedAudio = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current || audioPlayerRef.current.src !== audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingRecordedAudio(false);
      audioPlayerRef.current.onerror = () => setIsPlayingRecordedAudio(false);
    }

    if (isPlayingRecordedAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingRecordedAudio(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlayingRecordedAudio(true);
      }).catch((err) => {
        console.warn('Play error:', err);
        setIsPlayingRecordedAudio(false);
      });
    }
  };

  const handleRemoveAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setIsPlayingRecordedAudio(false);
    setRecordingTime(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleNative.trim() || !contentNative.trim() || !elderSpeakerName.trim()) {
      setError('Veuillez renseigner le titre en Lari, le texte et le nom du grand-parent / aîné.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fullSpeakerLabel = `${elderSpeakerName.trim()} (${originLocation})`;

      const res = await heritageAPI.contributeStory({
        type,
        titleNative: titleNative.trim(),
        titleFr: titleFr.trim() || titleNative.trim(),
        contentNative: contentNative.trim(),
        contentFr: contentFr.trim(),
        elderSpeakerName: fullSpeakerLabel,
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
          elderSpeakerName: fullSpeakerLabel,
          durationSeconds: recordingTime > 0 ? recordingTime : 120,
          moralLesson: moralLesson.trim(),
          category: type === 'PROVERB' ? 'Proverbes & Sagesse' : type === 'SONG' ? 'Chants des Aînés' : 'Contes Traditionnels',
          audioUrl: audioUrl || undefined,
        });
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de la contribution.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
            Studio Vocal des Bambuta (Aînés)
          </h2>
          <p className="text-xs text-forest-900 font-medium">
            Enregistrez ou importez les contes, proverbes et sagesses Lari des aînés
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
            <span>Récit et voix enregistrés avec succès dans le patrimoine familial !</span>
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

          {/* STUDIO D'ENREGISTREMENT & IMPORTATION AUDIO */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-100 via-amber-100 to-forest-100 border border-brand-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎙️</span>
                <span className="text-xs font-extrabold text-savanna-950">
                  Voix de l'Aîné(e) (Microphone ou Fichier)
                </span>
              </div>
              {isRecording && (
                <span className="flex items-center gap-1 text-xs font-extrabold text-red-600 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  {formatTime(recordingTime)}
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
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-forest-50 border border-forest-300 text-forest-900 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-forest-600" />
                  <span>Importer un fichier audio</span>
                </button>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="py-2.5 px-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Mic className="w-3.5 h-3.5 text-brand-300" />
                    <span>Enregistrer au micro</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Arrêter ({formatTime(recordingTime)})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-forest-300 shadow-sm gap-2">
                <button
                  type="button"
                  onClick={togglePlayRecordedAudio}
                  className="px-3 py-1.5 rounded-lg bg-forest-600 hover:bg-forest-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isPlayingRecordedAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Écouter le récit</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] font-bold text-forest-950 truncate flex-1 px-1">
                  {audioFileName || 'Enregistrement vocal attaché'}
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

            {audioUrl && (
              <p className="text-[11px] text-forest-900 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                Voix de l'aîné(e) capturée et prête à être transmise !
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Titre en Lari *
              </label>
              <input
                type="text"
                value={titleNative}
                onChange={(e) => setTitleNative(e.target.value)}
                placeholder="ex: Koko mosi..."
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
                placeholder="ex: L'union fait la force"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-sm font-medium text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-forest-700" />
                Nom de l'Aîné(e) / Conteur *
              </label>
              <input
                type="text"
                value={elderSpeakerName}
                onChange={(e) => setElderSpeakerName(e.target.value)}
                placeholder="ex: Mbuta Papa Jean-Baptiste"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-bold text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-forest-700" />
                Origine / Quartier
              </label>
              <input
                type="text"
                value={originLocation}
                onChange={(e) => setOriginLocation(e.target.value)}
                placeholder="ex: Brazzaville (Bacongo)"
                className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Texte du Récit en Lari *
            </label>
            <textarea
              value={contentNative}
              onChange={(e) => setContentNative(e.target.value)}
              placeholder="Rédigez ou transcrivez le proverbe ou conte en Lari..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Traduction / Explication en Français
            </label>
            <textarea
              value={contentFr}
              onChange={(e) => setContentFr(e.target.value)}
              placeholder="Sens général et traduction en français..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-savanna-900 mb-1">
              Leçon Morale / Sagesse Transmise
            </label>
            <input
              type="text"
              value={moralLesson}
              onChange={(e) => setMoralLesson(e.target.value)}
              placeholder="ex: La solidarité est le pilier du clan..."
              className="w-full px-3.5 py-2 rounded-xl bg-savanna-50/70 border border-forest-300 text-xs font-medium text-savanna-950 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-forest-600 to-emerald-500 hover:from-forest-700 hover:to-emerald-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmettre & Enregistrer le Patrimoine</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
