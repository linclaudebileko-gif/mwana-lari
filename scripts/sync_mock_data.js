import fs from 'fs';
import path from 'path';

const lexicon = JSON.parse(fs.readFileSync('data/lexicon/dictionnaire_lari_francais.json', 'utf-8'));

const CULTURAL_STORIES = [
  {
    id: 's1',
    type: 'STORY',
    titleNative: 'Nkosi na Mboloko',
    titleFr: 'Le Lion et la Petite Biche rusée',
    elderSpeakerName: 'Mbuta Papa Jean-Baptiste (Pointe-Noire)',
    durationSeconds: 180,
    moralLesson: "L'intelligence et la sagesse (Mayele) triomphent toujours de la force brute.",
    category: 'Contes des Aînés',
    audioUrl: '/audio/stories/nkosi_na_mbolo.wav',
    contentNative: 'Kala-kala mu mfinda yinene ya Kongo, Nkosi wabedi mfumu a biyilu biwonsono. Kansi Mboloko, na mayele maandi ma nene, wazolandi kuta mambu ma ndandu...',
    contentFr: "Il était une fois, dans la grande forêt du Pool, le Lion qui régnait en maître. Mais la petite biche Mboloko, avec sa vive intelligence, sut déjouer tous les pièges et apporter la paix aux animaux..."
  },
  {
    id: 's2',
    type: 'STORY',
    titleNative: 'Kongo dia Ntotila : Lusansu lwa Bakulu',
    titleFr: 'Le Royaume du Kongo : La Mémoire des Ancêtres',
    elderSpeakerName: 'Mbuta Pauline (Brazzaville / Bacongo)',
    durationSeconds: 240,
    moralLesson: "Connaître ses racines et respecter la terre sacrée (Ntoto ya Bakulu) est la clé de la dignité.",
    category: 'Histoire & Origines',
    audioUrl: '/audio/stories/kongo_dia_ntotila.wav',
    contentNative: 'Bakulu beto batele ti : Kongo dia Ntotila dyabedi nsi ya nkembo na ngolo. Bantu bawonsono babedi vana kimosi mu zola na bumbote bwa kanda...',
    contentFr: "Nos aînés nous ont transmis que le grand royaume des souverains était un havre de paix, de savoir et de solidarité entre tous les clans unis..."
  },
  {
    id: 's3',
    type: 'SONG',
    titleNative: 'Nkimba ya Mwana Lari',
    titleFr: "Berceuse traditionnelle de l'Enfant Lari",
    elderSpeakerName: 'Yaya Clarisse (Makelekele / Bacongo)',
    durationSeconds: 120,
    moralLesson: "La tendresse maternelle protège l'enfant et apaise son sommeil.",
    category: 'Berceuses & Chants',
    audioUrl: '/audio/stories/nkimba_ya_mwana.wav',
    contentNative: 'Lala mwana\'ami, lala na ngolo. Mama weena vava, tata wele ku bilanga. Zulu dyeena nsemo, Nzambi Mpungu weena kuka ngeye...',
    contentFr: "Dors paisiblement mon enfant chéri. Maman veille sur ton berceau, la nuit est étoilée et bienveillante..."
  },
  {
    id: 's4',
    type: 'PROVERB',
    titleNative: 'Koko mosi ka yendi kula n\'toto ko',
    titleFr: "Une seule main ne balaie pas la terre (L'Union fait la force)",
    elderSpeakerName: 'Mbuta Papa Jean-Baptiste (Pointe-Noire)',
    durationSeconds: 90,
    moralLesson: "La solidarité et le travail d'équipe permettent d'accomplir ce qu'un homme seul ne peut faire.",
    category: 'Proverbes & Sagesse',
    audioUrl: '/audio/stories/ngo_na_nsusu.wav',
    contentNative: 'Bambuta batele : Koko mosi ka yendi kula n\'toto ko. Mu kanda dyeto, kisalu kya nene kisalwanga na moko mawonsono ma bana na bambuta...',
    contentFr: "Les aînés enseignent : Une seule main ne peut balayer toute la cour. C'est ensemble, en unissant nos forces et nos cœurs, que nous bâtissons l'avenir."
  },
  {
    id: 's5',
    type: 'STORY',
    titleNative: 'Ngo na Nsusu : Nsamu wa Bumbote',
    titleFr: 'Le Léopard et la Poule : Conte de la Prudence',
    elderSpeakerName: 'Mbuta Pauline (Brazzaville)',
    durationSeconds: 210,
    moralLesson: 'La vigilance et la douceur protègent contre la tromperie.',
    category: 'Contes des Aînés',
    audioUrl: '/audio/stories/luzolo_lwa_koko.wav',
    contentNative: 'Nsusu wabedi mwana wa mayele. Kilumbu kimosi, Ngo wamvovela ti : Iza twadia vamoxi ! Kansi Nsusu wazaba ti...',
    contentFr: "La poule était prudente et observatrice. Un jour, le léopard voulut l'inviter avec de belles paroles, mais la poule sut déceler le danger avec sagesse..."
  }
];

