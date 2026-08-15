export type AgeGroup = '3-5' | '6-8' | '9-11' | '12-15';

export type UserRole = 'CHILD' | 'PARENT' | 'TEACHER' | 'ELDER' | 'ADMIN';

export interface ChildProfile {
  id: string;
  firstName: string;
  ageGroup: AgeGroup;
  level: number;
  xpPoints: number;
  streakDays: number;
  avatar: string;
}

export interface WordItem {
  id: string;
  wordNative: string; // e.g., "Nzo"
  phonetic: string;    // e.g., "[n-zo]"
  translationFr: string; // e.g., "Maison"
  translationEn: string; // e.g., "House"
  category: string;    // e.g., "Famille", "Animaux", "Maison"
  difficultyLevel: number;
  culturalNote: string;
  exampleSentenceNative?: string;
  exampleSentenceFr?: string;
  audioUrl?: string;
  validatedByElder: boolean;
  speakerName?: string;
}

export interface CulturalStory {
  id: string;
  titleNative: string;
  titleFr: string;
  type: 'STORY' | 'PROVERB' | 'SONG';
  contentNative: string;
  contentFr: string;
  elderSpeakerName: string;
  durationSeconds: number;
  moralLesson: string;
  category: string;
}

export interface LessonUnit {
  id: string;
  level: number;
  titleFr: string;
  titleNative: string;
  description: string;
  icon: string;
  wordCount: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  progressPercent: number;
}

export interface FamilyChallenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  bonusXp: number;
  isCompleted: boolean;
}

export interface StudentProgress {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  level: number;
  wordsLearned: number;
  lessonsDone: number;
  progressPercent: number;
  lastActive: string;
}

export type GameMode = 'riddle' | 'match' | 'listen' | 'puzzle';

export interface RiddleQuestion {
  id: string;
  riddleFr: string;
  clue?: string;
  options: {
    id: string;
    wordNative: string;
    translationFr: string;
    icon: string;
    isCorrect: boolean;
  }[];
  culturalExplanation: string;
}

export interface MatchPair {
  id: string;
  wordNative: string;
  translationFr: string;
  icon: string;
}

export interface ListenQuestion {
  id: string;
  wordNative: string;
  audioPhrase: string;
  promptFr: string;
  options: {
    id: string;
    translationFr: string;
    icon: string;
    isCorrect: boolean;
  }[];
}

export interface WordPuzzleItem {
  id: string;
  wordNative: string;
  translationFr: string;
  icon: string;
  syllables: string[];
}

