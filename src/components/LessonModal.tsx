import React, { useState } from 'react';
import { LessonUnit, WordItem } from '../types';
import { LARI_WORDS } from '../data/mockData';
import { playSuccessChime, playErrorSound, playPopSound, playVictoryFanfare, speakNativeWord } from '../utils/audio';
import {
  X,
  Volume2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Star,
  Award,
  Heart
} from 'lucide-react';

interface LessonModalProps {
  lesson: LessonUnit;
  onClose: () => void;
  onComplete: (xpEarned: number) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ lesson, onClose, onComplete }) => {
  // 1. Get words matching lesson topic
  const getWordsForLesson = (): WordItem[] => {
    let filtered: WordItem[] = [];
    const lessonTitle = lesson.titleFr.toLowerCase();
    
    if (lessonTitle.includes('salutation') || lessonTitle.includes('famille')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Salutations' || w.category === 'Famille & Foyer');
    } else if (lessonTitle.includes('corps')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Corps Humain');
    } else if (lessonTitle.includes('animaux')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Animaux');
    } else if (lessonTitle.includes('cuisine') || lessonTitle.includes('plat')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Cuisine & Gastronomie' || w.category === 'Nourriture & Repas');
    } else if (lessonTitle.includes('maison') || lessonTitle.includes('foyer')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Maison & Objets' || w.category === 'Famille & Foyer');
    } else if (lessonTitle.includes('métier') || lessonTitle.includes('artisanat')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Métiers & Artisanat');
    } else if (lessonTitle.includes('nature') || lessonTitle.includes('fleuve')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Nature & Paysages');
    } else if (lessonTitle.includes('temps') || lessonTitle.includes('nombre') || lessonTitle.includes('chiffre')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Nombres & Comptage' || w.category === 'Temps & Saisons');
    } else if (lessonTitle.includes('sentiment') || lessonTitle.includes('sagesse')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Sentiments & Valeurs');
    } else if (lessonTitle.includes('histoire') || lessonTitle.includes('royaume') || lessonTitle.includes('proverbe')) {
      filtered = LARI_WORDS.filter(w => w.category === 'Histoire & Traditions' || w.category === 'Proverbes & Sagesses');
    }

    if (filtered.length < 4) {
      filtered = LARI_WORDS.slice(0, 8);
    }
    return filtered.slice(0, 6);
  };

  const lessonWords = getWordsForLesson();
  
  // State Steps: 'discovery' -> 'quiz' -> 'completed'
  const [step, setStep] = useState<'discovery' | 'quiz' | 'completed'>('discovery');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const currentWord = lessonWords[currentWordIndex] || lessonWords[0];
  const currentQuizTarget = lessonWords[quizIndex] || lessonWords[0];

  // Generate 4 options for quiz
  const generateQuizOptions = () => {
    const wrongWords = LARI_WORDS.filter(w => w.id !== currentQuizTarget.id);
    const shuffledWrong = [...wrongWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [currentQuizTarget, ...shuffledWrong].sort(() => 0.5 - Math.random());
    return options;
  };

  const [currentOptions, setCurrentOptions] = useState<WordItem[]>(() => generateQuizOptions());

  const handleNextDiscovery = () => {
    playPopSound();
    if (currentWordIndex < lessonWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // Move to quiz
      playSuccessChime();
      setStep('quiz');
      setQuizIndex(0);
      setCurrentOptions(generateQuizOptions());
    }
  };

  const handlePrevDiscovery = () => {
    playPopSound();
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  const handleSelectQuizOption = (option: WordItem) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option.id);
    setIsAnswerSubmitted(true);

    const correct = option.id === currentQuizTarget.id;
    setIsAnswerCorrect(correct);

    if (correct) {
      playSuccessChime();
      setQuizScore(prev => prev + 1);
    } else {
      playErrorSound();
    }
  };

  const handleNextQuizQuestion = () => {
    playPopSound();
    if (quizIndex < lessonWords.length - 1) {
      const nextIdx = quizIndex + 1;
      setQuizIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      
      // Update options for next question
      const nextTarget = lessonWords[nextIdx];
      const wrongWords = LARI_WORDS.filter(w => w.id !== nextTarget.id);
      const shuffledWrong = [...wrongWords].sort(() => 0.5 - Math.random()).slice(0, 3);
      setCurrentOptions([nextTarget, ...shuffledWrong].sort(() => 0.5 - Math.random()));
    } else {
      // Completed!
      playVictoryFanfare();
      setStep('completed');
    }
  };

  const handleFinishLesson = () => {
    const xpBonus = 60 + quizScore * 10;
    onComplete(xpBonus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-400 flex flex-col relative">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-t-2xl relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl p-2 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
              {lesson.icon}
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-200">
                {lesson.titleNative}
              </span>
              <h2 className="text-lg sm:text-xl font-black">{lesson.titleFr}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all transform hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-amber-100 w-full">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
            style={{
              width: step === 'discovery'
                ? `${((currentWordIndex + 1) / lessonWords.length) * 50}%`
                : step === 'quiz'
                ? `${50 + ((quizIndex + 1) / lessonWords.length) * 50}%`
                : '100%'
            }}
          />
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 flex-1">
          
          {/* STEP 1: DISCOVERY / FLASHCARDS */}
          {step === 'discovery' && currentWord && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span>📖 ÉTAPE 1 : DÉCOUVERTE VOCALE</span>
                <span>Mot {currentWordIndex + 1} / {lessonWords.length}</span>
              </div>

              {/* Word Flashcard */}
              <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-xl bg-gradient-to-b from-amber-50/80 to-white flex flex-col items-center">
                <span className="px-3 py-1 bg-amber-200/60 text-amber-900 rounded-full text-xs font-black uppercase mb-3">
                  {currentWord.category}
                </span>

                <h3 className="text-3xl sm:text-4xl font-black text-savanna-950 tracking-tight">
                  {currentWord.wordNative}
                </h3>
                
                <p className="text-amber-800 text-sm font-mono mt-1 font-bold">
                  {currentWord.phonetic}
                </p>

                <p className="text-lg sm:text-xl font-bold text-emerald-800 mt-3">
                  {currentWord.translationFr}
                </p>

                {/* Audio Button */}
                <button
                  onClick={() => speakNativeWord(currentWord.wordNative)}
                  className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold shadow-lg shadow-amber-500/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Écouter la voix du Mbuta</span>
                </button>

                {/* Cultural Note & Example */}
                {currentWord.culturalNote && (
                  <div className="mt-5 p-3.5 bg-amber-100/50 rounded-2xl text-left w-full border border-amber-200/60 text-xs sm:text-sm text-savanna-900">
                    <p className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Sagesse des Aînés :
                    </p>
                    <p className="text-savanna-800 italic">{currentWord.culturalNote}</p>
                  </div>
                )}

                {currentWord.exampleSentenceNative && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-2xl text-left w-full border border-emerald-200 text-xs sm:text-sm">
                    <p className="font-bold text-emerald-950">Exemple en contexte :</p>
                    <p className="text-emerald-900 font-extrabold">« {currentWord.exampleSentenceNative} »</p>
                    <p className="text-emerald-800 italic">« {currentWord.exampleSentenceFr} »</p>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handlePrevDiscovery}
                  disabled={currentWordIndex === 0}
                  className="px-4 py-2.5 rounded-2xl font-extrabold text-xs text-savanna-700 hover:bg-savanna-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Précédent
                </button>

                <button
                  onClick={handleNextDiscovery}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>{currentWordIndex < lessonWords.length - 1 ? 'Mot suivant' : 'Passer au Quiz Koko 🎯'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INTERACTIVE QUIZ */}
          {step === 'quiz' && currentQuizTarget && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span>🎯 ÉTAPE 2 : QUIZ D'ENTRAÎNEMENT DE KOKO</span>
                <span>Question {quizIndex + 1} / {lessonWords.length}</span>
              </div>

              <div className="text-center">
                <p className="text-xs font-black text-amber-700 uppercase tracking-wider">
                  Comment dit-on en Lari :
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-savanna-950 mt-1">
                  « {currentQuizTarget.translationFr} » ?
                </h3>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentOptions.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isTarget = opt.id === currentQuizTarget.id;
                  
                  let btnClass = "bg-white hover:bg-amber-50 text-savanna-950 border-2 border-savanna-200";
                  if (isAnswerSubmitted) {
                    if (isTarget) {
                      btnClass = "bg-emerald-500 text-white border-2 border-emerald-600 shadow-lg shadow-emerald-500/30";
                    } else if (isSelected && !isTarget) {
                      btnClass = "bg-rose-500 text-white border-2 border-rose-600";
                    } else {
                      btnClass = "bg-savanna-50 text-savanna-400 border-2 border-savanna-100 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectQuizOption(opt)}
                      disabled={isAnswerSubmitted}
                      className={`p-4 rounded-2xl font-black text-base sm:text-lg transition-all transform active:scale-95 flex items-center justify-between ${btnClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs p-1.5 bg-black/10 rounded-xl">🔊</span>
                        <span>{opt.wordNative}</span>
                      </div>
                      {isAnswerSubmitted && isTarget && (
                        <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Banner */}
              {isAnswerSubmitted && (
                <div className={`p-4 rounded-2xl border text-center animate-bounce ${
                  isAnswerCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <p className="font-extrabold text-sm sm:text-base">
                    {isAnswerCorrect ? '🎉 Kiese mingi ! Excellente réponse !' : '💡 Pas tout à fait ! Écoute bien la prononciation :'}
                  </p>
                  <p className="text-xs mt-0.5 font-medium">
                    « {currentQuizTarget.wordNative} » signifie bien « {currentQuizTarget.translationFr} ».
                  </p>
                  
                  <button
                    onClick={handleNextQuizQuestion}
                    className="mt-3 px-6 py-2.5 rounded-xl bg-savanna-900 text-white font-extrabold text-xs shadow-md hover:bg-black transition-all"
                  >
                    {quizIndex < lessonWords.length - 1 ? 'Question suivante ➔' : 'Voir mon résultat 🏆'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COMPLETED / CELEBRATION */}
          {step === 'completed' && (
            <div className="text-center py-6 space-y-5 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-amber-500/30 text-4xl animate-bounce">
                👑
              </div>

              <div>
                <span className="text-xs font-black text-amber-700 uppercase tracking-widest">
                  Unité Validée avec Succès !
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-savanna-950 mt-1">
                  Ntondele mingi, Mwana Lari !
                </h3>
                <p className="text-sm text-savanna-800 max-w-md mx-auto mt-2">
                  Tu as brillamment terminé cette leçon. Ton vocabulaire s'enrichit et ton Baobab de connaissances grandit !
                </p>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-xs font-bold text-amber-800">XP Gagnés</p>
                  <p className="text-2xl font-black text-amber-900">+{60 + quizScore * 10} XP</p>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800">Score Quiz</p>
                  <p className="text-2xl font-black text-emerald-900">{quizScore} / {lessonWords.length}</p>
                </div>
              </div>

              <button
                onClick={handleFinishLesson}
                className="w-full max-w-sm mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-base shadow-xl shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                <span>Encaisser mes Points & Continuer</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
