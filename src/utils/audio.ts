import audioMapData from '../data/audioMap.json';

// Comprehensive mapping for all authentic Lari audio words (MBUTA style + authentic Pool recordings)
const CONVERTED_AUDIO_MAP: Record<string, string> = (audioMapData || {}) as Record<string, string>;

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
  'muana': '/audio/words/mwana.wav',
  'bana': '/audio/words/bana.wav',
  'yaya': '/audio/words/yaya.wav',
  'leke': '/audio/words/leke.wav',
  'nzo': '/audio/words/nzo.wav',
  'mukanda': '/audio/words/mukanda.wav',
  'masa': '/audio/words/masa.wav',
  'maza': '/audio/words/masa.wav',
  'madiya': '/audio/words/madiya.wav',
  'madia': '/audio/words/madiya.wav',
  'muti': '/audio/words/muti.wav',
  'nzadi': '/audio/words/nzadi.wav',
  'kudia': '/audio/words/kudia.wav',
  'sakasaka': '/audio/words/sakasaka.wav',
  'nsamu': '/audio/words/nsamu.wav',
  'kuvova': '/audio/words/kuvova.wav',
  'kuzola': '/audio/words/kuzola.wav',
  'kusala': '/audio/words/kusala.wav',
  'kiese': '/audio/words/kiese.wav',
  'kyese': '/audio/words/kiese.wav',
  'ngolo': '/audio/words/ngolo.wav',
  'kingana': '/audio/words/kingana.wav',
  'matondo': '/audio/words/matondo.wav',
  'ingeta': '/audio/words/ingeta.wav',
  'wambote': '/audio/words/wambote.wav',
  'kwendambote': '/audio/words/kwendambote.wav',
  'sikamambote': '/audio/words/sikamambote.wav',
  'nkaka': '/audio/words/nkaka.wav',
  'ntoto': '/audio/words/ntoto.wav',
  'tiya': '/audio/words/tiya.wav',
  'mvula': '/audio/words/mvula.wav',
  'ngonda': '/audio/words/ngonda.wav',
  'tembo': '/audio/words/tembo.wav',
  'mayele': '/audio/words/mayele.wav',
  'ngemba': '/audio/words/ngemba.wav',
  'bumuntu': '/audio/words/bumuntu.wav',
  'kieleka': '/audio/words/kieleka.wav',
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

// Global active audio reference & session counter
let activeAudioElement: HTMLAudioElement | null = null;
let activeWebAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;
let currentPlaySessionId = 0;

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
  if (!word || typeof word !== 'string') return '';
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritics
    .replace(/[^a-z0-9]/g, '');      // strip spaces, apostrophes, hyphens, punctuation
};

