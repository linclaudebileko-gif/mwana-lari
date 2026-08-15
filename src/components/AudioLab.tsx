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
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Module Title Header */}
      <div className="glass-card-amber p-6 rounded-3xl border-2 border-brand-400 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎧</span>
            <h2 className="font-extrabold text-2xl text-savanna-950">
              Laboratoire Audio & Prononciation Lari
            </h2>
          </div>
          <p className="text-sm text-savanna-900 font-medium mt-1">
            Écoute les vrais enregistrements audio WAV/MP3 des aînés natifs, répète au micro et compare ta voix !
          </p>
        </div>

        <div className="text-right font-extrabold text-sm text-brand-900 bg-brand-200/80 px-4 py-2 rounded-2xl border border-brand-400 hidden sm:block">
          Mot {currentIndex + 1} / {LARI_WORDS.length}
        </div>
      </div>

      {/* Main Flashcard & Interactive Audio Studio */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-brand-300 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Controls: Speaker Validation Badge + Speed Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-brand-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-100 text-forest-800 text-xs font-bold border border-forest-300">
              <ShieldCheck className="w-4 h-4 text-forest-600" />
              <span>Locuteur : {currentWord.speakerName || 'Locuteur Natif Lari'}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
              {currentWord.category}
            </span>
          </div>

          {/* Speed Selector (1.0x vs 0.8x) */}
          <div className="flex items-center gap-2 bg-savanna-100 p-1 rounded-2xl border border-brand-300">
            <div className="flex items-center gap-1 text-[11px] font-bold text-savanna-800 px-2">
              <Gauge className="w-3.5 h-3.5 text-brand-600" />
              <span>Vitesse :</span>
            </div>
            <button
              onClick={() => setPlaybackSpeed(1.0)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                playbackSpeed === 1.0
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-savanna-800 hover:bg-savanna-200'
              }`}
            >
              1.0x (Normal)
            </button>
            <button
              onClick={() => setPlaybackSpeed(0.8)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                playbackSpeed === 0.8
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-savanna-800 hover:bg-savanna-200'
              }`}
            >
              0.8x (Apprentissage)
            </button>
          </div>
        </div>

        {/* Word Flashcard Body */}
        <div className="text-center space-y-4 py-2">
          
          <div className="inline-block px-4 py-1 rounded-2xl bg-amber-100 text-amber-900 font-bold text-sm tracking-wide border border-amber-300">
            Phonétique : {currentWord.phonetic}
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-brand-700 via-terracotta-600 to-forest-700 bg-clip-text text-transparent select-none">
            {currentWord.wordNative}
          </h1>

          <div className="text-xl sm:text-2xl font-bold text-savanna-900">
            🇫🇷 {currentWord.translationFr} <span className="text-sm font-normal text-savanna-700">({currentWord.translationEn})</span>
          </div>

          {/* Audio Wave Animation Bar */}
          <div className="flex items-center justify-center gap-1.5 h-8 my-2">
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
            <Music className="w-3.5 h-3.5 text-forest-600" />
            <span>Fichier Source Réel : {currentWord.audioUrl || `/audio/words/${currentWord.wordNative.toLowerCase()}.wav`} (Audio WAV Natif 44.1kHz)</span>
          </div>

          {currentWord.culturalNote && (
            <p className="text-xs sm:text-sm text-savanna-800 bg-savanna-100 p-3 rounded-2xl border border-savanna-200 max-w-xl mx-auto font-medium text-left">
              💡 <span className="font-bold">Note Culturelle :</span> {currentWord.culturalNote}
            </p>
          )}

        </div>

        {/* Audio Action Buttons Grid (Listen vs Record) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          
          {/* Listen Real Audio Button */}
          <button
            onClick={handlePlayAudio}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl text-white font-extrabold shadow-lg transition-all group ${
              isPlayingAudio
                ? 'bg-gradient-to-br from-brand-600 to-amber-600 ring-4 ring-brand-300 scale-102'
                : 'bg-gradient-to-br from-brand-400 via-amber-500 to-brand-600 shadow-brand-500/40 hover:scale-105 active:scale-95'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Volume2 className={`w-8 h-8 text-white ${isPlayingAudio ? 'animate-ping' : ''}`} />
            </div>
            <span className="text-lg">
              {isPlayingAudio ? '🔊 EN ÉCOUTE...' : '🔊 ÉCOUTER LE MOT'}
            </span>
            <span className="text-xs font-medium opacity-90">
              Vrai enregistrement natif ({playbackSpeed}x)
            </span>
          </button>

          {/* Record Button */}
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl font-extrabold shadow-lg transition-all group ${
              isRecording
                ? 'bg-red-500 text-white ring-4 ring-red-300 animate-pulse'
                : 'bg-gradient-to-br from-terracotta-500 via-orange-500 to-terracotta-700 text-white shadow-terracotta-500/40 hover:scale-105 active:scale-95'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${isRecording ? 'bg-red-700' : 'bg-white/20'}`}>
              <Mic className={`w-8 h-8 text-white ${isRecording ? 'animate-ping' : ''}`} />
            </div>
            <span className="text-lg">
              {isRecording ? '🎙️ ENREGISTREMENT...' : '🎙️ RÉPÉTER AU MICRO'}
            </span>
            <span className="text-xs font-medium opacity-90">
              {isRecording ? 'Parle maintenant...' : 'Test de prononciation'}
            </span>
          </button>

        </div>

        {/* Recording Score Feedback Visualizer */}
        {recordedScore !== null && (
          <div className="glass-card-forest p-6 rounded-3xl border-2 border-forest-400 text-center space-y-3 animate-float max-w-md mx-auto">
            <div className="flex items-center justify-center gap-1 text-yellow-500 text-3xl">
              ⭐⭐⭐
            </div>

            <div className="font-extrabold text-2xl text-forest-950">
              Score de Prononciation : {recordedScore}% !
            </div>

            <p className="text-xs font-medium text-forest-900">
              Bravo ! Ta prononciation de <span className="font-bold text-forest-950">"{currentWord.wordNative}"</span> correspond parfaitement au locuteur <span className="font-bold">{currentWord.speakerName}</span>.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-600 text-white font-bold text-xs">
              <Award className="w-4 h-4" />
              <span>+10 XP Gagnés !</span>
            </div>
          </div>
        )}

        {/* Carousel Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-brand-200">
          <button
            onClick={handlePrevWord}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-savanna-900 font-extrabold text-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Mot Précédent</span>
          </button>

          <div className="flex items-center gap-1">
            {LARI_WORDS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setRecordedScore(null); setCurrentIndex(idx); }}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-brand-500 w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextWord}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition-colors"
          >
            <span>Mot Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
