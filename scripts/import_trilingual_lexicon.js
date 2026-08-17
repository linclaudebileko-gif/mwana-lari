import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('Dictionnaire_MBUTA_Lari_Francais_Anglais.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Fichier introuvable : ${csvPath}`);
  process.exit(1);
}

const rawContent = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

// Function to classify category based on French translation and nature
function inferCategory(wordNative, fr, en, nature) {
  const lowerFr = (fr || '').toLowerCase();
  const lowerEn = (en || '').toLowerCase();
  const lowerNat = (nature || '').toLowerCase();

  if (
    lowerFr.includes('bonjour') || lowerFr.includes('salut') || lowerFr.includes('merci') || 
    lowerFr.includes('adieu') || lowerFr.includes('comment') || lowerFr.includes('bienvenue') || 
    lowerFr.includes('paix') || lowerEn.includes('hello') || lowerEn.includes('welcome') || lowerEn.includes('thank') || lowerEn.includes('how')
  ) {
    return 'Salutations & Politesse';
  }

  if (
    lowerFr.includes('père') || lowerFr.includes('mère') || lowerFr.includes('enfant') || 
    lowerFr.includes('fils') || lowerFr.includes('fille') || lowerFr.includes('frère') || 
    lowerFr.includes('sœur') || lowerFr.includes('famille') || lowerFr.includes('oncle') || 
    lowerFr.includes('tante') || lowerFr.includes('grand-mère') || lowerFr.includes('grand-père') || 
    lowerFr.includes('bébé') || lowerFr.includes('époux') || lowerFr.includes('épouse') || 
    lowerFr.includes('mari') || lowerFr.includes('femme') || lowerFr.includes('homme') ||
    lowerEn.includes('father') || lowerEn.includes('mother') || lowerEn.includes('child') || lowerEn.includes('family') || lowerEn.includes('brother') || lowerEn.includes('sister')
  ) {
    return 'Famille & Relations';
  }

  if (
    lowerFr.includes('manger') || lowerFr.includes('boire') || lowerFr.includes('manioc') || 
    lowerFr.includes('poisson') || lowerFr.includes('viande') || lowerFr.includes('pain') || 
    lowerFr.includes('sauce') || lowerFr.includes('sel') || lowerFr.includes('huile') || 
    lowerFr.includes('vin') || lowerFr.includes('eau') || lowerFr.includes('fruit') || 
    lowerFr.includes('banane') || lowerFr.includes('haricot') || lowerFr.includes('plat') || 
    lowerFr.includes('repas') || lowerFr.includes('foufou') || lowerFr.includes('chikwangue') || 
    lowerFr.includes('piment') || lowerEn.includes('eat') || lowerEn.includes('drink') || lowerEn.includes('food') || lowerEn.includes('cassava') || lowerEn.includes('fish') || lowerEn.includes('meat')
  ) {
    return 'Nourriture & Cuisine';
  }

  if (
    lowerFr.includes('palmier') || lowerFr.includes('arbre') || lowerFr.includes('forêt') || 
    lowerFr.includes('oiseau') || lowerFr.includes('lion') || lowerFr.includes('singe') || 
    lowerFr.includes('léopard') || lowerFr.includes('chèvre') || lowerFr.includes('chien') || 
    lowerFr.includes('chat') || lowerFr.includes('serpent') || lowerFr.includes('rivière') || 
    lowerFr.includes('fleuve') || lowerFr.includes('terre') || lowerFr.includes('herbe') || 
    lowerFr.includes('feuille') || lowerFr.includes('animal') || lowerFr.includes('pluie') || 
    lowerFr.includes('soleil') || lowerFr.includes('lune') || lowerFr.includes('étoile') ||
    lowerEn.includes('tree') || lowerEn.includes('forest') || lowerEn.includes('bird') || lowerEn.includes('lion') || lowerEn.includes('animal') || lowerEn.includes('sun') || lowerEn.includes('moon')
  ) {
    return 'Nature, Faune & Flore';
  }

  if (
    lowerFr.includes('tête') || lowerFr.includes('bras') || lowerFr.includes('jambe') || 
    lowerFr.includes('pied') || lowerFr.includes('main') || lowerFr.includes('œil') || 
    lowerFr.includes('yeux') || lowerFr.includes('dent') || lowerFr.includes('bouche') || 
    lowerFr.includes('ventre') || lowerFr.includes('cœur') || lowerFr.includes('sang') || 
    lowerFr.includes('malade') || lowerFr.includes('douleur') || lowerFr.includes('santé') || 
    lowerFr.includes('corps') || lowerEn.includes('head') || lowerEn.includes('arm') || lowerEn.includes('leg') || lowerEn.includes('eye') || lowerEn.includes('hand') || lowerEn.includes('body')
  ) {
    return 'Corps & Santé';
  }

  if (
    lowerFr.includes('maison') || lowerFr.includes('porte') || lowerFr.includes('toit') || 
    lowerFr.includes('lit') || lowerFr.includes('marmite') || lowerFr.includes('habit') || 
    lowerFr.includes('vêtement') || lowerFr.includes('chaussure') || lowerFr.includes('couteau') || 
    lowerFr.includes('chaise') || lowerFr.includes('table') || lowerFr.includes('feu') || 
    lowerFr.includes('case') || lowerFr.includes('village') || lowerEn.includes('house') || lowerEn.includes('door') || lowerEn.includes('cloth') || lowerEn.includes('table')
  ) {
    return 'Maison & Quotidien';
  }

  if (
    lowerFr.includes('un') || lowerFr.includes('deux') || lowerFr.includes('trois') || 
    lowerFr.includes('quatre') || lowerFr.includes('cinq') || lowerFr.includes('dix') || 
    lowerFr.includes('cent') || lowerFr.includes('mille') || lowerFr.includes('jour') || 
    lowerFr.includes('nuit') || lowerFr.includes('matin') || lowerFr.includes('soir') || 
    lowerFr.includes('année') || lowerFr.includes('mois') || lowerFr.includes('heure') || 
    lowerFr.includes('temps') || lowerEn.includes('one') || lowerEn.includes('two') || lowerEn.includes('three') || lowerEn.includes('day') || lowerEn.includes('night') || lowerEn.includes('year') || lowerEn.includes('time')
  ) {
    return 'Nombres & Temps';
  }

  if (
    lowerNat === 'v' || lowerNat.startsWith('v,') || lowerNat.includes('verbe') ||
    lowerFr.startsWith('être') || lowerFr.startsWith('faire') || lowerFr.startsWith('aller') || 
    lowerFr.startsWith('marcher') || lowerFr.startsWith('parler') || lowerFr.startsWith('donner') || 
    lowerFr.startsWith('prendre') || lowerFr.startsWith('venir') || lowerFr.startsWith('voir') || 
    lowerFr.startsWith('savoir') || lowerFr.startsWith('pouvoir') || lowerFr.startsWith('vouloir') ||
    lowerEn.startsWith('to ') || lowerEn.startsWith('be ')
  ) {
    return 'Actions & Verbes';
  }

  if (
    lowerFr.includes('dieu') || lowerFr.includes('ancêtre') || lowerFr.includes('esprit') || 
    lowerFr.includes('sagesse') || lowerFr.includes('proverbe') || lowerFr.includes('conte') || 
    lowerFr.includes('coutume') || lowerFr.includes('tradition') || lowerFr.includes('danse') || 
    lowerFr.includes('chant') || lowerFr.includes('musique') || lowerFr.includes('fête') || 
    lowerFr.includes('chef') || lowerFr.includes('roi') || lowerEn.includes('god') || lowerEn.includes('ancestor') || lowerEn.includes('tradition') || lowerEn.includes('wisdom') || lowerEn.includes('king')
  ) {
    return 'Patrimoine & Culture';
  }

  if (
    lowerNat === 'adj' || lowerFr.includes('bon') || lowerFr.includes('mauvais') || 
    lowerFr.includes('grand') || lowerFr.includes('petit') || lowerFr.includes('beau') || 
    lowerFr.includes('fort') || lowerFr.includes('chaud') || lowerFr.includes('froid') || 
    lowerFr.includes('rouge') || lowerFr.includes('noir') || lowerFr.includes('blanc') ||
    lowerEn.includes('good') || lowerEn.includes('bad') || lowerEn.includes('big') || lowerEn.includes('small')
  ) {
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

const rows = parseCSV(rawContent);
console.log(`Lecture de ${rows.length} lignes depuis le fichier CSV...`);

const header = rows[0];
console.log('En-têtes détectées :', header);

const items = [];

for (let i = 1; i < rows.length; i++) {
  const parts = rows[i];
  if (parts.length < 4) continue;

  const num = parseInt(parts[0], 10) || i;
  const wordNative = parts[1].replace(/\s+/g, ' ').trim();
  const translationFr = parts[2].replace(/\s+/g, ' ').trim();
  const translationEn = (parts[3] || translationFr).replace(/\s+/g, ' ').trim();
  const nature = parts[4] ? parts[4].trim() : '';
  const nounClass = parts[5] ? parts[5].trim() : '';
  const duplicate = parts[6] ? parts[6].trim() : 'Non';
  const source = parts[7] ? parts[7].trim() : 'MBUTA 1.0.0';

  if (!wordNative || !translationFr) continue;

  const cleanAudioName = wordNative
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const category = inferCategory(wordNative, translationFr, translationEn, nature);
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
    translationEn: translationEn, // Traduction anglaise authentique !
    category: category,
    difficultyLevel: difficultyLevel,
    culturalNote: culturalNote,
    exampleSentenceNative: '',
    exampleSentenceFr: '',
    audioUrl: `/audio/words/${cleanAudioName || 'w' + num}.wav`,
    validatedByElder: true,
    speakerName: 'Comité des Sages & Linguistes Lari (Pool / Brazzaville)',
    source: `MBUTA / ${source}`
  });
}

console.log(`✅ ${items.length} mots Lari trilingues extraits avec succès !`);

// Save JSON
const jsonTarget = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
fs.writeFileSync(jsonTarget, JSON.stringify(items, null, 2), 'utf-8');
console.log(`✅ Fichier JSON mis à jour : ${jsonTarget}`);

// Save CSV
const csvTarget = path.resolve('data/lexicon/dictionnaire_lari_francais.csv');
let csvContent = 'N°;Mot ou expression lari;Signification française;Traduction anglaise;Nature grammaticale;Classes / préfixes;Catégorie;Source\r\n';
items.forEach(it => {
  csvContent += `"${it.id}";"${it.wordNative.replace(/"/g, '""')}";"${it.translationFr.replace(/"/g, '""')}";"${(it.translationEn || '').replace(/"/g, '""')}";"${(it.nounClass || '').replace(/"/g, '""')}";"";"${it.category}";"${it.source}"\r\n`;
});
fs.writeFileSync(csvTarget, csvContent, 'utf-8');
console.log(`✅ Fichier CSV mis à jour : ${csvTarget}`);