const LESSON_UNITS = [
  {
    id: 'l1',
    level: 1,
    titleFr: 'Niveau 1 : Salutations, Famille & Maison',
    titleNative: 'Mbote na Nzo ya Kanda',
    description: 'Apprends les formules fondamentales (« Mbote », « Bweni ? », « Ntondele ») et les membres du foyer (« Mama », « Tata », « Mbuta »).',
    icon: '👋',
    wordCount: 35,
    isUnlocked: true,
    isCompleted: true,
    progressPercent: 100,
  },
  {
    id: 'l2',
    level: 2,
    titleFr: 'Niveau 2 : Le Corps Humain & Les Animaux',
    titleNative: 'Nitu na Biyilu bi Mfinda',
    description: 'Nomme les parties du corps (« Ntu », « Meso », « Moko », « Ntima ») et les animaux de la savane (« Nkosi », « Ngo », « Nuni »).',
    icon: '🦁',
    wordCount: 40,
    isUnlocked: true,
    isCompleted: false,
    progressPercent: 65,
  },
  {
    id: 'l3',
    level: 3,
    titleFr: 'Niveau 3 : Métiers, Ville & Le Temps',
    titleNative: 'Misalu, Zandu na Ntangu',
    description: 'Découvre les métiers (« Mulongi », « Mubakisi »), la ville (« Zandu », « Nzila ») et les saisons (« Mvula », « Mwini »).',
    icon: '🛠️',
    wordCount: 45,
    isUnlocked: true,
    isCompleted: false,
    progressPercent: 20,
  },
  {
    id: 'l4',
    level: 4,
    titleFr: 'Niveau 4 : Nature, Sentiments & Verbes d\'Action',
    titleNative: 'Kiese, Luzolo na Mayele',
    description: 'Exprime tes émotions (« Luzolo », « Kiese »), décris la nature (« Nzadi », « Mfinda ») et manie les verbes d\'action.',
    icon: '❤️',
    wordCount: 50,
    isUnlocked: false,
    isCompleted: false,
    progressPercent: 0,
  },
  {
    id: 'l5',
    level: 5,
    titleFr: 'Niveau 5 : Proverbes, Histoire & Sagesses des Aînés',
    titleNative: 'Bingana na Lusansu lwa Bakulu',
    description: 'Maîtrise les proverbes ancestraux (« Bingana »), l\'histoire du Kongo dia Ntotila et la philosophie du Kimuntu.',
    icon: '👑',
    wordCount: 43,
    isUnlocked: false,
    isCompleted: false,
    progressPercent: 0,
  }
];

