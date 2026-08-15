// Audio utility for real native Lari audio playback, Web Audio API procedural synthesis, and resilient multi-tier fallback

// Comprehensive mapping for all authentic Lari audio words (MBUTA style)
const LARI_WORD_AUDIO_MAP: Record<string, string> = {
  'mbote': '/audio/words/mbote.wav',
  'mbuta': '/audio/words/mbuta.wav',
  'bweni': '/audio/words/bweni.wav',
  'ntondele': '/audio/words/ntondele.wav',
  'iza': '/audio/words/iza.wav',
  'muntu': '/audio/words/muntu.wav',
  'bantu': '/audio/words/bantu.wav',
  'mama': '/audio/words/mama.wav',
  'tata': '/audio/words/tata.wav',
  'mwana': '/audio/words/mwana.wav',
  'bana': '/audio/words/bana.wav',
  'yaya': '/audio/words/yaya.wav',
  'leke': '/audio/words/leke.wav',
  'nzo': '/audio/words/nzo.wav',
  'mukanda': '/audio/words/mukanda.wav',
  'masa': '/audio/words/masa.wav',
  'madiya': '/audio/words/madiya.wav',
  'muti': '/audio/words/muti.wav',
  'nzadi': '/audio/words/nzadi.wav',
  'kudia': '/audio/words/kudia.wav',
  'sakasaka': '/audio/words/sakasaka.wav',
  'nsamu': '/audio/words/nsamu.wav',
  'kuvova': '/audio/words/kuvova.wav',
  'kuzola': '/audio/words/kuzola.wav',
  'kusala': '/audio/words/kusala.wav',
  'kiese': '/audio/words/kiese.wav',
  'ngolo': '/audio/words/ngolo.wav',
  'kingana': '/audio/words/kingana.wav',
  'matondo': '/audio/words/matondo.wav',
  'ingeta': '/audio/words/ingeta.wav',
  'mosi': '/audio/words/mosi.wav',
  'zole': '/audio/words/zole.wav',
  'tatu': '/audio/words/tatu.wav',
  'nkosi': '/audio/words/nkosi.wav',
  'nkulu': '/audio/words/nkulu.wav',
};

const LARI_STORY_AUDIO_MAP: Record<string, string> = {
  's1': '/audio/stories/nkosi_na_mbolo.wav',
  's2': '/audio/stories/kongo_dia_ntotila.wav',
  's3': '/audio/stories/nkimba_ya_mwana.wav',
  's4': '/audio/stories/ngo_na_nsusu.wav',
  's5': '/audio/stories/luzolo_lwa_koko.wav',
  'nkosi_na_mbolo': '/audio/stories/nkosi_na_mbolo.wav',
  'kongo_dia_ntotila': '/audio/stories/kongo_dia_ntotila.wav',
  'nkimba_ya_mwana': '/audio/stories/nkimba_ya_mwana.wav',
  'ngo_na_nsusu': '/audio/stories/ngo_na_nsusu.wav',
  'luzolo_lwa_koko': '/audio/stories/luzolo_lwa_koko.wav',
};

const KOKO_AUDIO_MAP: Record<string, string> = {
  'koko_welcome': '/audio/koko/koko_welcome.wav',
  'koko_bravo': '/audio/koko/koko_bravo.wav',
  'koko_tryagain': '/audio/koko/koko_tryagain.wav',
};

// Global active audio reference
let activeAudioElement: HTMLAudioElement | null = null;
let sharedAudioContext: AudioContext | null = null;

// Get or initialize Web Audio Context with auto-resume on interaction
export const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioContext) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioContext = new AudioCtxClass();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch (e) {
    console.warn('AudioContext creation failed:', e);
    return null;
  }
};

// Helper: Normalize Lari words properly (e.g., "Muntù" -> "muntu", "Mbuta" -> "mbuta", "Saka-saka" -> "sakasaka")
export const normalizeLariWord = (word: string): string => {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritics
    .replace(/[^a-z0-9]/g, '');      // strip spaces, apostrophes, hyphens
};

// Phonetic Formant Specs for Web Audio Procedural Voice Synthesizer
interface SyllableSpec {
  f1: number;
  f2: number;
  pitchMod?: number;
}

