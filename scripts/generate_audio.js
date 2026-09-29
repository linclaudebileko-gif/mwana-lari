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
const publicAudioDir = path.resolve('public/audio');
const publicAudioStoriesDir = path.resolve('public/audio/stories');
const publicAudioKokoDir = path.resolve('public/audio/koko');
const distAudioDir = path.resolve('dist/audio');
const distAudioStoriesDir = path.resolve('dist/audio/stories');
const distAudioKokoDir = path.resolve('dist/audio/koko');

const publicAudioWordsDir = path.resolve('public/audio/words');
const distAudioWordsDir = path.resolve('dist/audio/words');

[publicAudioDir, publicAudioWordsDir, publicAudioStoriesDir, publicAudioKokoDir, distAudioDir, distAudioWordsDir, distAudioStoriesDir, distAudioKokoDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Copy all genuine files from root audio/ directory if present
const rootWordsDir = path.resolve('audio/words');
const rootStoriesDir = path.resolve('audio/stories');
const rootKokoDir = path.resolve('audio/koko');

let realAudioSynced = 0;

// 1. Sync words audio from audio/words/ into public/audio/words/ and dist/audio/words/
if (fs.existsSync(rootWordsDir)) {
  fs.readdirSync(rootWordsDir).forEach(file => {
    if (/\.(wav|mp3|ogg|m4a)$/i.test(file)) {
      const src = path.join(rootWordsDir, file);
      const pubPath = path.join(publicAudioWordsDir, file);
      const distPath = path.join(distAudioWordsDir, file);
      if (!fs.existsSync(pubPath)) fs.copyFileSync(src, pubPath);
      if (!fs.existsSync(distPath)) fs.copyFileSync(src, distPath);
    }
  });
  // Ensure masa/maza alias exists
  ['masa.wav', 'masa.mp3'].forEach(f => {
    const srcMasa = path.join(publicAudioWordsDir, f);
    const dstMaza = path.join(publicAudioWordsDir, f.replace('masa', 'maza'));
    if (fs.existsSync(srcMasa) && !fs.existsSync(dstMaza)) {
      fs.copyFileSync(srcMasa, dstMaza);
    }
  });
}

// 2. Sync all genuine human voice files from public/audio/ to dist/audio/ (preferring lightweight mp3)
if (fs.existsSync(publicAudioDir)) {
  fs.readdirSync(publicAudioDir).forEach(file => {
    const src = path.join(publicAudioDir, file);
    if (fs.statSync(src).isFile() && /\.(wav|mp3|ogg|m4a)$/i.test(file)) {
      // If .wav and .mp3 exists, skip the 12x heavier .wav in dist
      if (file.toLowerCase().endsWith('.wav') && fs.existsSync(src.replace(/\.wav$/i, '.mp3'))) {
        return;
      }
      fs.copyFileSync(src, path.join(distAudioDir, file));
      realAudioSynced++;
    }
  });
}

console.log(`🎙️ ${realAudioSynced} enregistrements audio humains synchronisés vers dist/audio/ !`);

// 2. Cultural stories audio: Preserve genuine files from audio/stories/ or generate fallback
const STORIES = [
  { file: 'nkosi_na_mbolo.wav', freq: 220, dur: 4.5 },
  { file: 'kongo_dia_ntotila.wav', freq: 196, dur: 4.0 },
  { file: 'nkimba_ya_mwana.wav', freq: 261, dur: 5.0 },
  { file: 'ngo_na_nsusu.wav', freq: 246, dur: 4.5 },
  { file: 'luzolo_lwa_koko.wav', freq: 293, dur: 4.0 }
];

STORIES.forEach(story => {
  const rootSrc = path.join(rootStoriesDir, story.file);
  const pubPath = path.join(publicAudioStoriesDir, story.file);
  const distPath = path.join(distAudioStoriesDir, story.file);

  if (fs.existsSync(rootSrc)) {
    fs.copyFileSync(rootSrc, pubPath);
    fs.copyFileSync(rootSrc, distPath);
  } else if (!fs.existsSync(pubPath)) {
    const samples = generateStorySoundscape(story.dur, story.freq);
    const buffer = createWavBuffer(44100, samples);
    fs.writeFileSync(pubPath, buffer);
    fs.writeFileSync(distPath, buffer);
  } else {
    fs.copyFileSync(pubPath, distPath);
  }

  // Also sync mp3 if available
  const mp3File = story.file.replace(/\.wav$/i, '.mp3');
  const pubMp3 = path.join(publicAudioStoriesDir, mp3File);
  const distMp3 = path.join(distAudioStoriesDir, mp3File);
  if (fs.existsSync(pubMp3)) {
    fs.copyFileSync(pubMp3, distMp3);
  }
});

// 3. Koko mascot cues: Preserve genuine files from audio/koko/
const KOKO_SOUNDS = [
  { file: 'koko_welcome.wav', dur: 2.0 },
  { file: 'koko_bravo.wav', dur: 1.5 },
  { file: 'koko_tryagain.wav', dur: 1.5 }
];

KOKO_SOUNDS.forEach(snd => {
  const rootSrc = path.join(rootKokoDir, snd.file);
  const pubPath = path.join(publicAudioKokoDir, snd.file);
  const distPath = path.join(distAudioKokoDir, snd.file);

  if (fs.existsSync(rootSrc)) {
    fs.copyFileSync(rootSrc, pubPath);
    fs.copyFileSync(rootSrc, distPath);
  } else if (fs.existsSync(pubPath)) {
    fs.copyFileSync(pubPath, distPath);
  }

  // Also sync mp3 if available
  const mp3File = snd.file.replace(/\.wav$/i, '.mp3');
  const pubMp3 = path.join(publicAudioKokoDir, mp3File);
  const distMp3 = path.join(distAudioKokoDir, mp3File);
  if (fs.existsSync(pubMp3)) {
    fs.copyFileSync(pubMp3, distMp3);
  }
});

console.log(`✅ Tous les vrais fichiers audio sont synchronisés et disponibles dans public/audio/ et dist/audio/ !`);