// Get phonetic and dialect spelling variants
export const getLariVariants = (key: string): string[] => {
  const vars = new Set<string>();
  if (!key) return [];
  vars.add(key);

  if (key.includes('ua')) vars.add(key.replace(/ua/g, 'wa'));
  if (key.includes('wa')) vars.add(key.replace(/wa/g, 'ua'));
  if (key.includes('ue')) vars.add(key.replace(/ue/g, 'we'));
  if (key.includes('we')) vars.add(key.replace(/we/g, 'ue'));
  if (key.includes('ui')) vars.add(key.replace(/ui/g, 'wi'));
  if (key.includes('wi')) vars.add(key.replace(/wi/g, 'ui'));
  if (key.includes('uo')) vars.add(key.replace(/uo/g, 'wo'));
  if (key.includes('wo')) vars.add(key.replace(/wo/g, 'uo'));
  if (key.includes('kye')) vars.add(key.replace(/kye/g, 'kie'));
  if (key.includes('kie')) vars.add(key.replace(/kie/g, 'kye'));
  if (key.includes('diya')) vars.add(key.replace(/diya/g, 'dia'));
  if (key.includes('dia')) vars.add(key.replace(/dia/g, 'diya'));
  if (key.includes('za')) vars.add(key.replace(/za/g, 'sa'));
  if (key.includes('sa')) vars.add(key.replace(/sa/g, 'za'));

  return Array.from(vars);
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
  'wambote': { duration: 1.3, f0: 175, syllables: [{ f1: 350, f2: 800, pitchMod: 0.95 }, { f1: 400, f2: 1000, pitchMod: 1.0 }, { f1: 500, f2: 1800, pitchMod: 1.15 }] },
  'kwendambote': { duration: 1.4, f0: 170, syllables: [{ f1: 350, f2: 800, pitchMod: 1.0 }, { f1: 550, f2: 1800, pitchMod: 1.1 }, { f1: 400, f2: 1000, pitchMod: 0.95 }, { f1: 500, f2: 1800, pitchMod: 1.15 }] },
  'sikamambote': { duration: 1.4, f0: 175, syllables: [{ f1: 300, f2: 2200, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 1.1 }, { f1: 750, f2: 1200, pitchMod: 0.95 }, { f1: 500, f2: 1800, pitchMod: 1.15 }] },
  'nkaka': { duration: 1.1, f0: 165, syllables: [{ f1: 750, f2: 1200, pitchMod: 1.05 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'ntoto': { duration: 1.1, f0: 170, syllables: [{ f1: 500, f2: 950, pitchMod: 1.15 }, { f1: 500, f2: 950, pitchMod: 0.95 }] },
  'tiya': { duration: 1.1, f0: 180, syllables: [{ f1: 300, f2: 2200, pitchMod: 1.15 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'mvula': { duration: 1.2, f0: 175, syllables: [{ f1: 350, f2: 800, pitchMod: 1.0 }, { f1: 750, f2: 1200, pitchMod: 1.15 }] },
  'ngonda': { duration: 1.2, f0: 165, syllables: [{ f1: 500, f2: 950, pitchMod: 1.15 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'tembo': { duration: 1.1, f0: 175, syllables: [{ f1: 550, f2: 1800, pitchMod: 1.15 }, { f1: 450, f2: 950, pitchMod: 0.95 }] },
  'mayele': { duration: 1.2, f0: 175, syllables: [{ f1: 750, f2: 1200, pitchMod: 0.95 }, { f1: 550, f2: 1800, pitchMod: 1.15 }, { f1: 550, f2: 1800, pitchMod: 0.95 }] },
  'ngemba': { duration: 1.1, f0: 170, syllables: [{ f1: 550, f2: 1800, pitchMod: 1.15 }, { f1: 750, f2: 1200, pitchMod: 0.95 }] },
  'bumuntu': { duration: 1.3, f0: 165, syllables: [{ f1: 350, f2: 850, pitchMod: 0.95 }, { f1: 350, f2: 850, pitchMod: 1.1 }, { f1: 350, f2: 850, pitchMod: 0.95 }] },
  'kieleka': { duration: 1.3, f0: 180, syllables: [{ f1: 300, f2: 2200, pitchMod: 1.0 }, { f1: 550, f2: 1800, pitchMod: 1.15 }, { f1: 550, f2: 1800, pitchMod: 0.95 }] },
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

  activeWebAudioSource = source;
  source.onended = () => {
    activeWebAudioSource = null;
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

  activeWebAudioSource = source;
  source.onended = () => {
    activeWebAudioSource = null;
    if (options?.onEnd) options.onEnd();
  };

  source.start(ctx.currentTime);
};

// Helper: Detect if a string is already an audio file path, data URI, or URL
export const isAudioFilePath = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  return (
    s.endsWith('.wav') ||
    s.endsWith('.mp3') ||
    s.endsWith('.ogg') ||
    s.endsWith('.m4a') ||
    s.endsWith('.webm') ||
    s.startsWith('/audio/') ||
    s.startsWith('./audio/') ||
    s.startsWith('audio/') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('data:audio') ||
    s.startsWith('blob:')
  );
};

// Auto-unlock audio for mobile browsers & Web Audio policies on first interaction
let isAudioUnlocked = false;
export const unlockAudio = () => {
  if (isAudioUnlocked) return;
  isAudioUnlocked = true;
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};

if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'pointerdown', 'keydown'];
  const handler = () => {
    unlockAudio();
    events.forEach((ev) => window.removeEventListener(ev, handler));
  };
  events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
}

// Stop all active audio
export const stopActiveAudio = () => {
  currentPlaySessionId++;
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch {
      // Ignored
    }
    activeAudioElement = null;
  }
  if (activeWebAudioSource) {
    try {
      activeWebAudioSource.stop();
      activeWebAudioSource.disconnect();
    } catch {
      // Ignored
    }
    activeWebAudioSource = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignored
    }
  }
};

// Compute application base URL dynamically (works on root domain, localhost, and subfolders like /mwanalari/)
export const getAppBaseUrl = (): string => {
  if (typeof window === 'undefined') return '/';
  let path = window.location.pathname || '/';
  // Strip trailing file if present (e.g. index.html)
  if (/\/[^/]+\.[^/]+$/.test(path)) {
    path = path.substring(0, path.lastIndexOf('/') + 1);
  } else if (!path.endsWith('/')) {
    path += '/';
  }
  return window.location.origin + path;
};

// Resolve an audio path to a fully qualified URL avoiding root 404s
export const resolveAudioUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';
  const trimmed = pathOrUrl.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  // Strip leading slashes and dot-slashes
  const stripped = trimmed.replace(/^(\.\/|\/)+/, '');
  try {
    return new URL(stripped, getAppBaseUrl()).href;
  } catch {
    return `./${stripped}`;
  }
};

// In-memory audio elements cache for 0ms latency on repeated / preloaded playback
const audioCache = new Map<string, HTMLAudioElement>();
const MAX_CACHE_ENTRIES = 80;

// Preload audio into memory silently
export const preloadAudio = (wordOrUrl: string): void => {
  if (!wordOrUrl || typeof window === 'undefined') return;

  let candidateUrl = '';
  if (isAudioFilePath(wordOrUrl)) {
    candidateUrl = resolveAudioUrl(wordOrUrl);
  } else {
    const clean = normalizeLariWord(wordOrUrl);
    const mapped = CONVERTED_AUDIO_MAP[clean] || LARI_WORD_AUDIO_MAP[clean];
    if (mapped) {
      candidateUrl = resolveAudioUrl(mapped);
    }
  }

  if (!candidateUrl || audioCache.has(candidateUrl)) return;

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = candidateUrl;
    if (audioCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(candidateUrl, audio);
  } catch {
    // Ignore preload failures in background
  }
};

// Resilient candidate audio player with race-condition protection and Web Audio fallback
export const playAudioCandidates = (
  candidates: string[],
  options?: {
    playbackRate?: number;
    onEnd?: () => void;
    onAllFailed?: () => void;
  }
): HTMLAudioElement | null => {
  stopActiveAudio();
  unlockAudio();

  const sessionId = currentPlaySessionId;
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));
  if (uniqueCandidates.length === 0) {
    if (options?.onAllFailed) options.onAllFailed();
    else if (options?.onEnd) options.onEnd();
    return null;
  }

  let currentIndex = 0;
  let hasCompleted = false;

  const tryNext = () => {
    // If another play session started or already finished, exit immediately
    if (sessionId !== currentPlaySessionId || hasCompleted) return;

    if (currentIndex >= uniqueCandidates.length) {
      hasCompleted = true;
      activeAudioElement = null;
      if (options?.onAllFailed) {
        options.onAllFailed();
      } else if (options?.onEnd) {
        options.onEnd();
      }
      return;
    }

    const currentSrc = uniqueCandidates[currentIndex++];

    try {
      let audio: HTMLAudioElement;
      if (audioCache.has(currentSrc)) {
        audio = audioCache.get(currentSrc)!;
        audio.currentTime = 0;
      } else {
        audio = new Audio();
        audio.preload = 'auto';
        audio.src = currentSrc;
        if (audioCache.size < MAX_CACHE_ENTRIES) {
          audioCache.set(currentSrc, audio);
        }
      }

      audio.playbackRate = options?.playbackRate || 1.0;
      activeAudioElement = audio;

      let hasHandledCandidate = false;

      const handleFailure = (reason?: string) => {
        if (sessionId !== currentPlaySessionId || hasHandledCandidate || hasCompleted) return;
        hasHandledCandidate = true;
        console.warn(`[Audio] Échec lecture (${reason || 'erreur'}) pour ${currentSrc}, tentative suivante...`);
        tryNext();
      };

      const handleSuccessEnd = () => {
        if (sessionId !== currentPlaySessionId || hasCompleted) return;
        hasCompleted = true;
        activeAudioElement = null;
        if (options?.onEnd) options.onEnd();
      };

      audio.onended = handleSuccessEnd;

      audio.onerror = () => {
        handleFailure('HTML5 Media Error');
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (sessionId !== currentPlaySessionId) return;
          if (err.name === 'AbortError') return;
          handleFailure(err.name);
        });
      }
    } catch (e) {
      tryNext();
    }
  };

  tryNext();
  return activeAudioElement;
};