const FAMILY_CHALLENGES = [
  {
    id: 'fc1',
    title: 'Défi du Soir : Salutations à table en famille !',
    description: 'Chaque membre de la famille doit saluer en Lari authentique (« Mbote Mama ! », « Bweni Tata ? », « Ntondele madiya ! ») au repas.',
    targetCount: 4,
    currentCount: 4,
    bonusXp: 50,
    isCompleted: true,
  },
  {
    id: 'fc2',
    title: 'La Voix des Bambuta : Enregistrer la voix d\'un aîné',
    description: 'Enregistre 1 proverbe ou 1 conte avec tes grands-parents (Mbuta) au micro dans l\'Espace Patrimoine.',
    targetCount: 1,
    currentCount: 1,
    bonusXp: 150,
    isCompleted: true,
  },
  {
    id: 'fc3',
    title: 'Défi Corps Humain : Nommer 5 parties du corps',
    description: 'Montre et nomme 5 parties du corps en Lari (Ntu, Meso, Matu, Moko, Ntima) sans hésiter.',
    targetCount: 5,
    currentCount: 3,
    bonusXp: 80,
    isCompleted: false,
  }
];

const CLASS_STUDENTS = [
  { id: 'st1', name: 'Kamba M.', ageGroup: '6-8', level: 2, wordsLearned: 98, lessonsDone: 14, progressPercent: 92, lastActive: 'Aujourd\'hui' },
  { id: 'st2', name: 'Nsona B.', ageGroup: '6-8', level: 1, wordsLearned: 64, lessonsDone: 9, progressPercent: 78, lastActive: 'Aujourd\'hui' },
  { id: 'st3', name: 'Mavoungou G.', ageGroup: '9-11', level: 3, wordsLearned: 185, lessonsDone: 22, progressPercent: 96, lastActive: 'Aujourd\'hui' },
  { id: 'st4', name: 'Massamba C.', ageGroup: '6-8', level: 1, wordsLearned: 45, lessonsDone: 6, progressPercent: 60, lastActive: 'Il y a 1 jour' },
];

