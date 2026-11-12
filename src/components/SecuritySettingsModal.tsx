import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldAlert,
  Save,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ParentalPinModal } from './ParentalPinModal';
import { playSuccessChime } from '../utils/audio';
import { authApi } from '../services/api';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, isParentUnlocked, hasParentalPin, lockParentalGate } = useAuth();

  const [isPinSetupModalOpen, setIsPinSetupModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }

    if (newPassword.length < 12) {
      setPasswordMsg({
        type: 'error',
        text: 'Le nouveau mot de passe doit comporter au moins 12 caractères (phrase de passe recommandée).'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      playSuccessChime();
      setPasswordMsg({ type: 'success', text: 'Mot de passe mis à jour avec succès !' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.message || 'Erreur lors de la modification du mot de passe.'
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleManualLock = () => {
    lockParentalGate();
    playSuccessChime();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-savanna-950/75 backdrop-blur-md animate-fadeIn">
        <div
          className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-brand-300 shadow-2xl overflow-hidden p-5 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto animate-scaleUp"
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

          {/* Modal Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 flex items-center justify-center text-white text-2xl shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-savanna-950">
                Sécurité & Contrôle Parental
              </h2>
              <p className="text-xs text-savanna-700 font-medium">
                Gérez vos accès protégés et la sécurité de votre compte famille.
              </p>
            </div>
          </div>

          {/* Section 1: Parental PIN Status & Management */}
          <div className="p-4 rounded-3xl bg-savanna-50 border-2 border-amber-200 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <h3 className="font-extrabold text-sm text-savanna-950">
                    Code PIN Parental (4 chiffres)
                  </h3>
                </div>
                <p className="text-xs text-savanna-700 font-medium">
                  Protège l'accès à l'Espace Famille, l'Espace École et aux paiements.
                </p>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  hasParentalPin
                    ? 'bg-forest-100 text-forest-800 border border-forest-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {hasParentalPin ? 'Code Personnalisé' : 'Code Standard (1234)'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsPinSetupModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{hasParentalPin ? 'Modifier le Code PIN' : 'Personnaliser mon Code PIN'}</span>
              </button>

              {isParentUnlocked && (
                <button
                  type="button"
                  onClick={handleManualLock}
                  className="px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-extrabold text-xs border border-red-200 transition-all flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-red-600" />
                  <span>Verrouiller maintenant</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Session Security Status */}
          <div className="p-4 rounded-3xl bg-white border border-brand-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-savanna-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>État de la session actuelle :</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  isParentUnlocked
                    ? 'bg-forest-100 text-forest-800 border border-forest-300'
                    : 'bg-savanna-100 text-savanna-800 border border-savanna-300'
                }`}
              >
                {isParentUnlocked ? '🔓 Espace Parent Déverrouillé (Actif)' : '🔒 Mode Enfant Sécurisé'}
              </span>
            </div>
            <p className="text-[11px] text-savanna-700">
              Lorsque vous déverrouillez avec votre PIN, l'accès reste ouvert pendant 15 minutes d'inactivité avant de repasser automatiquement en mode enfant protégé.
            </p>
          </div>

          {/* Section 3: Password Update Form (Only for logged in users) */}
          {user && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3 border-t border-brand-200 pt-4">
              <h3 className="font-extrabold text-sm text-savanna-950 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-brand-600" />
                <span>Modifier le Mot de Passe du Compte ({user.email})</span>
              </h3>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-savanna-800 mb-0.5">
                    Mot de Passe Actuel :
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2 rounded-xl bg-savanna-50 border-2 border-brand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-savanna-800 mb-0.5">
                    Nouveau Mot de Passe :
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 12 caractères ou phrase de passe"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2 rounded-xl bg-savanna-50 border-2 border-brand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-savanna-800 mb-0.5">
                    Confirmer le Nouveau Mot de Passe :
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le nouveau mot de passe"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2 rounded-xl bg-savanna-50 border-2 border-brand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <p className="text-[11px] text-savanna-600">
                  🛡️ Longueur minimale : 12 caractères. Les gestionnaires de mots de passe, le collage et les phrases de passe sont encouragés.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingPassword || !newPassword}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingPassword ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}</span>
              </button>
            </form>
          )}

          {/* Section 4: Privacy & Protection info */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950 space-y-1">
            <div className="font-extrabold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Protection & Vie Privée des Enfants (COPPA / RGPD)</span>
            </div>
            <p className="text-savanna-800">
              Aucune donnée vocale ou nominative d'enfant n'est partagée avec des tiers sans le consentement express d'un tuteur légal. Les enregistrements vocaux d'apprentissage restent stockés sous le contrôle exclusif de votre profil parent.
            </p>
          </div>
        </div>
      </div>

      {/* Parental PIN Setup Modal */}
      <ParentalPinModal
        isOpen={isPinSetupModalOpen}
        onClose={() => setIsPinSetupModalOpen(false)}
        onSuccess={() => setIsPinSetupModalOpen(false)}
        mode="SETUP"
      />
    </>
  );
};