// Build all URL format variations (prioritizing resolved absolute app path, mp3 first, then wav)
const expandUrlVariations = (url: string, targetList: string[]) => {
  if (!url || typeof url !== 'string') return;
  const cleanUrl = url.trim();
  if (!cleanUrl) return;

  // 1. Primary: Fully resolved URL against current subfolder (e.g. https://www.cmd.cg/mwanalari/audio/...)
  const resolved = resolveAudioUrl(cleanUrl);
  if (resolved) {
    if (resolved.endsWith('.wav')) {
      // Prioritize mp3 version first
      targetList.push(resolved.replace(/\.wav$/i, '.mp3'));
      targetList.push(resolved);
    } else if (resolved.endsWith('.mp3')) {
      targetList.push(resolved);
      targetList.push(resolved.replace(/\.mp3$/i, '.wav'));
    } else {
      targetList.push(resolved);
    }
  }

  // 2. Relative ./ format for fallback
  const stripped = cleanUrl.replace(/^(\.\/|\/)+/, '');
  if (stripped.endsWith('.wav')) {
    targetList.push(`./${stripped.replace(/\.wav$/i, '.mp3')}`);
    targetList.push(`./${stripped}`);
  } else if (stripped.endsWith('.mp3')) {
    targetList.push(`./${stripped}`);
    targetList.push(`./${stripped.replace(/\.mp3$/i, '.wav')}`);
  } else {
    targetList.push(`./${stripped}`);
  }
};