const PROCEDURAL_WORD_SYNTH_SPECS: Record<string, { duration: number; f0: number; syllables: SyllableSpec[] }> = {
  'mbote': { duration: 1.2, f0: 175, syllables: [{ f1: 400, f2: 1000, pitchMod: 1.0 }, { f1: 500, f2: 1800, pitchMod: 1.15 }] },
  'mbuta': { duration: 1.2, f0: 160, syllables: [{ f1: 350, f2: 900, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 1.2 }] },
  'bweni': { duration: 1.1, f0: 180, syllables: [{ f1: 500, f2: 1800, pitchMod: 1.15 }, { f1: 300, f2: 2200, pitchMod: 0.95 }] },
  'ntondele': { duration: 1.3, f0: 170, syllables: [{ f1: 500, f2: 1000, pitchMod: 0.95 }, { f1: 500, f2: 1800, pitchMod: 1.15 }, { f1: 500, f2: 1800, pitchMod: 0.9 }] },
  'iza': { duration: 1.0, f0: 185, syllables: [{ f1: 300, f2: 2200, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'muntu': { duration: 1.2, f0: 170, syllables: [{ f1: 350, f2: 900, pitchMod: 0.95 }, { f1: 350, f2: 850, pitchMod: 1.2 }] },
  'bantu': { duration: 1.2, f0: 170, syllables: [{ f1: 750, f2: 1200, pitchMod: 0.95 }, { f1: 350, f2: 850, pitchMod: 1.2 }] },
  'mama': { duration: 1.1, f0: 190, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'tata': { duration: 1.1, f0: 165, syllables: [{ f1: 700, f2: 1300, pitchMod: 1.05 }, { f1: 700, f2: 1300, pitchMod: 0.95 }] },
  'mwana': { duration: 1.3, f0: 185, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 750, f2: 1250, pitchMod: 1.1 }, { f1: 750, f2: 1200, pitchMod: 1.0 }] },
  'bana': { duration: 1.1, f0: 180, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'yaya': { duration: 1.1, f0: 185, syllables: [{ f1: 750, f2: 1250, pitchMod: 1.15 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'leke': { duration: 1.1, f0: 180, syllables: [{ f1: 550, f2: 1800, pitchMod: 1.1 }, { f1: 550, f2: 1800, pitchMod: 0.9 }] },
  'nzo': { duration: 1.1, f0: 160, syllables: [{ f1: 450, f2: 950, pitchMod: 1.15 }] },
  'mukanda': { duration: 1.3, f0: 170, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 750, f2: 1250, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.9 }] },
  'masa': { duration: 1.1, f0: 180, syllables: [{ f1: 750, f2: 1200, pitchMod: 0.95 }, { f1: 700, f2: 1400, pitchMod: 1.2 }] },
  'madiya': { duration: 1.2, f0: 180, syllables: [{ f1: 750, f2: 1200, pitchMod: 0.95 }, { f1: 300, f2: 2200, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'muti': { duration: 1.1, f0: 175, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 300, f2: 2200, pitchMod: 1.2 }] },
  'nzadi': { duration: 1.2, f0: 165, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.2 }, { f1: 300, f2: 2200, pitchMod: 0.95 }] },
  'kudia': { duration: 1.2, f0: 180, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 300, f2: 2200, pitchMod: 1.2 }] },
  'sakasaka': { duration: 1.4, f0: 180, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 1.0 }] },
  'nsamu': { duration: 1.2, f0: 170, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.15 }, { f1: 350, f2: 850, pitchMod: 0.95 }] },
  'kuvova': { duration: 1.2, f0: 170, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 500, f2: 950, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'kuzola': { duration: 1.2, f0: 175, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 500, f2: 950, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'kusala': { duration: 1.2, f0: 175, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 750, f2: 1200, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'kiese': { duration: 1.2, f0: 190, syllables: [{ f1: 300, f2: 2200, pitchMod: 1.2 }, { f1: 550, f2: 1800, pitchMod: 1.0 }, { f1: 550, f2: 1800, pitchMod: 0.9 }] },
  'ngolo': { duration: 1.1, f0: 165, syllables: [{ f1: 500, f2: 950, pitchMod: 1.2 }, { f1: 500, f2: 950, pitchMod: 0.95 }] },
  'kingana': { duration: 1.3, f0: 175, syllables: [{ f1: 300, f2: 2200, pitchMod: 0.95 }, { f1: 750, f2: 1200, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'matondo': { duration: 1.2, f0: 175, syllables: [{ f1: 750, f2: 1200, pitchMod: 0.95 }, { f1: 500, f2: 950, pitchMod: 1.2 }, { f1: 500, f2: 950, pitchMod: 0.95 }] },
  'ingeta': { duration: 1.2, f0: 180, syllables: [{ f1: 300, f2: 2200, pitchMod: 0.95 }, { f1: 550, f2: 1800, pitchMod: 1.2 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'mosi': { duration: 1.1, f0: 175, syllables: [{ f1: 500, f2: 950, pitchMod: 1.2 }, { f1: 300, f2: 2200, pitchMod: 0.95 }] },
  'zole': { duration: 1.1, f0: 165, syllables: [{ f1: 500, f2: 950, pitchMod: 1.2 }, { f1: 550, f2: 1750, pitchMod: 0.95 }] },
  'tatu': { duration: 1.1, f0: 170, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.2 }, { f1: 350, f2: 850, pitchMod: 0.95 }] },
  'nkosi': { duration: 1.2, f0: 170, syllables: [{ f1: 500, f2: 1000, pitchMod: 1.2 }, { f1: 300, f2: 2200, pitchMod: 0.95 }] },
  'nkulu': { duration: 1.3, f0: 155, syllables: [{ f1: 350, f2: 900, pitchMod: 1.0 }, { f1: 350, f2: 850, pitchMod: 0.9 }] },
};

// Procedural Formant Vocal Synthesizer (Zero-dependency Web Audio API Engine)
export const playProceduralVocal = (
  wordKey: string,
  options?: { playbackRate?: number; onEnd?: () => void }
) => {
  const ctx = getAudioContext();
  if (!ctx) {
    if (options?.onEnd) options.onEnd();
    return;
  }

  const clean = normalizeLariWord(wordKey);
  const spec = PROCEDURAL_WORD_SYNTH_SPECS[clean] || {
    duration: 1.2,
    f0: 175,
    syllables: [
      { f1: 600, f2: 1400, pitchMod: 1.0 },
      { f1: 500, f2: 1700, pitchMod: 1.1 },
    ],
  };

  const rate = options?.playbackRate || 1.0;
  const duration = (spec.duration / rate);
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  const syllables = spec.syllables;
  const numSyl = syllables.length || 1;
  const sylDuration = duration / numSyl;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sylIndex = Math.min(Math.floor(t / sylDuration), numSyl - 1);
    const sylT = (t % sylDuration) / sylDuration;

    const config = syllables[sylIndex];
    const currentF0 = spec.f0 * (config.pitchMod || 1.0) * (1 + 0.02 * Math.sin(2 * Math.PI * 5.5 * t));

    let env = 1.0;
    if (sylT < 0.15) env = sylT / 0.15;
    else if (sylT > 0.75) env = (1.0 - sylT) / 0.25;

    const phase = (t * currentF0) % 1.0;
    const glottal = Math.sin(2 * Math.PI * phase) * Math.exp(-3 * phase);

    const f1 = config.f1 || 600;
    const f2 = config.f2 || 1400;
    const f3 = 2400;

    const r1 = Math.sin(2 * Math.PI * f1 * t) * 0.5;
    const r2 = Math.sin(2 * Math.PI * f2 * t) * 0.3;
    const r3 = Math.sin(2 * Math.PI * f3 * t) * 0.15;

    channelData[i] = env * glottal * (r1 + r2 + r3) * 0.8;
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.onended = () => {
    if (options?.onEnd) options.onEnd();
  };

  source.start(ctx.currentTime);
};

// Procedural Story / Sanza soundscape (Kalimba + ambient warmth)
export const playProceduralStory = (
  durationSec: number = 4.0,
  options?: { playbackRate?: number; onEnd?: () => void }
) => {
  const ctx = getAudioContext();
  if (!ctx) {
    if (options?.onEnd) options.onEnd();
    return;
  }

  const duration = durationSec / (options?.playbackRate || 1.0);
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const kalimbaNote = Math.sin(2 * Math.PI * 440 * (1 + Math.floor(t % 3) * 0.25) * t) * Math.exp(-4 * (t % 1.5)) * 0.18;
    const elderF0 = 135 + 10 * Math.sin(2 * Math.PI * 0.4 * t);
    const vocalPhase = (t * elderF0) % 1.0;
    const elderVocal = Math.sin(2 * Math.PI * vocalPhase) * Math.exp(-2.5 * vocalPhase) * (0.3 + 0.2 * Math.sin(2 * Math.PI * 1.5 * t));
    channelData[i] = (kalimbaNote + elderVocal * 0.6) * 0.7;
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.onended = () => {
    if (options?.onEnd) options.onEnd();
  };

  source.start(ctx.currentTime);
};

// Real Audio Player for Words with Multi-tier Resilient Fallback
export const playLariWordAudio = (
  word: string,
  options?: { playbackRate?: number; onEnd?: () => void }
): HTMLAudioElement | null => {
  stopActiveAudio();

  const clean = normalizeLariWord(word);
  const audioSrc = LARI_WORD_AUDIO_MAP[clean] || `/audio/words/${clean}.wav`;

  try {
    const audio = new Audio(audioSrc);
    audio.playbackRate = options?.playbackRate || 1.0;
    activeAudioElement = audio;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (options?.onEnd) options.onEnd();
      }
    };

    audio.onended = finish;

    // Handle playback error or 404
    audio.onerror = () => {
      console.warn(`[Audio] Fichier ${audioSrc} indisponible, bascule sur la synthèse procédurale.`);
      playProceduralVocal(clean, options);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[Audio] HTML5 Audio play error: ${err.message}. Bascule sur la synthèse procédurale.`);
        playProceduralVocal(clean, options);
      });
    }

    return audio;
  } catch (e) {
    console.warn('[Audio] Erreur création Audio:', e);
    playProceduralVocal(clean, options);
    return null;
  }
};

// Play Cultural Story with Multi-tier Playback
export const playStoryAudio = (
  storyId: string,
  options?: { playbackRate?: number; onEnd?: () => void }
): HTMLAudioElement | null => {
  stopActiveAudio();

  const clean = storyId.toLowerCase().trim();
  const audioSrc = LARI_STORY_AUDIO_MAP[clean] || `/audio/stories/${clean}.wav`;

  try {
    const audio = new Audio(audioSrc);
    audio.playbackRate = options?.playbackRate || 1.0;
    activeAudioElement = audio;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (options?.onEnd) options.onEnd();
      }
    };

    audio.onended = finish;

    audio.onerror = () => {
      console.warn(`[Audio] Fichier conte ${audioSrc} indisponible, bascule sur le soundscape Sanza.`);
      playProceduralStory(4.5, options);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[Audio] HTML5 Story play error: ${err.message}. Bascule sur le soundscape.`);
        playProceduralStory(4.5, options);
      });
    }

    return audio;
  } catch (e) {
    console.warn('[Audio] Story audio exception:', e);
    playProceduralStory(4.5, options);
    return null;
  }
};

// Play Koko Mascot Voice
export const playKokoVoice = (
  clipId: 'koko_welcome' | 'koko_bravo' | 'koko_tryagain',
  options?: { onEnd?: () => void }
): HTMLAudioElement | null => {
  stopActiveAudio();
  const audioSrc = KOKO_AUDIO_MAP[clipId] || `/audio/koko/${clipId}.wav`;

  try {
    const audio = new Audio(audioSrc);
    activeAudioElement = audio;
    audio.onended = () => {
      if (options?.onEnd) options.onEnd();
    };
    audio.onerror = () => {
      playSuccessChime();
      if (options?.onEnd) options.onEnd();
    };
    audio.play().catch(() => {
      playSuccessChime();
      if (options?.onEnd) options.onEnd();
    });
    return audio;
  } catch (e) {
    playSuccessChime();
    if (options?.onEnd) options.onEnd();
    return null;
  }
};

// Generic Speak / Play wrapper
export const speakNativeWord = (word: string) => {
  playLariWordAudio(word);
};

// Stop all active audio
export const stopActiveAudio = () => {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Interactive UI Sound Effects (Web Audio API)
export const playSuccessChime = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.28);
    });
  } catch (e) {
    console.warn('Web audio not allowed yet', e);
  }
};

export const playMicBeep = (isStart: boolean) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(isStart ? 880 : 440, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn('Audio Context error', e);
  }
};

export const playErrorSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn('Audio error', e);
  }
};

export const playPopSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn('Audio error', e);
  }
};

export const playVictoryFanfare = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const fanfare = [
      { freq: 392.0, time: 0, dur: 0.12 },
      { freq: 523.25, time: 0.13, dur: 0.12 },
      { freq: 659.25, time: 0.26, dur: 0.12 },
      { freq: 783.99, time: 0.39, dur: 0.45 },
    ];

    fanfare.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0, ctx.currentTime + n.time);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur);
    });
  } catch (e) {
    console.warn('Audio error', e);
  }
};
