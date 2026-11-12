import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  ShieldCheck,
  Delete,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Calculator,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateMathChallenge, MathChallenge } from '../utils/security';
import { playSuccessChime } from '../utils/audio';

interface ParentalPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  mode?: 'UNLOCK' | 'SETUP';
}

export const ParentalPinModal: React.FC<ParentalPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Espace Réservé aux Parents',
  subtitle = 'Veuillez saisir votre Code PIN parental pour continuer.',
  mode = 'UNLOCK',
}) => {
  const { unlockParentalGate, unlockWithMathChallenge, updateParentalPin, hasParentalPin } = useAuth();

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'NEW' | 'CONFIRM'>('NEW');
  const [isMathMode, setIsMathMode] = useState<boolean>(false);
  const [mathChallenge, setMathChallenge] = useState<MathChallenge>(generateMathChallenge);
  const [mathAnswer, setMathAnswer] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setSetupStep('NEW');
      setIsMathMode(false);
      setMathChallenge(generateMathChallenge());
      setMathAnswer('');
      setErrorMessage(null);
      setIsShaking(false);
      setIsSuccess(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
    setPin('');
    setConfirmPin('');
    setSetupStep('NEW');
  };

  const handleDigitPress = async (digit: string) => {
    if (isSuccess) return;
    setErrorMessage(null);

    if (mode === 'UNLOCK') {
      const nextPin = pin + digit;
      if (nextPin.length <= 4) {
        setPin(nextPin);
        if (nextPin.length === 4) {
          // Auto-verify on 4 digits
          const success = await unlockParentalGate(nextPin);
          if (success) {
            playSuccessChime();
            setIsSuccess(true);
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 600);
          } else {
            triggerError('Code PIN incorrect. Code par défaut : 1234');
          }
        }
      }
    } else {
      // SETUP MODE
      if (setupStep === 'NEW') {
        const nextPin = pin + digit;
        if (nextPin.length <= 4) {
          setPin(nextPin);
          if (nextPin.length === 4) {
            setSetupStep('CONFIRM');
          }
        }
      } else {
        const nextConfirm = confirmPin + digit;
        if (nextConfirm.length <= 4) {
          setConfirmPin(nextConfirm);
          if (nextConfirm.length === 4) {
            if (nextConfirm === pin) {
              await updateParentalPin(pin);
              playSuccessChime();
              setIsSuccess(true);
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 700);
            } else {
              triggerError('Les codes PIN ne correspondent pas. Réessayez.');
            }
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (mode === 'UNLOCK') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (setupStep === 'NEW') {
        setPin((prev) => prev.slice(0, -1));
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setConfirmPin('');
    setSetupStep('NEW');
    setErrorMessage(null);
  };

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(mathAnswer.trim(), 10);
    if (isNaN(parsed)) {
      triggerError('Veuillez saisir un nombre valide.');
      return;
    }

    const success = unlockWithMathChallenge(parsed, mathChallenge.answer);
    if (success) {
      playSuccessChime();
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } else {
      triggerError('Réponse incorrecte. Nouveau calcul généré.');
      setMathChallenge(generateMathChallenge());
      setMathAnswer('');
    }
  };

  const currentDisplayDigits =
    mode === 'UNLOCK' ? pin : setupStep === 'NEW' ? pin : confirmPin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-savanna-950/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl bg-white border-4 border-amber-400 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-5 transition-transform ${
          isShaking ? 'animate-bounce' : 'animate-scaleUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Titles */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-brand-500 to-terracotta-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-amber-500/30">
            {isSuccess ? (
              <Unlock className="w-7 h-7 text-white animate-pulse" />
            ) : isMathMode ? (
              <Calculator className="w-7 h-7 text-white" />
            ) : (
              <Lock className="w-7 h-7 text-white" />
            )}
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Contrôle Parental</span>
            </span>
            <h3 className="text-xl font-black text-savanna-950 mt-1">
              {mode === 'SETUP'
                ? setupStep === 'NEW'
                  ? 'Définir un Code PIN'
                  : 'Confirmez le Code PIN'
                : isMathMode
                ? 'Défi Adulte de Secours'
                : title}
            </h3>
            <p className="text-xs text-savanna-700 font-medium max-w-xs mx-auto mt-0.5">
              {mode === 'SETUP'
                ? setupStep === 'NEW'
                  ? 'Choisissez 4 chiffres secrets pour sécuriser votre espace.'
                  : 'Saisissez à nouveau les 4 chiffres pour valider.'
                : isMathMode
                ? 'Résolvez ce calcul pour déverrouiller sans votre code PIN.'
                : subtitle}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {mode === 'SETUP'
                ? 'Code PIN enregistré avec succès !'
                : 'Accès Parent Déverrouillé (15 min)'}
            </span>
          </div>
        )}

        {/* MAIN BODY: PIN PAD OR MATH CHALLENGE */}
        {!isMathMode ? (
          <div className="space-y-4">
            {/* 4-Digit Dots Visualizer */}
            <div className="flex justify-center items-center gap-4 py-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = currentDisplayDigits.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all transform ${
                      isFilled
                        ? 'bg-amber-500 border-amber-600 scale-125 shadow-md shadow-amber-500/40'
                        : 'bg-savanna-100 border-savanna-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Tactile Keypad (1 to 9, C, 0, Backspace) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="w-full h-12 sm:h-14 rounded-2xl bg-savanna-50 hover:bg-amber-100 active:bg-amber-200 border-2 border-savanna-200 hover:border-amber-400 text-savanna-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                >
                  {digit}
                </button>
              ))}

              {/* Clear Button */}
              <button
                type="button"
                onClick={handleClear}
                className="w-full h-12 sm:h-14 rounded-2xl bg-savanna-100 hover:bg-savanna-200 active:bg-savanna-300 border-2 border-savanna-200 text-savanna-700 font-extrabold text-xs flex items-center justify-center shadow-sm active:scale-95 transition-all"
                title="Effacer"
              >
                C
              </button>

              {/* 0 Button */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="w-full h-12 sm:h-14 rounded-2xl bg-savanna-50 hover:bg-amber-100 active:bg-amber-200 border-2 border-savanna-200 hover:border-amber-400 text-savanna-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                type="button"
                onClick={handleBackspace}
                className="w-full h-12 sm:h-14 rounded-2xl bg-savanna-100 hover:bg-savanna-200 active:bg-savanna-300 border-2 border-savanna-200 text-savanna-700 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                title="Effacer le dernier chiffre"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Helper Info & Math Switcher */}
            <div className="pt-2 text-center space-y-2">
              {mode === 'UNLOCK' && (
                <div className="text-[11px] text-savanna-700 font-medium">
                  {!hasParentalPin ? (
                    <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      💡 Code par défaut : <strong>1234</strong>
                    </span>
                  ) : null}
                </div>
              )}

              {mode === 'UNLOCK' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMathMode(true);
                    setMathChallenge(generateMathChallenge());
                    setErrorMessage(null);
                  }}
                  className="text-xs text-brand-700 hover:text-brand-900 font-extrabold underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Code oublié ? Résoudre un calcul adulte</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ALTERNATIVE MATH CHALLENGE FORM */
          <form onSubmit={handleMathSubmit} className="space-y-4 pt-1 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-center space-y-2">
              <span className="text-[11px] font-extrabold text-amber-900 uppercase">
                Calcul de Vérification Adulte :
              </span>
              <div className="text-2xl font-black text-savanna-950">
                {mathChallenge.question}
              </div>
            </div>

            <div>
              <input
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                placeholder="Votre réponse..."
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-savanna-50 border-2 border-brand-300 text-center text-xl font-black text-savanna-950 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMathMode(false);
                  setErrorMessage(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-savanna-300 text-savanna-800 font-extrabold text-xs hover:bg-savanna-100 transition-colors"
              >
                Retour au PIN
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                Valider
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
