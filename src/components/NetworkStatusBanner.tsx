import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { isOnline as checkIsOnline, addNetworkStatusListener, syncPendingProgressWithBackend } from '../utils/pwa';
import { getPendingSyncQueue } from '../utils/offlineStorage';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(checkIsOnline());
  const [showReconnectedToast, setShowReconnectedToast] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Check pending items in local storage
  const updatePendingCount = async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingCount(queue.length);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    updatePendingCount();

    const unsubscribe = addNetworkStatusListener(async (online) => {
      setIsOnline(online);

      if (online) {
        setShowReconnectedToast(true);
        setIsSyncing(true);

        try {
          await syncPendingProgressWithBackend();
          await updatePendingCount();
        } catch (e) {
          console.warn('Sync attempt failed:', e);
        } finally {
          setIsSyncing(false);
        }

        // Auto hide the green toast after 4 seconds
        const timer = setTimeout(() => {
          setShowReconnectedToast(false);
        }, 4000);
        return () => clearTimeout(timer);
      } else {
        setShowReconnectedToast(false);
      }
    });

    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    await syncPendingProgressWithBackend();
    await updatePendingCount();
    setIsSyncing(false);
  };

  return (
    <>
      {/* 1. Offline Permanent Floating Status Badge */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 text-xs md:text-sm shadow-md flex items-center justify-between sticky top-0 z-40 border-b border-amber-500/40 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-500/80 flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
              <div>
                <span className="font-bold">Mode 100% Hors-Ligne actif :</span>{' '}
                <span className="text-amber-100 hidden sm:inline">
                  Toutes vos leçons, dictionnaire MBUTA et audios restent accessibles sans Internet.
                </span>
                <span className="text-amber-100 sm:hidden">
                  Dictionnaire & Leçons disponibles sans connexion.
                </span>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-900/60 px-2.5 py-1 rounded-full text-xs text-amber-200 border border-amber-400/30 flex-shrink-0">
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{pendingCount} progrès sauvegardé{pendingCount > 1 ? 's' : ''} localement</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Reconnected Toast Notification */}
      {isOnline && showReconnectedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-forest-700 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-forest-400 flex items-center gap-3 backdrop-blur-md">
            <div className="w-6 h-6 rounded-full bg-forest-500 flex items-center justify-center">
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Connexion rétablie !</span>{' '}
              <span className="text-forest-100">
                {isSyncing ? 'Synchronisation de vos progrès...' : 'Vos données sont à jour.'}
              </span>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="ml-2 bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
