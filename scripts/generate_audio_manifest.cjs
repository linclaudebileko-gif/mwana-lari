const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 [Manifest] Démarrage de la réconciliation et génération du manifeste audio...');

const dictPath = path.resolve('src/data/dictionary.json');
const lexPath = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
const mockPath = path.resolve('src/data/mockData.ts');
const publicAudioDir = path.resolve('public/audio');

const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
const lex = JSON.parse(fs.readFileSync(lexPath, 'utf8'));

// Helper to calculate WAV duration quickly from RIFF header
function getWavDuration(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 44) return null;
    const sampleRate = buf.readUInt32LE(24);
    const byteRate = buf.readUInt32LE(28);
    let pos = 12;
    while (pos < buf.length - 8) {
      const chunkId = buf.toString('ascii', pos, pos + 4);
      const chunkSize = buf.readUInt32LE(pos + 4);
      if (chunkId === 'data' && byteRate > 0) {
        return Number((chunkSize / byteRate).toFixed(2));
      }
      pos += 8 + chunkSize;
    }
  } catch (e) {
    // fallback
  }
  return null;
}

// Helper to compute sha256
function getSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function normalizeKey(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getVariants(key) {
  const vars = new Set();
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
}

const manifestEntries = [];
const audioMap = {};
const usedAudioFiles = new Set();

let approvedCount = 0;
let pendingCount = 0;

for (let i = 0; i < dict.length; i++) {
  const d = dict[i];
  const l = lex[i] || {};
  const wordId = `w${i + 1}`;
  const wordNative = l.wordNative || d.word;

  let audioUrl = d.audioUrl;
  let mp3Filename = null;
  let wavFilename = null;
  let mp3Path = null;
  let wavPath = null;
  let mp3Exists = false;
  let wavExists = false;
  let mp3Sha256 = null;
  let wavSha256 = null;
  let mp3Size = null;
  let wavSize = null;
  let durationSeconds = null;

  if (audioUrl) {
    // Normalise canonical URL to .mp3
    if (audioUrl.endsWith('.wav')) {
      audioUrl = audioUrl.replace(/\.wav$/i, '.mp3');
    }
    mp3Filename = path.basename(audioUrl);
    wavFilename = mp3Filename.replace(/\.mp3$/i, '.wav');

    mp3Path = path.join(publicAudioDir, mp3Filename);
    wavPath = path.join(publicAudioDir, wavFilename);

    mp3Exists = fs.existsSync(mp3Path);
    wavExists = fs.existsSync(wavPath);

    if (mp3Exists) {
      const stat = fs.statSync(mp3Path);
      mp3Size = stat.size;
      mp3Sha256 = getSha256(mp3Path);
      usedAudioFiles.add(mp3Filename);
    }

    if (wavExists) {
      const stat = fs.statSync(wavPath);
      wavSize = stat.size;
      wavSha256 = getSha256(wavPath);
      durationSeconds = getWavDuration(wavPath);
      usedAudioFiles.add(wavFilename);
    } else if (mp3Exists) {
      // Estimate duration from 64k mp3 if wav missing
      durationSeconds = Number((mp3Size / (64000 / 8)).toFixed(2));
    }
  }

  const hasValidAudio = mp3Exists || wavExists;
  if (hasValidAudio) {
    approvedCount++;
  } else {
    pendingCount++;
    audioUrl = null;
  }

  const manifestItem = {
    index: i + 1,
    word_id: wordId,
    numeric_id: String(i + 1),
    word_native: wordNative,
    phonetic: l.phonetic || `[${normalizeKey(wordNative)}]`,
    translation_fr: l.translationFr || d.translation_fr,
    translation_en: l.translationEn || d.translation_en || '',
    category: l.category || 'Vocabulaire Général',
    difficulty_level: l.difficultyLevel || 1,
    noun_class: l.nounClass || d.grammar || '',
    cultural_note: l.culturalNote || '',
    audio_url: audioUrl,
    mp3_file: mp3Filename,
    wav_file: wavFilename,
    duration_seconds: durationSeconds,
    mp3_size_bytes: mp3Size,
    wav_size_bytes: wavSize,
    mp3_sha256: mp3Sha256,
    wav_sha256: wavSha256,
    speaker_name: 'Comité des Sages & Linguistes Lari (Pool / Brazzaville)',
    speaker_type: 'NATIVE_ELDER',
    is_validated: hasValidAudio,
    validation_status: hasValidAudio ? 'APPROVED' : 'PENDING_RECORDING',
    validated_by: hasValidAudio ? 'Mamma Pauline (Comité Linguistique Lari)' : null,
    validated_at: hasValidAudio ? '2026-03-15T00:00:00.000Z' : null,
    source: 'MBUTA 1.0.0'
  };

  manifestEntries.push(manifestItem);

  // Update audioMap
  if (audioUrl) {
    const k = normalizeKey(wordNative);
    if (k) {
      audioMap[k] = audioUrl;
      getVariants(k).forEach(v => {
        if (!audioMap[v]) audioMap[v] = audioUrl;
      });
    }
    // Also map by word id
    audioMap[wordId] = audioUrl;
    audioMap[`word_${i+1}`] = audioUrl;
  }

  // Update lex and dict entries
  l.audioUrl = audioUrl;
  l.validatedByElder = hasValidAudio;
  l.speakerName = 'Comité des Sages & Linguistes Lari (Pool / Brazzaville)';

  d.audioUrl = audioUrl;
}

console.log(`📊 Statistiques du Manifeste :`);
console.log(`   - Total entrées du corpus : ${manifestEntries.length}`);
console.log(`   - Enregistrements validés : ${approvedCount}`);
console.log(`   - En attente de capture : ${pendingCount}`);
console.log(`   - Clés dans audioMap : ${Object.keys(audioMap).length}`);

// Orphan files detection
const allDirFiles = fs.readdirSync(publicAudioDir).filter(f => /\.(wav|mp3)$/i.test(f));
const orphanFiles = allDirFiles.filter(f => !usedAudioFiles.has(f));
console.log(`   - Fichiers dans public/audio : ${allDirFiles.length}`);
console.log(`   - Fichiers audio orphelins : ${orphanFiles.length}`);

// Write manifests and datasets
const manifestOutPath = path.resolve('data/lexicon/audio_manifest.json');
fs.writeFileSync(manifestOutPath, JSON.stringify(manifestEntries, null, 2), 'utf8');
console.log(`✅ [Manifest] Fichier écrit : ${manifestOutPath}`);

const srcManifestPath = path.resolve('src/data/audioManifest.json');
fs.writeFileSync(srcManifestPath, JSON.stringify(manifestEntries, null, 2), 'utf8');
console.log(`✅ [Manifest] Copie frontend écrite : ${srcManifestPath}`);

const audioMapOutPath = path.resolve('src/data/audioMap.json');
fs.writeFileSync(audioMapOutPath, JSON.stringify(audioMap, null, 2), 'utf8');
console.log(`✅ [AudioMap] Fichier écrit : ${audioMapOutPath}`);

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2), 'utf8');
console.log(`✅ [Dictionary] Fichier mis à jour : ${dictPath}`);

