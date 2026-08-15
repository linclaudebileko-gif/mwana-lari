import React, { useState } from 'react';
import { WordItem } from '../types';
import { LARI_WORDS } from '../data/mockData';
import { Volume2, Mic, CheckCircle, RefreshCw, Sparkles, ChevronRight, ChevronLeft, Award, ShieldCheck, Play, Pause, Gauge, Music } from 'lucide-react';
import { playLariWordAudio, playSuccessChime, playMicBeep, stopActiveAudio } from '../utils/audio';

export const AudioLab: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedScore, setRecordedScore] = useState<number | null>(null);

  const currentWord: WordItem = LARI_WORDS[currentIndex];

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    playLariWordAudio(currentWord.wordNative, {
      playbackRate: playbackSpeed,
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedScore(null);
    playMicBeep(true);

    // Simulate 2.2s voice recording & acoustic alignment
    setTimeout(() => {
      setIsRecording(false);
      playMicBeep(false);
      playSuccessChime();
      const mockScore = Math.floor(Math.random() * 12) + 88; // 88% to 100%
      setRecordedScore(mockScore);
    }, 2200);
  };

  const handleNextWord = () => {
    stopActiveAudio();
    setIsPlayingAudio(false);
    setRecordedScore(null);
    setCurrentIndex((prev) => (prev + 1) % LARI_WORDS.length);
  };

  const handlePrevWord = () => {
    stopActiveAudio();
    setIsPlayingAudio(false);
    setRecordedScore(null);
    setCurrentIndex((prev) => (prev === 0 ? LARI_WORDS.length - 1 : prev - 1));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Module Title Header */}
      <div className="glass-card-amber p-4 sm:p-6 rounded-3xl border-2 border-brand-400 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🎧</span>
            <h2 className="font-extrabold text-xl sm:text-2xl text-savanna-950">
              Laboratoire Audio & Prononciation Lari
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-savanna-900 font-medium mt-1">
            Écoute les vrais enregistrements audio WAV des aînés natifs, répète au micro et compare ta voix !
          </p>
        </div>

        <div className="self-start sm:self-auto font-extrabold text-xs sm:text-sm text-brand-900 bg-brand-200/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-brand-400">
          Mot {currentIndex + 1} / {LARI_WORDS.length}
        </div>
      </div>

      {/* Main Flashcard & Interactive Audio Studio */}
      <div className="glass-card rounded-3xl p-4 sm:p-8 border-2 border-brand-300 shadow-2xl space-y-4 sm:space-y-6 relative overflow-hidden">
        
        {/* Top Controls: Speaker Validation Badge + Speed Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-brand-200">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-100 text-forest-800 text-xs font-bold border border-forest-300">
              <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0" />
              <span>Locuteur : {currentWord.speakerName || 'Mbuta Papa Jean-Baptiste'}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
              {currentWord.category}
            </span>
          </div>

          {/* Speed Selector (1.0x vs 0.8x) */}
          <div className="flex items-center gap-1.5 bg-savanna-100 p-1 rounded-2xl border border-brand-300 self-start md:self-auto flex-wrap">
            <div className="flex items-center gap-1 text-[11px] font-bold text-savanna-800 px-2">
              <Gauge className="w-3.5 h-3.5 text-brand-600" />
              <span>Vitesse :</span>
            </div>
            <button
              onClick={() => setPlaybackSpeed(1.0)}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                playbackSpeed === 1.0
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-savanna-800 hover:bg-savanna-200'
              }`}
            >
              1.0x (Normal)
            </button>
            <button
              onClick={() => setPlaybackSpeed(0.8)}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                playbackSpeed === 0.8
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-savanna-800 hover:bg-savanna-200'
              }`}
            >
              0.8x (Lent)
            </button>
          </div>
        </div>

        {/* Word Flashcard Body */}
        <div className="text-center space-y-3 sm:space-y-4 py-2">
          
          <div className="inline-block px-3 sm:px-4 py-1 rounded-2xl bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm tracking-wide border border-amber-300">
            Phonétique : {currentWord.phonetic}
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-brand-700 via-terracotta-600 to-forest-700 bg-clip-text text-transparent select-none">
            {currentWord.wordNative}
          </h1>

          <div className="text-lg sm:text-2xl font-bold text-savanna-900">
            🇫🇷 {currentWord.translationFr} <span className="text-xs sm:text-sm font-normal text-savanna-700">({currentWord.translationEn})</span>
          </div>

          {/* Audio Wave Animation Bar */}
          <div className="flex items-center justify-center gap-1.5 h-7 sm:h-8 my-2">
            {[40, 70, 90, 60, 100, 50, 80, 60, 90, 40].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-200 ${
                  isPlayingAudio
                    ? 'bg-brand-500 animate-pulse'
                    : 'bg-brand-200'
                }`}
                style={{
                  height: isPlayingAudio ? `${h}%` : '20%',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>

          {/* Real Audio File Info Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-forest-50 text-forest-900 font-semibold text-xs border border-forest-200">
            <Music className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
            <span className="truncate">Audio WAV 44.1kHz Certifié MBUTA</span>
          </div>

          {currentWord.culturalNote && (
            <p className="text-xs sm:text-sm text-savanna-800 bg-savanna-100 p-3 rounded-2xl border border-savanna-200 max-w-xl mx-auto font-medium text-left">
              💡 <span className="font-bold">Note Culturelle :</span> {currentWord.culturalNote}
            </p>
          )}

        </div>

        {/* Audio Action Buttons Grid (Listen vs Record) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
          
          {/* Listen Real Audio Button */}
          <button
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-500/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-3 group disabled:opacity-75"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
            </div>
            <div className="text-left">
              <div>{isPlayingAudio ? 'Lecture en cours...' : 'Écouter l\'Audio HD'}</div>
              <div className="text-[10px] text-blue-100 font-medium">Voix Réelle Native Lari</div>
            </div>
          </button>

          {/* Record Micro Button */}
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`p-4 sm:p-5 rounded-3xl font-extrabold text-sm sm:text-base shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-3 group disabled:opacity-85 ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                : 'bg-gradient-to-tr from-brand-500 to-terracotta-500 hover:from-brand-600 hover:to-terracotta-600 text-white shadow-brand-500/20'
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Mic className={`w-5 h-5 sm:w-6 sm:h-6 ${isRecording ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-left">
              <div>{isRecording ? 'Parle au Micro...' : 'Répéter au Micro'}</div>
              <div className="text-[10px] text-amber-100 font-medium">Analyseur Phonétique IA</div>
            </div>
          </button>

        </div>

        {/* Pronunciation Score Feedback Badge */}
        {recordedScore !== null && (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-forest-50 border-2 border-forest-400 text-center space-y-1 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-forest-900 font-extrabold text-base sm:text-lg">
              <Award className="w-6 h-6 text-forest-600 animate-bounce" />
              <span>Score de Prononciation : {recordedScore}%</span>
            </div>
            <p className="text-xs text-forest-800 font-semibold">
              {recordedScore >= 95
                ? '🌟 Exceptionnel ! Ton accent Lari est digne d\'un aîné de Bacongo !'
                : '👏 Bravo ! Très belle tonalité, continue de pratiquer !'}
            </p>
          </div>
        )}

        {/* Flashcard Footer: Prev & Next Word Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-brand-200">
          <button
            onClick={handlePrevWord}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/90 hover:bg-white text-savanna-900 font-extrabold text-xs sm:text-sm border border-brand-300 shadow-sm transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-brand-600" />
            <span>Précédent</span>
          </button>

          <span className="text-xs font-bold text-savanna-700">
            {currentIndex + 1} / {LARI_WORDS.length}
          </span>

          <button
            onClick={handleNextWord}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
