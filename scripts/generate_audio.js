import fs from 'fs';
import path from 'path';

// Helper to create a mono 16-bit 44.1kHz WAV buffer
function createWavBuffer(sampleRate, samples) {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }

  return buffer;
}

// Generate formant vocal audio with tonal variation
function generateVocalWave(durationSec, f0, syllables = []) {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);

  const numSyllables = syllables.length || 1;
  const sylDuration = durationSec / numSyllables;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sylIndex = Math.min(Math.floor(t / sylDuration), numSyllables - 1);
    const sylT = (t % sylDuration) / sylDuration;

    const config = syllables[sylIndex] || { f1: 500, f2: 1500, f3: 2500, pitchMod: 1.0 };
    const currentF0 = f0 * (config.pitchMod || 1.0) * (1 + 0.02 * Math.sin(2 * Math.PI * 5.5 * t));

    let env = 1.0;
    if (sylT < 0.15) env = sylT / 0.15;
    else if (sylT > 0.75) env = (1.0 - sylT) / 0.25;

    const phase = (t * currentF0) % 1.0;
    const glottal = Math.sin(2 * Math.PI * phase) * Math.exp(-3 * phase);

    // Formant filtering
    const f1 = config.f1 || 500;
    const f2 = config.f2 || 1500;
    const f3 = config.f3 || 2500;

    const form1 = Math.sin(2 * Math.PI * f1 * t) * Math.exp(-2.5 * phase);
    const form2 = 0.5 * Math.sin(2 * Math.PI * f2 * t) * Math.exp(-3.5 * phase);
    const form3 = 0.25 * Math.sin(2 * Math.PI * f3 * t) * Math.exp(-4.5 * phase);

    const voice = (glottal * 0.4 + form1 * 0.5 + form2 * 0.3 + form3 * 0.15) * env * 0.75;
    samples[i] = voice;
  }

  return samples;
}

// Generate soundscape chime for cultural stories
function generateStorySoundscape(durationSec, baseFreq = 220) {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-0.8 * (t % 2.5));
    const chime1 = Math.sin(2 * Math.PI * baseFreq * t) * env;
    const chime2 = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * Math.exp(-1.2 * (t % 2.5));
    const chime3 = 0.3 * Math.sin(2 * Math.PI * (baseFreq * 2.0) * t) * Math.exp(-1.8 * (t % 2.5));
    const nature = 0.03 * (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * 0.5 * t);
    samples[i] = (chime1 + chime2 + chime3 + nature) * 0.55;
  }

  return samples;
}

// Ensure destination directories exist
const publicAudioWordsDir = path.resolve('public/audio/words');
const publicAudioStoriesDir = path.resolve('public/audio/stories');
const publicAudioKokoDir = path.resolve('public/audio/koko');
const distAudioWordsDir = path.resolve('dist/audio/words');
const distAudioStoriesDir = path.resolve('dist/audio/stories');
const distAudioKokoDir = path.resolve('dist/audio/koko');

[publicAudioWordsDir, publicAudioStoriesDir, publicAudioKokoDir, distAudioWordsDir, distAudioStoriesDir, distAudioKokoDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load full dictionary
const lexiconPath = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
let wordsList = [];
if (fs.existsSync(lexiconPath)) {
  wordsList = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'));
}

console.log(`🎙️ Génération des fichiers audio pour ${wordsList.length} mots Lari...`);

// Syllable Formant Library
const VOWELS = {
  a: { f1: 850, f2: 1610, f3: 2850, pitchMod: 1.0 },
  e: { f1: 530, f2: 1840, f3: 2480, pitchMod: 1.05 },
  i: { f1: 270, f2: 2290, f3: 3010, pitchMod: 1.15 },
  o: { f1: 570, f2: 840, f3: 2410, pitchMod: 0.95 },
  u: { f1: 300, f2: 870, f3: 2240, pitchMod: 0.9 }
};

// Generate audio for every word in the lexicon
wordsList.forEach((item) => {
  const cleanName = item.wordNative.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const pubPath = path.join(publicAudioWordsDir, `${cleanName}.wav`);
  const distPath = path.join(distAudioWordsDir, `${cleanName}.wav`);

  // Analyze word to generate pseudo syllables
  const letters = cleanName.split('');
  const syllables = [];
  letters.forEach(char => {
    if (VOWELS[char]) {
      syllables.push(VOWELS[char]);
    }
  });
  if (syllables.length === 0) syllables.push(VOWELS.a, VOWELS.o);

  const duration = Math.max(1.1, syllables.length * 0.45);
  const f0 = 135; // Warm human voice pitch
  const samples = generateVocalWave(duration, f0, syllables);
  const buffer = createWavBuffer(44100, samples);

  fs.writeFileSync(pubPath, buffer);
  fs.writeFileSync(distPath, buffer);
});

// Cultural stories audio
const STORIES = [
  { file: 'nkosi_na_mbolo.wav', freq: 220, dur: 4.5 },
  { file: 'kongo_dia_ntotila.wav', freq: 196, dur: 4.0 },
  { file: 'nkimba_ya_mwana.wav', freq: 261, dur: 5.0 },
  { file: 'ngo_na_nsusu.wav', freq: 246, dur: 4.5 },
  { file: 'luzolo_lwa_koko.wav', freq: 293, dur: 4.0 }
];

STORIES.forEach(story => {
  const pubPath = path.join(publicAudioStoriesDir, story.file);
  const distPath = path.join(distAudioStoriesDir, story.file);
  const samples = generateStorySoundscape(story.dur, story.freq);
  const buffer = createWavBuffer(44100, samples);
  fs.writeFileSync(pubPath, buffer);
  fs.writeFileSync(distPath, buffer);
});

// Koko mascot cues
const KOKO_SOUNDS = [
  { file: 'koko_welcome.wav', dur: 2.0, f0: 320 },
  { file: 'koko_bravo.wav', dur: 1.5, f0: 380 },
  { file: 'koko_tryagain.wav', dur: 1.5, f0: 260 }
];

KOKO_SOUNDS.forEach(snd => {
  const pubPath = path.join(publicAudioKokoDir, snd.file);
  const distPath = path.join(distAudioKokoDir, snd.file);
  const samples = generateVocalWave(snd.dur, snd.f0, [VOWELS.o, VOWELS.a, VOWELS.i]);
  const buffer = createWavBuffer(44100, samples);
  fs.writeFileSync(pubPath, buffer);
  fs.writeFileSync(distPath, buffer);
});

console.log(`✅ Tous les ${wordsList.length} fichiers audio ont été générés avec succès dans public/audio/ et dist/audio/ !`);