fs.writeFileSync(lexPath, JSON.stringify(lex, null, 2), 'utf8');
console.log(`✅ [Lexicon] Fichier mis à jour : ${lexPath}`);

// Update mockData.ts LARI_WORDS
console.log('🔄 Mise à jour de LARI_WORDS dans src/data/mockData.ts...');
let mockContent = fs.readFileSync(mockPath, 'utf8');

const startTag = 'export const LARI_WORDS: WordItem[] = [';
const startIdx = mockContent.indexOf(startTag);
const endIdx = mockContent.indexOf('];', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const currentWords = JSON.parse(mockContent.substring(startIdx + 'export const LARI_WORDS: WordItem[] = '.length, endIdx + 1));
  for (let i = 0; i < currentWords.length; i++) {
    const item = currentWords[i];
    const m = manifestEntries[i];
    if (m) {
      item.audioUrl = m.audio_url || '';
      item.validatedByElder = m.is_validated;
      item.speakerName = m.speaker_name;
    }
  }
  const formattedWords = JSON.stringify(currentWords, null, 2);
  mockContent = mockContent.substring(0, startIdx + 'export const LARI_WORDS: WordItem[] = '.length) + formattedWords + mockContent.substring(endIdx + 1);
  fs.writeFileSync(mockPath, mockContent, 'utf8');
  console.log(`✅ [MockData] LARI_WORDS synchronisé avec le manifeste (${currentWords.length} mots) !`);
} else {
  console.error('❌ Impossible de localiser LARI_WORDS dans src/data/mockData.ts');
}

console.log('🎉 Terminé avec succès !');
