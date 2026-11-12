import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Share,
  PlusSquare,
  Sparkles,
  WifiOff,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  isPwaInstalled,
  canPromptPwaInstall,
  promptPwaInstall,
  isPwaInstallDismissed,
  dismissPwaInstall,
  isIosSafari,
  isIosDevice,
  addInstallPromptListener
} from '../utils/pwa';

interface PWAInstallPromptProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  forceOpen = false,
  onClose
}) => {
  const [isInstalled, setIsInstalled] = useState<boolean>(true);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  useEffect(() => {
    const installed = isPwaInstalled();
    setIsInstalled(installed);

    if (installed) {
      setIsVisible(false);
      return;
    }

    const unsubscribe = addInstallPromptListener((available) => {
      setCanInstall(available);
      if (forceOpen) {
        setIsVisible(true);
      } else if (!isPwaInstallDismissed() && !installed) {
        // Delay slightly for smooth page load experience
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    });

    // Check iOS Safari specific flow
    if (isIosSafari() && !installed && !isPwaInstallDismissed() && !forceOpen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (forceOpen) {
      setIsVisible(true);
    }

    return () => unsubscribe();
  }, [forceOpen]);

  // If forceOpen prop changes
  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      if (isIosSafari() || isIosDevice()) {
        setShowIosGuide(true);
      }
    }
  }, [forceOpen]);

  const handleInstallClick = async () => {
    if (isIosSafari() || isIosDevice()) {
      setShowIosGuide(true);
      return;
    }

    if (canPromptPwaInstall()) {
      setIsInstalling(true);
      const outcome = await promptPwaInstall();
      setIsInstalling(false);
      if (outcome === 'accepted') {
        setIsVisible(false);
        if (onClose) onClose();
      }
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    dismissPwaInstall(7); // Dismiss for 7 days
    if (onClose) onClose();
  };

  if (isInstalled && !forceOpen) return null;
  if (!isVisible && !forceOpen) return null;

  return (
    <>
      {/* 1. Floating Bottom Banner for Instant Installation */}
      {!showIosGuide && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-4 shadow-2xl border-2 border-amber-300/40 relative overflow-hidden backdrop-blur-md">
            {/* Subtle decorative background circle */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              {/* App Icon */}
              <div className="w-13 h-13 rounded-xl bg-savanna-100 p-1.5 shadow-md flex-shrink-0 border border-amber-200">
                <img
                  src="/icons/icon-192.svg"
                  alt="Mwana Lari App"
                  className="w-full h-full object-contain drop-shadow"
                  onError={(e) => {
                    // Fallback to favicon
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5">
                  <span className="bg-forest-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Application Officielle
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-100 text-xs">
                    <WifiOff className="w-3 h-3 text-amber-200" />
                    100% Hors-Ligne
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-tight mt-0.5">
                  Installer Mwana Lari
                </h4>
                <p className="text-amber-100/90 text-xs mt-0.5 leading-snug">
                  Accédez aux 2 600 mots, leçons et contes en un clic, même sans connexion Internet !
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="flex-1 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs py-2 px-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-amber-600" />
                    <span>{isInstalling ? 'Installation...' : 'Installer sur mon téléphone'}</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-amber-100 hover:text-white text-xs font-medium py-2 px-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. iOS / Safari Step-by-Step Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 p-1 flex items-center justify-center shadow-md">
                  <img src="/icons/icon-192.svg" alt="Mwana Lari" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-lg">Installer Mwana Lari</h3>
                  <p className="text-xs text-amber-700">Guide d'installation iPhone / iPad / Safari</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-amber-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="py-5 space-y-4">
              <div className="flex items-start gap-3.5 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow">
                  1
                </div>
                <div className="text-sm">
                  <p className="font-bold text-amber-950">Appuyez sur le bouton Partager</p>
                  <p className="text-xs text-amber-800 mt-0.5 flex items-center gap-1.5">
                    Dans la barre de navigation Safari, touchez l'icône
                    <Share className="w-4 h-4 text-blue-600 inline" /> <strong>Partager</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow">
                  2
                </div>
                <div className="text-sm">
                  <p className="font-bold text-amber-950">Faites défiler et sélectionnez</p>
                  <p className="text-xs text-amber-800 mt-0.5 flex items-center gap-1.5">
                    Touchez <PlusSquare className="w-4 h-4 text-gray-700 inline" /> <strong>« Sur l'écran d'accueil »</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                <div className="w-8 h-8 rounded-xl bg-forest-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow">
                  3
                </div>
                <div className="text-sm">
                  <p className="font-bold text-forest-950">Touchez « Ajouter »</p>
                  <p className="text-xs text-forest-800 mt-0.5">
                    En haut à droite de l'écran. L'icône Mwana Lari apparaîtra directement sur votre écran d'accueil !
                  </p>
                </div>
              </div>
            </div>

            {/* Perks reminder */}
            <div className="bg-forest-50 p-3 rounded-xl border border-forest-200 flex items-center gap-2.5 text-xs text-forest-900">
              <ShieldCheck className="w-5 h-5 text-forest-600 flex-shrink-0" />
              <span>
                <strong>0 Mo de données gaspillées :</strong> Une fois installée, l'application fonctionne sans connexion Internet.
              </span>
            </div>

            {/* Close action */}
            <div className="mt-5">
              <button
                onClick={handleDismiss}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
