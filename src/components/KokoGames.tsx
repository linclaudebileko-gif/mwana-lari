import React, { useState, useEffect } from 'react';
import { GameMode, RiddleQuestion, MatchPair, ListenQuestion, WordPuzzleItem } from '../types';
import { KOKO_RIDDLES, KOKO_MATCH_PAIRS, KOKO_LISTEN_QUESTIONS, KOKO_WORD_PUZZLES } from '../data/mockData';
import { playSuccessChime, playErrorSound, playPopSound, playVictoryFanfare, speakNativeWord } from '../utils/audio';
import { Sparkles, Volume2, Trophy, ArrowRight, RotateCcw, CheckCircle2, HelpCircle, Flame, Star, Brain, Grid, Headphones, Puzzle } from 'lucide-react';

interface KokoGamesProps {
  onEarnXp?: (amount: number) => void;
  onBackToDashboard?: () => void;
}

export const KokoGames: React.FC<KokoGamesProps> = ({ onEarnXp, onBackToDashboard }) => {
  const [activeGame, setActiveGame] = useState<GameMode>('riddle');
  
  // Game 1: Riddles State
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [selectedRiddleOption, setSelectedRiddleOption] = useState<string | null>(null);
  const [isRiddleSubmitted, setIsRiddleSubmitted] = useState(false);
  const [riddleScore, setRiddleScore] = useState(0);

  // Game 2: Match Pairs State
  interface CardItem {
    uid: string;
    pairId: string;
    type: 'native' | 'french';
    label: string;
    icon?: string;
    isMatched: boolean;
  }
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);

  // Game 3: Listen & Find State
  const [listenIndex, setListenIndex] = useState(0);
  const [selectedListenOption, setSelectedListenOption] = useState<string | null>(null);
  const [isListenSubmitted, setIsListenSubmitted] = useState(false);
  const [listenScore, setListenScore] = useState(0);

  // Game 4: Word Puzzle State
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [selectedSyllables, setSelectedSyllables] = useState<string[]>([]);
  const [availableSyllables, setAvailableSyllables] = useState<{ id: string; text: string; used: boolean }[]>([]);
  const [isPuzzleCompleted, setIsPuzzleCompleted] = useState(false);
  const [puzzleScore, setPuzzleScore] = useState(0);

  // General Victory Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedXpTotal, setEarnedXpTotal] = useState(0);

  // Initialize Match Pairs Game
  const initMatchGame = () => {
    const selectedPairs = KOKO_MATCH_PAIRS.slice(0, 4); // 4 pairs (8 cards)
    const cardDeck: CardItem[] = [];
    selectedPairs.forEach((pair) => {
      cardDeck.push({
        uid: `${pair.id}-native`,
        pairId: pair.id,
        type: 'native',
        label: pair.wordNative,
        icon: '🗣️',
        isMatched: false,
      });
      cardDeck.push({
        uid: `${pair.id}-french`,
        pairId: pair.id,
        type: 'french',
        label: pair.translationFr,
        icon: pair.icon,
        isMatched: false,
      });
    });
    // Shuffle
    cardDeck.sort(() => Math.random() - 0.5);
    setCards(cardDeck);
    setSelectedCards([]);
    setMatchedPairsCount(0);
  };

  // Initialize Puzzle Game
  const initPuzzleGame = (index: number) => {
    const current = KOKO_WORD_PUZZLES[index];
    if (!current) return;
    const shuffled = [...current.syllables]
      .sort(() => Math.random() - 0.5)
      .map((syl, i) => ({ id: `${syl}-${i}`, text: syl, used: false }));
    setAvailableSyllables(shuffled);
    setSelectedSyllables([]);
    setIsPuzzleCompleted(false);
  };

  useEffect(() => {
    if (activeGame === 'match') {
      initMatchGame();
    } else if (activeGame === 'puzzle') {
      initPuzzleGame(puzzleIndex);
    }
  }, [activeGame, puzzleIndex]);

  // Handle Riddle Selection
  const handleSelectRiddle = (optionId: string, isCorrect: boolean, nativeWord: string) => {
    if (isRiddleSubmitted) return;
    setSelectedRiddleOption(optionId);
    setIsRiddleSubmitted(true);
    speakNativeWord(nativeWord);

    if (isCorrect) {
      playSuccessChime();
      setRiddleScore((prev) => prev + 1);
      const xp = 20;
      setEarnedXpTotal((prev) => prev + xp);
      if (onEarnXp) onEarnXp(xp);
    } else {
      playErrorSound();
    }
  };

  const handleNextRiddle = () => {
    playPopSound();
    if (riddleIndex < KOKO_RIDDLES.length - 1) {
      setRiddleIndex((prev) => prev + 1);
      setSelectedRiddleOption(null);
      setIsRiddleSubmitted(false);
    } else {
      // Finished all riddles
      playVictoryFanfare();
      setShowCelebration(true);
    }
  };

  // Handle Card Click in Match Game
  const handleCardClick = (card: CardItem) => {
    if (card.isMatched || selectedCards.length === 2) return;
    if (selectedCards.length === 1 && selectedCards[0].uid === card.uid) return;

    playPopSound();
    if (card.type === 'native') {
      speakNativeWord(card.label);
    }

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (first.pairId === second.pairId && first.type !== second.type) {
        // MATCH FOUND!
        setTimeout(() => {
          playSuccessChime();
          setCards((prev) =>
            prev.map((c) => (c.pairId === first.pairId ? { ...c, isMatched: true } : c))
          );
          setSelectedCards([]);
          const newCount = matchedPairsCount + 1;
          setMatchedPairsCount(newCount);
          const xp = 15;
          setEarnedXpTotal((prev) => prev + xp);
          if (onEarnXp) onEarnXp(xp);

          if (newCount === 4) {
            // All pairs matched!
            setTimeout(() => {
              playVictoryFanfare();
              setShowCelebration(true);
            }, 600);
          }
        }, 500);
      } else {
        // NO MATCH
        setTimeout(() => {
          playErrorSound();
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  // Handle Listen Challenge Selection
  const handleSelectListen = (optionId: string, isCorrect: boolean) => {
    if (isListenSubmitted) return;
    setSelectedListenOption(optionId);
    setIsListenSubmitted(true);

    if (isCorrect) {
      playSuccessChime();
      setListenScore((prev) => prev + 1);
      const xp = 20;
      setEarnedXpTotal((prev) => prev + xp);
      if (onEarnXp) onEarnXp(xp);
    } else {
      playErrorSound();
    }
  };

  const handleNextListen = () => {
    playPopSound();
    if (listenIndex < KOKO_LISTEN_QUESTIONS.length - 1) {
      setListenIndex((prev) => prev + 1);
      setSelectedListenOption(null);
      setIsListenSubmitted(false);
    } else {
      playVictoryFanfare();
      setShowCelebration(true);
    }
  };

  // Handle Puzzle Syllable Click
  const handleAddSyllable = (item: { id: string; text: string; used: boolean }) => {
    if (item.used || isPuzzleCompleted) return;
    playPopSound();
    const newSelected = [...selectedSyllables, item.text];
    setSelectedSyllables(newSelected);
    setAvailableSyllables((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, used: true } : s))
    );

    const currentWord = KOKO_WORD_PUZZLES[puzzleIndex];
    if (newSelected.length === currentWord.syllables.length) {
      const assembledWord = newSelected.join('');
      if (assembledWord === currentWord.wordNative) {
        // WIN PUZZLE
        playSuccessChime();
        speakNativeWord(currentWord.wordNative);
        setIsPuzzleCompleted(true);
        setPuzzleScore((prev) => prev + 1);
        const xp = 25;
        setEarnedXpTotal((prev) => prev + xp);
        if (onEarnXp) onEarnXp(xp);
      } else {
        // WRONG ORDER
        playErrorSound();
        setTimeout(() => {
          // Reset current attempt
          setSelectedSyllables([]);
          setAvailableSyllables((prev) => prev.map((s) => ({ ...s, used: false })));
        }, 800);
      }
    }
  };

  const handleNextPuzzle = () => {
    playPopSound();
    if (puzzleIndex < KOKO_WORD_PUZZLES.length - 1) {
      setPuzzleIndex((prev) => prev + 1);
    } else {
      playVictoryFanfare();
      setShowCelebration(true);
    }
  };

  const resetGame = () => {
    setShowCelebration(false);
    if (activeGame === 'riddle') {
      setRiddleIndex(0);
      setSelectedRiddleOption(null);
      setIsRiddleSubmitted(false);
      setRiddleScore(0);
    } else if (activeGame === 'match') {
      initMatchGame();
    } else if (activeGame === 'listen') {
      setListenIndex(0);
      setSelectedListenOption(null);
      setIsListenSubmitted(false);
      setListenScore(0);
    } else if (activeGame === 'puzzle') {
      setPuzzleIndex(0);
      initPuzzleGame(0);
      setPuzzleScore(0);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card-amber p-6 rounded-3xl border-2 border-brand-400 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-brand-500 to-amber-400 p-1 shadow-lg flex items-center justify-center flex-shrink-0 animate-bounce">
              <span className="text-4xl select-none">🦊</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-extrabold text-xs uppercase tracking-wider">
                  Écran n°6 • Ludo-Pédagogie
                </span>
                <span className="flex items-center gap-1 text-xs font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                  <Flame className="w-3.5 h-3.5 text-brand-600 fill-brand-500" />
                  +20 XP par victoire
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-savanna-900 mt-1">
                🎮 Mini-jeux & Énigmes de Koko
              </h1>
              <p className="text-xs sm:text-sm text-savanna-800 font-medium">
                Joue, écoute et gagne des points pour faire grandir ton Baobab linguistique !
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/90 px-4 py-2 rounded-2xl border border-brand-300 shadow-sm">
            <Trophy className="w-6 h-6 text-brand-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-savanna-700">XP Gagnés en jeu</div>
              <div className="text-lg font-black text-brand-700">+{earnedXpTotal} XP</div>
            </div>
          </div>
        </div>

        {/* Game Mode Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-4 border-t border-brand-300/60">
          <button
            onClick={() => { playPopSound(); setActiveGame('riddle'); }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-extrabold text-xs transition-all ${
              activeGame === 'riddle'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/40 scale-102'
                : 'bg-white/80 hover:bg-white text-savanna-900 border border-brand-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>1. Devinettes</span>
          </button>

          <button
            onClick={() => { playPopSound(); setActiveGame('match'); }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-extrabold text-xs transition-all ${
              activeGame === 'match'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 scale-102'
                : 'bg-white/80 hover:bg-white text-savanna-900 border border-brand-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>2. Association</span>
          </button>

          <button
            onClick={() => { playPopSound(); setActiveGame('listen'); }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-extrabold text-xs transition-all ${
              activeGame === 'listen'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 scale-102'
                : 'bg-white/80 hover:bg-white text-savanna-900 border border-brand-200'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>3. Blind Test</span>
          </button>

          <button
            onClick={() => { playPopSound(); setActiveGame('puzzle'); }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-extrabold text-xs transition-all ${
              activeGame === 'puzzle'
                ? 'bg-forest-600 text-white shadow-md shadow-forest-600/40 scale-102'
                : 'bg-white/80 hover:bg-white text-savanna-900 border border-brand-200'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            <span>4. Puzzle de Mots</span>
          </button>
        </div>
      </div>

      {/* GAME 1: KOKO RIDDLES (DEVINETTES) */}
      {activeGame === 'riddle' && (
        <div className="glass-card rounded-3xl p-6 border-2 border-brand-300 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 font-extrabold text-xs flex items-center justify-center border border-brand-300">
                {riddleIndex + 1}/{KOKO_RIDDLES.length}
              </span>
              <h2 className="font-extrabold text-lg sm:text-xl text-savanna-900">
                🧠 L'Énigme du Sage Koko
              </h2>
            </div>
            <div className="text-xs font-bold text-brand-800 bg-brand-100 px-3 py-1 rounded-full border border-brand-300">
              Score : {riddleScore} ⭐
            </div>
          </div>

          {/* Riddle Card */}
          <div className="bg-amber-50/90 rounded-2xl p-5 border-2 border-brand-300/80 space-y-3 relative shadow-inner">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🧐</span>
              <div>
                <p className="text-base sm:text-lg font-bold text-savanna-900 leading-snug">
                  "{KOKO_RIDDLES[riddleIndex].riddleFr}"
                </p>
                {KOKO_RIDDLES[riddleIndex].clue && (
                  <p className="text-xs text-amber-800 font-semibold mt-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand-600" />
                    {KOKO_RIDDLES[riddleIndex].clue}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {KOKO_RIDDLES[riddleIndex].options.map((opt) => {
              const isSelected = selectedRiddleOption === opt.id;
              let btnStyle = 'bg-white hover:bg-brand-50 border-brand-200 hover:border-brand-400 text-savanna-900';
              if (isRiddleSubmitted) {
                if (opt.isCorrect) {
                  btnStyle = 'bg-forest-100 border-forest-500 text-forest-950 ring-2 ring-forest-400 shadow-md';
                } else if (isSelected && !opt.isCorrect) {
                  btnStyle = 'bg-red-50 border-red-400 text-red-900 ring-2 ring-red-300 opacity-80';
                } else {
                  btnStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-50';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isRiddleSubmitted}
                  onClick={() => handleSelectRiddle(opt.id, opt.isCorrect, opt.wordNative)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left group ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                    <div>
                      <div className="font-extrabold text-base sm:text-lg text-savanna-900">
                        {opt.wordNative}
                      </div>
                      <div className="text-xs text-savanna-700 font-medium">
                        {opt.translationFr}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); speakNativeWord(opt.wordNative); }}
                    className="p-2 rounded-xl bg-brand-100/70 hover:bg-brand-200 text-brand-900"
                    title="Écouter le mot"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Step */}
          {isRiddleSubmitted && (
            <div className="p-4 rounded-2xl bg-white border-2 border-brand-300 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-extrabold text-forest-800">
                <CheckCircle2 className="w-5 h-5 text-forest-600" />
                <span>Explication culturelle :</span>
              </div>
              <p className="text-xs sm:text-sm text-savanna-900 font-medium">
                {KOKO_RIDDLES[riddleIndex].culturalExplanation}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextRiddle}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-md shadow-brand-500/30 transition-transform active:scale-95"
                >
                  <span>{riddleIndex < KOKO_RIDDLES.length - 1 ? 'Énigme suivante' : 'Voir le résultat'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAME 2: MATCH PAIRS (ASSOCIATION CARTES / IMAGES) */}
      {activeGame === 'match' && (
        <div className="glass-card rounded-3xl p-6 border-2 border-purple-300 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Grid className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-lg sm:text-xl text-savanna-900">
                  🃏 Retrouve les Paires Lari ⇄ Français
                </h2>
                <p className="text-xs text-savanna-800">
                  Touche une carte en Lari puis sa traduction ou son image !
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
              Paires : {matchedPairsCount} / 4
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map((card) => {
              const isSelected = selectedCards.some((c) => c.uid === card.uid);
              let cardStyle = 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md cursor-pointer';
              if (card.isMatched) {
                cardStyle = 'bg-forest-100 border-forest-400 opacity-90 scale-98 cursor-default';
              } else if (isSelected) {
                cardStyle = 'bg-purple-100 border-purple-600 ring-2 ring-purple-400 scale-102';
              }

              return (
                <div
                  key={card.uid}
                  onClick={() => handleCardClick(card)}
                  className={`h-28 rounded-2xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all ${cardStyle}`}
                >
                  <div className="text-2xl sm:text-3xl mb-1">{card.icon}</div>
                  <div className="font-extrabold text-sm sm:text-base text-savanna-900 leading-tight">
                    {card.label}
                  </div>
                  <div className="text-[10px] text-savanna-700 font-semibold uppercase mt-0.5">
                    {card.type === 'native' ? '🇨🇬 Lari' : '🇫🇷 Français'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={initMatchGame}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl border border-purple-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mélanger à nouveau</span>
            </button>
            <span className="text-xs text-savanna-700 font-medium">
              Trouve les 4 paires pour remporter +60 XP !
            </span>
          </div>
        </div>
      )}

      {/* GAME 3: BLIND TEST AUDIO (ÉCOUTE & TROUVE) */}
      {activeGame === 'listen' && (
        <div className="glass-card rounded-3xl p-6 border-2 border-blue-300 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs flex items-center justify-center border border-blue-300">
                {listenIndex + 1}/{KOKO_LISTEN_QUESTIONS.length}
              </span>
              <h2 className="font-extrabold text-lg sm:text-xl text-savanna-900">
                🎧 Blind Test Audio : Écoute Koko !
              </h2>
            </div>
            <div className="text-xs font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
              Score : {listenScore} ⭐
            </div>
          </div>

          {/* Central Audio Speaker Prompter */}
          <div className="bg-blue-50/90 rounded-3xl p-6 border-2 border-blue-300/80 text-center space-y-4 shadow-inner">
            <p className="text-sm font-bold text-blue-950">
              {KOKO_LISTEN_QUESTIONS[listenIndex].promptFr}
            </p>

            <button
              onClick={() => speakNativeWord(KOKO_LISTEN_QUESTIONS[listenIndex].audioPhrase)}
              className="px-6 py-4 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3"
            >
              <Volume2 className="w-7 h-7 animate-pulse" />
              <span>🔊 Écouter le mot mystère</span>
            </button>
            <div className="text-[11px] text-blue-800 font-medium">
              Touche le bouton pour réécouter la voix de Koko autant de fois que tu veux !
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {KOKO_LISTEN_QUESTIONS[listenIndex].options.map((opt) => {
              const isSelected = selectedListenOption === opt.id;
              let btnStyle = 'bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-400 text-savanna-900';
              if (isListenSubmitted) {
                if (opt.isCorrect) {
                  btnStyle = 'bg-forest-100 border-forest-500 text-forest-950 ring-2 ring-forest-400';
                } else if (isSelected && !opt.isCorrect) {
                  btnStyle = 'bg-red-50 border-red-400 text-red-900 opacity-80';
                } else {
                  btnStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-50';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isListenSubmitted}
                  onClick={() => handleSelectListen(opt.id, opt.isCorrect)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center group ${btnStyle}`}
                >
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{opt.icon}</span>
                  <span className="font-extrabold text-sm sm:text-base">{opt.translationFr}</span>
                </button>
              );
            })}
          </div>

          {isListenSubmitted && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextListen}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-600/30 transition-transform active:scale-95"
              >
                <span>{listenIndex < KOKO_LISTEN_QUESTIONS.length - 1 ? 'Question suivante' : 'Voir le résultat'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAME 4: WORD PUZZLE (RECONSTITUTION DE MOTS) */}
      {activeGame === 'puzzle' && (
        <div className="glass-card rounded-3xl p-6 border-2 border-forest-300 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-forest-100 text-forest-900 font-extrabold text-xs flex items-center justify-center border border-forest-300">
                {puzzleIndex + 1}/{KOKO_WORD_PUZZLES.length}
              </span>
              <h2 className="font-extrabold text-lg sm:text-xl text-savanna-900">
                🧩 Puzzle des Syllabes Lari
              </h2>
            </div>
            <div className="text-xs font-bold text-forest-900 bg-forest-100 px-3 py-1 rounded-full border border-forest-300">
              Score : {puzzleScore} ⭐
            </div>
          </div>

          {/* Current Target Word Info */}
          <div className="bg-forest-50/90 rounded-3xl p-6 border-2 border-forest-300/80 text-center space-y-3">
            <div className="text-5xl">{KOKO_WORD_PUZZLES[puzzleIndex].icon}</div>
            <div>
              <div className="text-xs uppercase font-bold text-forest-800 tracking-wider">Mot à recomposer :</div>
              <div className="text-xl sm:text-2xl font-black text-forest-950">
                {KOKO_WORD_PUZZLES[puzzleIndex].translationFr}
              </div>
            </div>

            {/* Assembled Word Box */}
            <div className="flex justify-center items-center gap-2 pt-2">
              {KOKO_WORD_PUZZLES[puzzleIndex].syllables.map((_, i) => (
                <div
                  key={i}
                  className={`w-20 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-lg sm:text-xl transition-all ${
                    selectedSyllables[i]
                      ? isPuzzleCompleted
                        ? 'bg-forest-500 text-white border-forest-600 shadow-md animate-bounce'
                        : 'bg-white text-savanna-900 border-forest-400 shadow-sm'
                      : 'bg-forest-100/50 border-dashed border-forest-300 text-forest-400'
                  }`}
                >
                  {selectedSyllables[i] || '?'}
                </div>
              ))}
            </div>
          </div>

          {/* Available Syllable Bubbles */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-savanna-800 text-center uppercase">
              Touche les syllabes dans le bon ordre :
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {availableSyllables.map((item) => (
                <button
                  key={item.id}
                  disabled={item.used || isPuzzleCompleted}
                  onClick={() => handleAddSyllable(item)}
                  className={`px-6 py-3.5 rounded-2xl font-black text-lg sm:text-xl border-2 transition-all active:scale-95 ${
                    item.used
                      ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'bg-white hover:bg-forest-100 text-forest-900 border-forest-400 shadow-md hover:scale-105'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>

          {isPuzzleCompleted && (
            <div className="p-4 rounded-2xl bg-forest-100 border-2 border-forest-400 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-forest-700" />
                <div>
                  <div className="font-extrabold text-forest-950 text-base">
                    Bravo ! « {KOKO_WORD_PUZZLES[puzzleIndex].wordNative} » ({KOKO_WORD_PUZZLES[puzzleIndex].translationFr})
                  </div>
                  <div className="text-xs text-forest-800 font-semibold">+25 XP gagnés !</div>
                </div>
              </div>

              <button
                onClick={handleNextPuzzle}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-sm shadow-md transition-transform active:scale-95"
              >
                <span>{puzzleIndex < KOKO_WORD_PUZZLES.length - 1 ? 'Mot suivant' : 'Terminer le puzzle'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* VICTORY CELEBRATION MODAL */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-brand-400 shadow-2xl text-center space-y-6 relative animate-scaleUp">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-brand-500 to-amber-300 p-1 shadow-lg flex items-center justify-center">
              <span className="text-5xl select-none animate-bounce">🏆</span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
                <Star className="w-6 h-6 fill-amber-400" />
                <Star className="w-8 h-8 fill-amber-400" />
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-savanna-900">
                Kiese ki nene ! 🥳
              </h3>
              <p className="text-sm font-semibold text-savanna-800 mt-1">
                Koko est très fier de toi ! Tu deviens un vrai champion du Lari.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-brand-300 flex items-center justify-around">
              <div>
                <div className="text-xs uppercase font-bold text-amber-900">Points Gagnés</div>
                <div className="text-2xl font-black text-brand-700">+{earnedXpTotal} XP</div>
              </div>
              <div className="h-8 w-px bg-brand-300"></div>
              <div>
                <div className="text-xs uppercase font-bold text-amber-900">Progression</div>
                <div className="text-2xl font-black text-forest-700">100%</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetGame}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-md transition-transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rejouer</span>
              </button>
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-savanna-200 hover:bg-savanna-300 text-savanna-900 font-extrabold text-sm border border-brand-300 transition-colors"
                >
                  <span>Tableau de bord</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