const KOKO_RIDDLES = [
  {
    id: 'r1',
    riddleFr: 'Je suis le roi majestueux de la forêt. Quand je rugis, tous les animaux m\'écoutent avec respect. Qui suis-je en Lari ?',
    clue: 'Indice : Mon nom commence par la lettre "N" et se termine par "si".',
    options: [
      { id: 'o1', wordNative: 'Nkosi', translationFr: 'Lion', icon: '🦁', isCorrect: true },
      { id: 'o2', wordNative: 'Nzo', translationFr: 'Maison', icon: '🏡', isCorrect: false },
      { id: 'o3', wordNative: 'Masa', translationFr: 'Eau', icon: '💧', isCorrect: false },
      { id: 'o4', wordNative: 'Tata', translationFr: 'Papa', icon: '👨', isCorrect: false },
    ],
    culturalExplanation: 'Bravo ! « Nkosi » est le lion en Lari. Dans les contes des aînés, il symbolise la noblesse et le pouvoir.',
  },
  {
    id: 'r2',
    riddleFr: 'C\'est le lieu chaleureux où toute la famille se réunit pour partager le bon repas (Madiya) et écouter les contes au clair de lune. Quel est ce lieu en Lari ?',
    clue: 'Indice : On y vit tous ensemble sous un même toit.',
    options: [
      { id: 'o1', wordNative: 'Mwana', translationFr: 'Enfant', icon: '👶', isCorrect: false },
      { id: 'o2', wordNative: 'Nzo', translationFr: 'Maison / Foyer', icon: '🏡', isCorrect: true },
      { id: 'o3', wordNative: 'Mbote', translationFr: 'Bonjour', icon: '👋', isCorrect: false },
      { id: 'o4', wordNative: 'Mbuta', translationFr: 'Aîné / Sage', icon: '👵', isCorrect: false },
    ],
    culturalExplanation: 'Exact ! « Nzo » désigne la maison et le foyer chaleureux chez les Lari.',
  },
  {
    id: 'r3',
    riddleFr: 'Il porte les cheveux blancs de la sagesse, connaît tous les contes et a donné son nom à l\'application de référence du lari. Qui est-il ?',
    clue: 'Indice : C\'est le mot « Mbuta » !',
    options: [
      { id: 'o1', wordNative: 'Mbuta', translationFr: 'Aîné / Sage / Doyen', icon: '👵', isCorrect: true },
      { id: 'o2', wordNative: 'Mwana', translationFr: 'Enfant', icon: '🧒', isCorrect: false },
      { id: 'o3', wordNative: 'Nkosi', translationFr: 'Lion', icon: '🦁', isCorrect: false },
      { id: 'o4', wordNative: 'Zole', translationFr: 'Deux', icon: '2️⃣', isCorrect: false },
    ],
    culturalExplanation: 'Magnifique ! « Mbuta » est l\'aîné, le doyen respecté et le gardien de la mémoire et des traditions lari.',
  },
  {
    id: 'r4',
    riddleFr: 'Je suis l\'organe précieux situé dans la poitrine qui bat pour donner la vie et ressent la joie (Kiese) et l\'amour (Luzolo). Qui suis-je en Lari ?',
    clue: 'Indice : On dit « Ntima ya bumbote » pour désigner un cœur généreux.',
    options: [
      { id: 'o1', wordNative: 'Meso', translationFr: 'Yeux', icon: '👀', isCorrect: false },
      { id: 'o2', wordNative: 'Ntima', translationFr: 'Cœur', icon: '❤️', isCorrect: true },
      { id: 'o3', wordNative: 'Moko', translationFr: 'Mains', icon: '🖐️', isCorrect: false },
      { id: 'o4', wordNative: 'Kulu', translationFr: 'Pied', icon: '🦶', isCorrect: false },
    ],
    culturalExplanation: 'Excellent ! « Ntima » est le cœur et le siège des sentiments nobles chez les Lari.',
  },
  {
    id: 'r5',
    riddleFr: 'Je coule puissamment à travers le Pool et Brazzaville, et mon nom a inspiré le grand royaume historique. Quel est ce fleuve en Lari ?',
    clue: 'Indice : « Nzadi ya Kongo » !',
    options: [
      { id: 'o1', wordNative: 'Nzadi', translationFr: 'Fleuve', icon: '🌊', isCorrect: true },
      { id: 'o2', wordNative: 'Mfinda', translationFr: 'Forêt', icon: '🌳', isCorrect: false },
      { id: 'o3', wordNative: 'Bwala', translationFr: 'Village', icon: '🏘️', isCorrect: false },
      { id: 'o4', wordNative: 'Tiya', translationFr: 'Feu', icon: '🔥', isCorrect: false },
    ],
    culturalExplanation: 'Bravo ! « Nzadi » est le fleuve. Le fleuve Congo (« Nzadi ya Kongo ») est le cœur battant de la région.',
  }
];

const KOKO_MATCH_PAIRS = [
  { id: 'mp1', wordNative: 'Mbote', translationFr: 'Bonjour', icon: '👋' },
  { id: 'mp2', wordNative: 'Mbuta', translationFr: 'Aîné / Sage', icon: '👵' },
  { id: 'mp3', wordNative: 'Mama', translationFr: 'Maman', icon: '👩' },
  { id: 'mp4', wordNative: 'Tata', translationFr: 'Papa', icon: '👨' },
  { id: 'mp5', wordNative: 'Mwana', translationFr: 'Enfant', icon: '👶' },
  { id: 'mp6', wordNative: 'Ntondele', translationFr: 'Merci', icon: '🙏' },
  { id: 'mp7', wordNative: 'Nzo', translationFr: 'Maison', icon: '🏡' },
  { id: 'mp8', wordNative: 'Nitu', translationFr: 'Corps humain', icon: '🏃' },
  { id: 'mp9', wordNative: 'Ntima', translationFr: 'Cœur', icon: '❤️' },
  { id: 'mp10', wordNative: 'Nkosi', translationFr: 'Lion', icon: '🦁' },
  { id: 'mp11', wordNative: 'Ngo', translationFr: 'Léopard', icon: '🐆' },
  { id: 'mp12', wordNative: 'Masa', translationFr: 'Eau', icon: '💧' },
  { id: 'mp13', wordNative: 'Madiya', translationFr: 'Repas', icon: '🍲' },
  { id: 'mp14', wordNative: 'Saka-saka', translationFr: 'Feuilles de manioc', icon: '🥬' },
  { id: 'mp15', wordNative: 'Kiese', translationFr: 'Joie', icon: '🎉' },
  { id: 'mp16', wordNative: 'Nzadi', translationFr: 'Fleuve', icon: '🌊' },
];