// Real Audio Player for Words with Multi-tier Resilient Fallback
export const playLariWordAudio = (
  wordOrUrl: string,
  options?: {
    customAudioUrl?: string;
    playbackRate?: number;
    onEnd?: () => void;
  }
): HTMLAudioElement | null => {
  const candidates: string[] = [];
  const custom = options?.customAudioUrl;

  // 1. Custom explicit audio URL (e.g. from dictionary entry or user upload)
  if (custom && typeof custom === 'string') {
    expandUrlVariations(custom, candidates);
  }

  // 2. Direct path check on wordOrUrl
  if (isAudioFilePath(wordOrUrl)) {
    expandUrlVariations(wordOrUrl, candidates);
  }

  // 3. Normalization and standard word paths (Converted audios prioritized)
  const clean = normalizeLariWord(wordOrUrl);
  if (clean) {
    const variants = getLariVariants(clean);

    // Look in converted audio map
    variants.forEach((v) => {
      if (CONVERTED_AUDIO_MAP[v]) {
        expandUrlVariations(CONVERTED_AUDIO_MAP[v], candidates);
      }
      if (LARI_WORD_AUDIO_MAP[v]) {
        expandUrlVariations(LARI_WORD_AUDIO_MAP[v], candidates);
      }
    });

    // Check direct audio/words/ and audio/ paths with mp3 first
    variants.forEach((v) => {
      expandUrlVariations(`audio/words/${v}.mp3`, candidates);
      expandUrlVariations(`audio/${v}.mp3`, candidates);
    });
  }

  return playAudioCandidates(candidates, {
    playbackRate: options?.playbackRate,
    onEnd: options?.onEnd,
    onAllFailed: () => {
      console.warn(`[Audio] Tous les fichiers audio pour "${wordOrUrl}" ont échoué, bascule sur la synthèse.`);
      playProceduralVocal(clean || wordOrUrl, options);
    },
  });
};

