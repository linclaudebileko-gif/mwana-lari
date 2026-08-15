import React, { useState } from 'react';
import { Volume2, Sparkles, MessageCircle, Music } from 'lucide-react';
import { playKokoVoice, playLariWordAudio } from '../utils/audio';

interface KokoMascotProps {
  message?: string;
  expression?: 'happy' | 'excited' | 'thinking' | 'proud';
  audioPhrase?: string;
}

export const KokoMascot: React.FC<KokoMascotProps> = ({
  message = "Mbote, mwana ! 👋 Je suis Koko. Prêt à découvrir 5 nouveaux mots en Lari aujourd'hui ?",
  expression = 'happy',
  audioPhrase = 'Mbote mwana lari'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeech = () => {
    setIsPlaying(true);
    const audio = playKokoVoice('koko_welcome', {
      onEnd: () => setIsPlaying(false)
    });
    if (!audio) {
      playLariWordAudio('mbote', {
        onEnd: () => setIsPlaying(false)
      });
    }
  };

  return (
    <div className="relative flex items-end gap-4 p-4 glass-card-amber rounded-3xl border-2 border-brand-400/50 shadow-lg my-4 animate-float">
      {/* Koko Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-brand-400 to-terracotta-500 p-1 shadow-md shadow-brand-500/40 flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer" onClick={handleSpeech}>
          <div className="w-full h-full bg-amber-50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Cute Mascot Illustration */}
            <span className="text-4xl sm:text-5xl select-none animate-bounce">
              🦊
            </span>
            <div className="absolute bottom-1 px-2 py-0.5 rounded-full bg-brand-500 text-white font-extrabold text-[10px]">
              KOKO
            </div>
          </div>
        </div>

        {/* Audio trigger button on mascot */}
        <button
          onClick={handleSpeech}
          className={`absolute -top-2 -right-2 p-2 rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600 transition-all ${isPlaying ? 'scale-115 ring-4 ring-brand-300 animate-ping' : ''}`}
          title="Écouter Koko"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 bg-white/95 rounded-2xl p-4 border border-brand-300 shadow-sm relative">
        {/* Tail triangle */}
        <div className="absolute -left-2 bottom-5 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
        
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-800 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-400" />
              <span>Koko te dit :</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-savanna-900 leading-snug">
              {message}
            </p>
          </div>
          
          <button
            onClick={handleSpeech}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-100 text-brand-900 border border-brand-300 hover:bg-brand-200 transition-colors flex-shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>🔊 Écouter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
