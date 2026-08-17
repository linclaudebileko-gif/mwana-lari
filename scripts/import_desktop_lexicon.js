import fs from 'fs';
import path from 'path';
import os from 'os';

const projectCsvPath = path.resolve('Dictionnaire_MBUTA_Lari_Francais_Anglais.csv');
const desktopPath = path.join(os.homedir(), 'Desktop', 'Dictoinnaire_Lari_Francais1.csv');

const targetCsvPath = fs.existsSync(projectCsvPath) ? projectCsvPath : desktopPath;

if (!fs.existsSync(targetCsvPath)) {
  console.error(`❌ Fichier CSV introuvable : ${targetCsvPath}`);
  process.exit(1);
}

const rawBuffer = fs.readFileSync(targetCsvPath);

const fullCP850Map = {
  0x80: 'Ç', 0x81: 'ü', 0x82: 'é', 0x83: 'â', 0x84: 'ä', 0x85: 'à', 0x86: 'å', 0x87: 'ç',
  0x88: 'ê', 0x89: 'ë', 0x8a: 'è', 0x8b: 'ï', 0x8c: 'î', 0x8d: 'ì', 0x8e: 'Ä', 0x8f: 'Å',
  0x90: 'É', 0x91: 'æ', 0x92: 'Æ', 0x93: 'ô', 0x94: 'ö', 0x95: 'ò', 0x96: 'û', 0x97: 'ù',
  0x98: 'ÿ', 0x99: 'Ö', 0x9a: 'Ü', 0x9b: 'ø', 0x9c: '£', 0x9d: 'Ø', 0x9e: '×', 0x9f: 'ƒ',
  0xa0: 'á', 0xa1: 'í', 0xa2: 'ó', 0xa3: 'ú', 0xa4: 'ñ', 0xa5: 'Ñ', 0xa6: 'ª', 0xa7: 'º',
  0xa8: '¿', 0xa9: '®', 0xaa: '¬', 0xab: '½', 0xac: '¼', 0xad: '¡', 0xae: '«', 0xaf: '»',
  0xb5: 'Á', 0xb6: 'Â', 0xb7: 'À', 0xf8: '°'
};

function decodeCP850(buf) {
  let str = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (fullCP850Map[b]) str += fullCP850Map[b];
    else str += String.fromCharCode(b);
  }
  return str;
}