const KOKO_LISTEN_QUESTIONS = [
  {
    id: 'lq1',
    wordNative: 'Mbote',
    audioPhrase: 'Mbote',
    promptFr: 'Écoute la voix de Koko et sélectionne la bonne image :',
    options: [
      { id: 'op1', translationFr: 'Bonjour (Mbote)', icon: '👋', isCorrect: true },
      { id: 'op2', translationFr: 'Maison (Nzo)', icon: '🏡', isCorrect: false },
      { id: 'op3', translationFr: 'Lion (Nkosi)', icon: '🦁', isCorrect: false },
      { id: 'op4', translationFr: 'Eau (Masa)', icon: '💧', isCorrect: false },
    ]
  },
  {
    id: 'lq2',
    wordNative: 'Mbuta',
    audioPhrase: 'Mbuta',
    promptFr: 'Qui Koko nomme-t-il avec grand respect ?',
    options: [
      { id: 'op1', translationFr: 'Enfant (Mwana)', icon: '👶', isCorrect: false },
      { id: 'op2', translationFr: 'Aîné / Sage (Mbuta)', icon: '👵', isCorrect: true },
      { id: 'op3', translationFr: 'Maman (Mama)', icon: '👩', isCorrect: false },
      { id: 'op4', translationFr: 'Deux (Zole)', icon: '✌️', isCorrect: false },
    ]
  },
  {
    id: 'lq3',
    wordNative: 'Nitu',
    audioPhrase: 'Nitu',
    promptFr: 'Écoute bien la prononciation et sélectionne le mot correspondant :',
    options: [
      { id: 'op1', translationFr: 'Corps humain / Santé (Nitu)', icon: '🏃', isCorrect: true },
      { id: 'op2', translationFr: 'Arbre (Muti)', icon: '🌳', isCorrect: false },
      { id: 'op3', translationFr: 'Lion (Nkosi)', icon: '🦁', isCorrect: false },
      { id: 'op4', translationFr: 'Un (Mosi)', icon: '1️⃣', isCorrect: false },
    ]
  },
  {
    id: 'lq4',
    wordNative: 'Ntima',
    audioPhrase: 'Ntima',
    promptFr: 'De quelle partie essentielle du corps Koko parle-t-il ?',
    options: [
      { id: 'op1', translationFr: 'Yeux (Meso)', icon: '👀', isCorrect: false },
      { id: 'op2', translationFr: 'Cœur (Ntima)', icon: '❤️', isCorrect: true },
      { id: 'op3', translationFr: 'Mains (Moko)', icon: '🖐️', isCorrect: false },
      { id: 'op4', translationFr: 'Maison (Nzo)', icon: '🏡', isCorrect: false },
    ]
  },
  {
    id: 'lq5',
    wordNative: 'Ntondele',
    audioPhrase: 'Ntondele',
    promptFr: 'Quel mot de gratitude et de remerciement Koko prononce-t-il ?',
    options: [
      { id: 'op1', translationFr: 'Maison (Nzo)', icon: '🏡', isCorrect: false },
      { id: 'op2', translationFr: 'Merci (Ntondele)', icon: '🙏', isCorrect: true },
      { id: 'op3', translationFr: 'Lion (Nkosi)', icon: '🦁', isCorrect: false },
      { id: 'op4', translationFr: 'Un (Mosi)', icon: '1️⃣', isCorrect: false },
    ]
  }
];

