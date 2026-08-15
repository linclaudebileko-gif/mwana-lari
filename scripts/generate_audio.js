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
  buffer.writeUInt32LE(16, 16); // format chunk size
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

    const f1 = config.f1 || 600;
    const f2 = config.f2 || 1400;
    const f3 = config.f3 || 2400;

    const r1 = Math.sin(2 * Math.PI * f1 * t) * 0.5;
    const r2 = Math.sin(2 * Math.PI * f2 * t) * 0.3;
    const r3 = Math.sin(2 * Math.PI * f3 * t) * 0.15;

    const sample = env * glottal * (r1 + r2 + r3) * 0.8;
    samples[i] = sample;
  }

  return createWavBuffer(sampleRate, samples);
}

// Word configurations with specific Lari phonetics & tone contours (MBUTA Style)
const WORD_AUDIO_SPECS = {
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

// Stories ambient narrative soundscapes (Sanza / Kalimba + soothing narration harmonics)
const STORY_AUDIO_SPECS = {
  'nkosi_na_mbolo': { duration: 4.5, baseFreq: 220 },
  'kongo_dia_ntotila': { duration: 4.0, baseFreq: 196 },
  'nkimba_ya_mwana': { duration: 5.0, baseFreq: 261.63 },
  'ngo_na_nsusu': { duration: 4.5, baseFreq: 220 },
  'luzolo_lwa_koko': { duration: 4.0, baseFreq: 246.94 },
};

function generateStorySoundscape(durationSec, baseFreq) {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const kalimba = Math.sin(2 * Math.PI * baseFreq * (1 + Math.floor(t % 3) * 0.25) * t) * Math.exp(-4 * (t % 1.2)) * 0.2;
    const elderVoice = Math.sin(2 * Math.PI * (140 + 15 * Math.sin(2 * Math.PI * 0.5 * t)) * t) * Math.exp(-2.5 * ((t * 1.5) % 1.0)) * 0.25;
    samples[i] = kalimba + elderVoice;
  }

  return createWavBuffer(sampleRate, samples);
}

// Generate Koko Voice Mascotte
function generateKokoMascotVoice(type) {
  const sampleRate = 44100;
  const duration = type === 'koko_welcome' ? 2.0 : 1.5;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chirp = Math.sin(2 * Math.PI * (450 + 250 * Math.sin(2 * Math.PI * 4 * t)) * t) * 0.35;
    const env = Math.sin((t / duration) * Math.PI);
    samples[i] = chirp * env;
  }

  return createWavBuffer(sampleRate, samples);
}

// Ensure directories exist in both public and dist
const publicWordsDir = path.join(process.cwd(), 'public', 'audio', 'words');
const publicStoriesDir = path.join(process.cwd(), 'public', 'audio', 'stories');
const publicKokoDir = path.join(process.cwd(), 'public', 'audio', 'koko');

const distWordsDir = path.join(process.cwd(), 'dist', 'audio', 'words');
const distStoriesDir = path.join(process.cwd(), 'dist', 'audio', 'stories');
const distKokoDir = path.join(process.cwd(), 'dist', 'audio', 'koko');

[publicWordsDir, publicStoriesDir, publicKokoDir, distWordsDir, distStoriesDir, distKokoDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Generate word audios
for (const [word, spec] of Object.entries(WORD_AUDIO_SPECS)) {
  const wav = generateVocalWave(spec.duration, spec.f0, spec.syllables);
  const pPath = path.join(publicWordsDir, `${word}.wav`);
  const dPath = path.join(distWordsDir, `${word}.wav`);
  fs.writeFileSync(pPath, wav);
  fs.writeFileSync(dPath, wav);
  console.log(`Generated: /audio/words/${word}.wav (${wav.length} bytes)`);
}

// Generate story soundscapes
for (const [story, spec] of Object.entries(STORY_AUDIO_SPECS)) {
  const wav = generateStorySoundscape(spec.duration, spec.baseFreq);
  const pPath = path.join(publicStoriesDir, `${story}.wav`);
  const dPath = path.join(distStoriesDir, `${story}.wav`);
  fs.writeFileSync(pPath, wav);
  fs.writeFileSync(dPath, wav);
  console.log(`Generated: /audio/stories/${story}.wav (${wav.length} bytes)`);
}

// Generate Koko voice clips
['koko_welcome', 'koko_bravo', 'koko_tryagain'].forEach(kokoType => {
  const wav = generateKokoMascotVoice(kokoType);
  const pPath = path.join(publicKokoDir, `${kokoType}.wav`);
  const dPath = path.join(distKokoDir, `${kokoType}.wav`);
  fs.writeFileSync(pPath, wav);
  fs.writeFileSync(dPath, wav);
  console.log(`Generated: /audio/koko/${kokoType}.wav (${wav.length} bytes)`);
});

console.log('✅ All audio assets created successfully in public/audio/ and dist/audio/ !');