// Play Cultural Story with Multi-tier Playback
export const playStoryAudio = (
  storyIdOrUrl: string,
  options?: { playbackRate?: number; onEnd?: () => void }
): HTMLAudioElement | null => {
  const candidates: string[] = [];

  if (isAudioFilePath(storyIdOrUrl)) {
    expandUrlVariations(storyIdOrUrl, candidates);
  }

  const clean = storyIdOrUrl.toLowerCase().trim();
  if (LARI_STORY_AUDIO_MAP[clean]) {
    expandUrlVariations(LARI_STORY_AUDIO_MAP[clean], candidates);
  }
  candidates.push(`/audio/stories/${clean}.wav`, `./audio/stories/${clean}.wav`);
  candidates.push(`/audio/stories/${clean}.mp3`, `./audio/stories/${clean}.mp3`);

  return playAudioCandidates(candidates, {
    playbackRate: options?.playbackRate,
    onEnd: options?.onEnd,
    onAllFailed: () => {
      console.warn(`[Audio] Fichier conte ${storyIdOrUrl} indisponible, bascule sur le soundscape Sanza.`);
      playProceduralStory(4.5, options);
    },
  });
};

// Play Koko Mascot Voice
export const playKokoVoice = (
  clipId: 'koko_welcome' | 'koko_bravo' | 'koko_tryagain' | string,
  options?: { onEnd?: () => void }
): HTMLAudioElement | null => {
  const candidates: string[] = [];

  if (isAudioFilePath(clipId)) {
    expandUrlVariations(clipId, candidates);
  }

  const clean = clipId.toLowerCase().trim();
  if (KOKO_AUDIO_MAP[clean]) {
    expandUrlVariations(KOKO_AUDIO_MAP[clean], candidates);
  }
  candidates.push(`/audio/koko/${clean}.wav`, `./audio/koko/${clean}.wav`);
  candidates.push(`/audio/koko/${clean}.mp3`, `./audio/koko/${clean}.mp3`);

  return playAudioCandidates(candidates, {
    onEnd: options?.onEnd,
    onAllFailed: () => {
      playSuccessChime();
      if (options?.onEnd) options.onEnd();
    },
  });
};

// Generic Speak / Play wrapper
export const speakNativeWord = (
  word: string,
  customAudioUrl?: string,
  options?: { playbackRate?: number; onEnd?: () => void }
) => {
  playLariWordAudio(word, {
    ...options,
    customAudioUrl,
  });
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

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn('Audio error chime error', e);
  }
};

export const playPopSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    console.warn('Pop sound error', e);
  }
};

export const playVictoryFanfare = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 523.25, d: 0.12, t: 0.14 },
      { f: 523.25, d: 0.12, t: 0.28 },
      { f: 659.25, d: 0.35, t: 0.42 },
      { f: 587.33, d: 0.15, t: 0.8 },
      { f: 783.99, d: 0.6, t: 0.98 },
    ];

    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, ctx.currentTime + note.t);

      gain.gain.setValueAtTime(0, ctx.currentTime + note.t);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.t);
      osc.stop(ctx.currentTime + note.t + note.d);
    });
  } catch (e) {
    console.warn('Victory fanfare error', e);
  }
};
