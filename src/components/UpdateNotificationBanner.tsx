import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ArrowRight, X, Download } from 'lucide-react';
import { applyAppUpdate, CURRENT_APP_VERSION } from '../utils/pwa';
import { playSuccessChime } from '../utils/audio';

interface UpdateNotificationBannerProps {
  isUpdateAvailable: boolean;
  onDismiss?: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  isUpdateAvailable,
  onDismiss,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isUpdateAvailable || isDismissed) return null;

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    playSuccessChime();
    setTimeout(() => {
      applyAppUpdate();
    }, 600);
  };

  return (
    <div className="sticky top-16 z-40 max-w-7xl mx-auto px-4 py-2 animate-bounce-short">
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 via-amber-500 to-forest-600 p-0.5 shadow-xl">
        <div className="rounded-[14px] bg-white/95 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-300 flex items-center justify-center text-brand-800 flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 animate-spin-slow text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-savanna-950">
                  Mise à jour disponible pour Mwana Lari !
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-300">
                  {CURRENT_APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-savanna-800 font-medium">
                Nouveautés : +300 mots Lari MBUTA, Studio Micro pour les Aînés, Filtres par niveaux (1 à 5).
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleApplyUpdate}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-forest-600 to-emerald-600 hover:from-forest-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Mise à jour en cours...' : 'Mettre à jour maintenant'}</span>
            </button>

            {onDismiss && (
              <button
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss();
                }}
                className="p-2 rounded-xl text-savanna-600 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
                title="Ignorer pour l'instant"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