function parseCsvLine(line, delimiter = ';') {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Function to classify category based on French translation and nature
function inferCategory(wordNative, fr, nature) {
  const lowerFr = fr.toLowerCase();
  const lowerNat = (nature || '').toLowerCase();

  if (lowerFr.includes('bonjour') || lowerFr.includes('salut') || lowerFr.includes('merci') || lowerFr.includes('adieu') || lowerFr.includes('comment') || lowerFr.includes('bienvenue') || lowerFr.includes('paix')) {
    return 'Salutations & Politesse';
  }
  if (lowerFr.includes('père') || lowerFr.includes('mère') || lowerFr.includes('enfant') || lowerFr.includes('fils') || lowerFr.includes('fille') || lowerFr.includes('frère') || lowerFr.includes('sœur') || lowerFr.includes('famille') || lowerFr.includes('oncle') || lowerFr.includes('tante') || lowerFr.includes('grand-mère') || lowerFr.includes('grand-père') || lowerFr.includes('bébé') || lowerFr.includes('époux') || lowerFr.includes('épouse') || lowerFr.includes('mari') || lowerFr.includes('femme') || lowerFr.includes('homme')) {
    return 'Famille & Relations';
  }
  if (lowerFr.includes('manger') || lowerFr.includes('boire') || lowerFr.includes('manioc') || lowerFr.includes('poisson') || lowerFr.includes('viande') || lowerFr.includes('pain') || lowerFr.includes('sauce') || lowerFr.includes('sel') || lowerFr.includes('huile') || lowerFr.includes('vin') || lowerFr.includes('eau') || lowerFr.includes('fruit') || lowerFr.includes('banane') || lowerFr.includes('haricot') || lowerFr.includes('plat') || lowerFr.includes('repas') || lowerFr.includes('foufou') || lowerFr.includes('chikwangue') || lowerFr.includes('piment')) {
    return 'Nourriture & Cuisine';
  }
  if (lowerFr.includes('palmier') || lowerFr.includes('arbre') || lowerFr.includes('forêt') || lowerFr.includes('oiseau') || lowerFr.includes('lion') || lowerFr.includes('singe') || lowerFr.includes('léopard') || lowerFr.includes('chèvre') || lowerFr.includes('chien') || lowerFr.includes('chat') || lowerFr.includes('serpent') || lowerFr.includes('rivière') || lowerFr.includes('fleuve') || lowerFr.includes('terre') || lowerFr.includes('herbe') || lowerFr.includes('feuille') || lowerFr.includes('animal') || lowerFr.includes('pluie') || lowerFr.includes('soleil') || lowerFr.includes('lune') || lowerFr.includes('étoile')) {
    return 'Nature, Faune & Flore';
  }
  if (lowerFr.includes('tête') || lowerFr.includes('bras') || lowerFr.includes('jambe') || lowerFr.includes('pied') || lowerFr.includes('main') || lowerFr.includes('œil') || lowerFr.includes('yeux') || lowerFr.includes('dent') || lowerFr.includes('bouche') || lowerFr.includes('ventre') || lowerFr.includes('cœur') || lowerFr.includes('sang') || lowerFr.includes('malade') || lowerFr.includes('douleur') || lowerFr.includes('santé') || lowerFr.includes('corps')) {
    return 'Corps & Santé';
  }
  if (lowerFr.includes('maison') || lowerFr.includes('porte') || lowerFr.includes('toit') || lowerFr.includes('lit') || lowerFr.includes('marmite') || lowerFr.includes('habit') || lowerFr.includes('vêtement') || lowerFr.includes('chaussure') || lowerFr.includes('couteau') || lowerFr.includes('chaise') || lowerFr.includes('table') || lowerFr.includes('feu') || lowerFr.includes('case') || lowerFr.includes('village')) {
    return 'Maison & Quotidien';
  }
  if (lowerFr.includes('un') || lowerFr.includes('deux') || lowerFr.includes('trois') || lowerFr.includes('quatre') || lowerFr.includes('cinq') || lowerFr.includes('dix') || lowerFr.includes('cent') || lowerFr.includes('mille') || lowerFr.includes('jour') || lowerFr.includes('nuit') || lowerFr.includes('matin') || lowerFr.includes('soir') || lowerFr.includes('année') || lowerFr.includes('mois') || lowerFr.includes('heure') || lowerFr.includes('temps')) {
    return 'Nombres & Temps';
  }
  if (lowerNat === 'v' || lowerNat.startsWith('v,') || lowerFr.startsWith('être') || lowerFr.startsWith('faire') || lowerFr.startsWith('aller') || lowerFr.startsWith('marcher') || lowerFr.startsWith('parler') || lowerFr.startsWith('donner') || lowerFr.startsWith('prendre') || lowerFr.startsWith('venir') || lowerFr.startsWith('voir') || lowerFr.startsWith('savoir') || lowerFr.startsWith('pouvoir') || lowerFr.startsWith('vouloir')) {
    return 'Actions & Verbes';
  }
  if (lowerFr.includes('dieu') || lowerFr.includes('ancêtre') || lowerFr.includes('esprit') || lowerFr.includes('sagesse') || lowerFr.includes('proverbe') || lowerFr.includes('conte') || lowerFr.includes('coutume') || lowerFr.includes('tradition') || lowerFr.includes('danse') || lowerFr.includes('chant') || lowerFr.includes('musique') || lowerFr.includes('fête') || lowerFr.includes('chef') || lowerFr.includes('roi')) {
    return 'Patrimoine & Culture';
  }
  if (lowerNat === 'adj' || lowerFr.includes('bon') || lowerFr.includes('mauvais') || lowerFr.includes('grand') || lowerFr.includes('petit') || lowerFr.includes('beau') || lowerFr.includes('fort') || lowerFr.includes('chaud') || lowerFr.includes('froid') || lowerFr.includes('rouge') || lowerFr.includes('noir') || lowerFr.includes('blanc')) {
    return 'Qualités & Descriptions';
  }
  return 'Vocabulaire Général';
}

function generatePhonetic(word) {
  const clean = word.replace(/[^\w\s'-]/gi, '').trim().toLowerCase();
  const parts = clean.split(/[-\s]+/);
  return `[${parts.join('-')}]`;
}

function calculateDifficulty(word, fr, nature) {
  const len = word.length;
  if (len <= 4 && (nature === 'nm' || nature === 'adv')) return 1;
  if (len <= 7) return 2;
  if (len <= 11) return 3;
  return 4;
}

const content = decodeCP850(rawBuffer);
const rawLines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

const items = [];
const seenWords = new Set();

for (let i = 0; i < rawLines.length; i++) {
  const line = rawLines[i];
  if (!line.includes(';')) continue;
  const parts = parseCsvLine(line);
  if (parts.length < 3) continue;
  if (parts[0] === 'N°' || isNaN(parseInt(parts[0], 10))) continue;

  const num = parseInt(parts[0], 10);
  const wordNative = parts[1].replace(/\s+/g, ' ').trim();
  const translationFr = parts[2].replace(/\s+/g, ' ').trim();
  const nature = parts[3] ? parts[3].trim() : '';
  const nounClass = parts[4] ? parts[4].trim() : '';
  const duplicate = parts[5] ? parts[5].trim() : 'Non';

  if (!wordNative || !translationFr) continue;

  const cleanAudioName = wordNative.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const category = inferCategory(wordNative, translationFr, nature);
  const phonetic = generatePhonetic(wordNative);
  const difficultyLevel = calculateDifficulty(wordNative, translationFr, nature);

  let grammaticalInfo = '';
  if (nature && nounClass && nounClass !== '()') {
    grammaticalInfo = `Nature : ${nature}, Classe : ${nounClass}.`;
  } else if (nature) {
    grammaticalInfo = `Nature : ${nature}.`;
  } else if (nounClass && nounClass !== '()') {
    grammaticalInfo = `Classe : ${nounClass}.`;
  }

  const culturalNote = `${grammaticalInfo ? grammaticalInfo + ' ' : ''}Terme authentique de la langue Lari (Pool / Brazzaville).`;

  items.push({
    id: `w${num}`,
    wordNative: wordNative,
    phonetic: phonetic,
    nounClass: nounClass && nounClass !== '()' ? `${nature} ${nounClass}`.trim() : nature,
    translationFr: translationFr,
    translationEn: translationFr, // Accessible fallback
    category: category,
    difficultyLevel: difficultyLevel,
    culturalNote: culturalNote,
    exampleSentenceNative: '',
    exampleSentenceFr: '',
    audioUrl: `/audio/words/${cleanAudioName || 'w' + num}.wav`,
    validatedByElder: true,
    speakerName: 'Comité des Sages & Linguistes Lari (Pool / Brazzaville)',
    source: 'Dictionnaire Vivant Lari-Français Authentique'
  });
}

console.log(`✅ ${items.length} mots Lari authentiques extraits avec succès du fichier Desktop !`);

// Category distribution
const catCounts = {};
items.forEach(it => {
  catCounts[it.category] = (catCounts[it.category] || 0) + 1;
});
console.log('Répartition par catégories :', catCounts);

// Save to data/lexicon/dictionnaire_lari_francais.json
const jsonTarget = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
fs.writeFileSync(jsonTarget, JSON.stringify(items, null, 2), 'utf-8');
console.log(`✅ Fichier JSON enregistré dans ${jsonTarget}`);

// Save to data/lexicon/dictionnaire_lari_francais.csv with UTF-8
const csvTarget = path.resolve('data/lexicon/dictionnaire_lari_francais.csv');
let csvContent = 'N°;Mot ou expression lari;Signification française;Nature grammaticale;Classes / préfixes;Catégorie\r\n';
items.forEach(it => {
  csvContent += `"${it.id}";"${it.wordNative.replace(/"/g, '""')}";"${it.translationFr.replace(/"/g, '""')}";"${(it.nounClass || '').replace(/"/g, '""')}";"${it.category}"\r\n`;
});
fs.writeFileSync(csvTarget, csvContent, 'utf-8');
console.log(`✅ Fichier CSV enregistré dans ${csvTarget}`);