const KOKO_WORD_PUZZLES = [
  {
    id: 'wp1',
    wordNative: 'MBOTE',
    translationFr: 'Bonjour',
    icon: '👋',
    syllables: ['MBO', 'TE'],
  },
  {
    id: 'wp2',
    wordNative: 'MBUTA',
    translationFr: 'Aîné / Sage',
    icon: '👵',
    syllables: ['MBU', 'TA'],
  },
  {
    id: 'wp3',
    wordNative: 'MWANA',
    translationFr: 'Enfant',
    icon: '👶',
    syllables: ['MWA', 'NA'],
  },
  {
    id: 'wp4',
    wordNative: 'NITU',
    translationFr: 'Corps humain',
    icon: '🏃',
    syllables: ['NI', 'TU'],
  },
  {
    id: 'wp5',
    wordNative: 'NTIMA',
    translationFr: 'Cœur',
    icon: '❤️',
    syllables: ['NTI', 'MA'],
  },
  {
    id: 'wp6',
    wordNative: 'MADIYA',
    translationFr: 'Repas / Nourriture',
    icon: '🍲',
    syllables: ['MA', 'DI', 'YA'],
  },
  {
    id: 'wp7',
    wordNative: 'MASA',
    translationFr: 'Eau fraîche',
    icon: '💧',
    syllables: ['MA', 'SA'],
  },
  {
    id: 'wp8',
    wordNative: 'NKOSI',
    translationFr: 'Lion',
    icon: '🦁',
    syllables: ['NKO', 'SI'],
  }
];

const mockDataContent = `import { ChildProfile, WordItem, CulturalStory, LessonUnit, FamilyChallenge, StudentProgress, RiddleQuestion, MatchPair, ListenQuestion, WordPuzzleItem } from '../types';

export const INITIAL_CHILD_PROFILE: ChildProfile = {
  id: 'child_1',
  firstName: 'Kamba',
  ageGroup: '6-8',
  level: 1,
  xpPoints: 240,
  streakDays: 6,
  avatar: 'koko_happy',
};

// Vocabulaire Lari Authentique (+300 mots conformes au standard MBUTA et aux travaux du Pool / Brazzaville)
export const LARI_WORDS: WordItem[] = ${JSON.stringify(lexicon, null, 2)};

export const CULTURAL_STORIES: CulturalStory[] = ${JSON.stringify(CULTURAL_STORIES, null, 2)};

export const LESSON_UNITS: LessonUnit[] = ${JSON.stringify(LESSON_UNITS, null, 2)};

export const FAMILY_CHALLENGES: FamilyChallenge[] = ${JSON.stringify(FAMILY_CHALLENGES, null, 2)};

export const CLASS_STUDENTS: StudentProgress[] = ${JSON.stringify(CLASS_STUDENTS, null, 2)};

export const KOKO_RIDDLES: RiddleQuestion[] = ${JSON.stringify(KOKO_RIDDLES, null, 2)};

export const KOKO_MATCH_PAIRS: MatchPair[] = ${JSON.stringify(KOKO_MATCH_PAIRS, null, 2)};

export const KOKO_LISTEN_QUESTIONS: ListenQuestion[] = ${JSON.stringify(KOKO_LISTEN_QUESTIONS, null, 2)};

export const KOKO_WORD_PUZZLES: WordPuzzleItem[] = ${JSON.stringify(KOKO_WORD_PUZZLES, null, 2)};
`;

fs.writeFileSync('src/data/mockData.ts', mockDataContent, 'utf-8');
console.log('✅ src/data/mockData.ts successfully updated via JSON serializer!');
