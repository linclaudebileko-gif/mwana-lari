import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Zap,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Crown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PRICING_PLANS, paymentsAPI } from '../services/api';
import { PaymentMethod, SubscriptionTier } from '../types';
import { playSuccessChime } from '../utils/audio';

const playCardFlip = () => {
  // subtle audio feedback
};


interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanTier?: SubscriptionTier;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialPlanTier = 'FAMILY',
}) => {
  const { subscription, upgradeSubscription, user } = useAuth();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    initialPlanTier === 'FREE' ? 'FAMILY' : initialPlanTier
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [phoneNumber, setPhoneNumber] = useState<string>('06 ');
  const [countryPrefix, setCountryPrefix] = useState<string>('+242');

  // Checkout step: 'SELECTION' -> 'PROCESSING' -> 'SUCCESS'
  const [step, setStep] = useState<'SELECTION' | 'PROCESSING' | 'SUCCESS'>('SELECTION');
  const [countdown, setCountdown] = useState<number>(6);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep('SELECTION');
      setErrorMessage('');
      if (initialPlanTier && initialPlanTier !== 'FREE') {
        setSelectedTier(initialPlanTier);
      }
    }
  }, [isOpen, initialPlanTier]);

  // Auto-detect operator based on phone prefix in Congo (+242)
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const cleaned = val.replace(/\s+/g, '');
    if (cleaned.startsWith('06')) {
      setPaymentMethod('MTN_MOMO');
    } else if (cleaned.startsWith('04') || cleaned.startsWith('05')) {
      setPaymentMethod('AIRTEL_MONEY');
    }
  };

  const selectedPlan = DEFAULT_PRICING_PLANS.find((p) => p.tier === selectedTier) || DEFAULT_PRICING_PLANS[1];

  const currentPriceFcfa =
    billingCycle === 'yearly' ? selectedPlan.priceFcfaYearly : selectedPlan.priceFcfaMonthly;

  const currentPriceEur =
    billingCycle === 'yearly' ? selectedPlan.priceEurYearly : selectedPlan.priceEurMonthly;

  const handleStartPayment = async () => {
    setErrorMessage('');

    if (paymentMethod !== 'VISA_MASTERCARD') {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 8) {
        setErrorMessage('Veuillez saisir un numéro de téléphone valide (ex: 06 123 45 67).');
        return;
      }
    }

    playCardFlip();
    setStep('PROCESSING');
    setCountdown(6);

    try {
      const resp = await paymentsAPI.initiateMomoPayment({
        planId: selectedPlan.id,
        tier: selectedTier as 'FAMILY' | 'CLAN_DIASPORA',
        billingCycle,
        method: paymentMethod,
        phoneNumber: `${countryPrefix} ${phoneNumber}`,
        amountFcfa: currentPriceFcfa,
      });

      setTransactionRef(resp.reference_code || `MOMO-${Date.now().toString().slice(-6)}`);

      // Simulate USSD prompt countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Complete subscription
            upgradeSubscription(selectedTier, {
              planName: selectedPlan.name,
              billingCycle,
              paymentMethod,
              phoneNumber: `${countryPrefix} ${phoneNumber}`,
            });
            playSuccessChime();
            setStep('SUCCESS');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'initiation du paiement.');
      setStep('SELECTION');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-savanna-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-brand-300 overflow-hidden max-h-[92vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-brand-600 via-amber-500 to-terracotta-600 p-4 sm:p-6 text-white text-center flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-amber-100 text-xs font-black uppercase tracking-wider mb-2">
            <Crown className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            <span>Abonnement Mwana Lari</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            Offrez l'apprentissage illimité du Lari à votre famille
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-lg mx-auto font-medium">
            Paiement 100% sécurisé et instantané via <strong>MTN MoMo</strong>, <strong>Airtel Money</strong> ou Carte Bancaire.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'SELECTION' && (
            <>
              {/* Billing Cycle Switcher */}
              <div className="flex justify-center">
                <div className="bg-savanna-100 p-1 rounded-2xl flex items-center border border-savanna-200 shadow-inner">
                  <button
                    onClick={() => { playCardFlip(); setBillingCycle('monthly'); }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-savanna-950 shadow-md ring-2 ring-brand-400'
                        : 'text-savanna-700 hover:text-savanna-900'
                    }`}
                  >
                    Facturation Mensuelle
                  </button>
                  <button
                    onClick={() => { playCardFlip(); setBillingCycle('yearly'); }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all relative ${
                      billingCycle === 'yearly'
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-savanna-700 hover:text-savanna-900'
                    }`}
                  >
                    Facturation Annuelle
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-savanna-950 text-[10px] font-black uppercase tracking-tight">
                      -17% Offerts
                    </span>
                  </button>
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {DEFAULT_PRICING_PLANS.filter((p) => p.tier !== 'FREE').map((plan) => {
                  const isSelected = selectedTier === plan.tier;
                  const priceFcfa = billingCycle === 'yearly' ? plan.priceFcfaYearly : plan.priceFcfaMonthly;
                  const priceEur = billingCycle === 'yearly' ? plan.priceEurYearly : plan.priceEurMonthly;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => { playCardFlip(); setSelectedTier(plan.tier); }}
                      className={`relative rounded-3xl p-4 sm:p-5 border-3 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 shadow-xl ring-2 ring-brand-300 -translate-y-0.5'
                          : 'border-savanna-200 bg-white hover:border-brand-300 hover:shadow-md'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-brand-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          ✨ Recommandé
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-black text-savanna-950">
                            {plan.name}
                          </h3>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-savanna-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <p className="text-xs text-savanna-800 font-medium mt-0.5">
                          {plan.tagline}
                        </p>

                        {/* Price Block */}
                        <div className="mt-3.5 p-3 rounded-2xl bg-white border border-brand-200">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-brand-600">
                              {priceFcfa.toLocaleString()} FCFA
                            </span>
                            <span className="text-xs text-savanna-800 font-bold">
                              / {billingCycle === 'yearly' ? 'an' : 'mois'}
                            </span>
                          </div>
                          <p className="text-[11px] text-savanna-700 font-medium mt-0.5">
                            Soit env. {priceEur} € ({billingCycle === 'yearly' ? 'l\'année complète' : 'par mois'})
                          </p>
                        </div>

                        {/* Features List */}
                        <ul className="mt-3.5 space-y-2 text-xs text-savanna-900 font-medium">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Methods Selection */}
              <div className="bg-savanna-50 p-4 sm:p-5 rounded-3xl border-2 border-savanna-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-savanna-950 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand-600" />
                    <span>Mode de Paiement :</span>
                  </h4>
                  <span className="text-[11px] font-bold text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full">
                    🔒 Prélèvement Sécurisé
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* MTN Mobile Money */}
                  <button
                    type="button"
                    onClick={() => { playCardFlip(); setPaymentMethod('MTN_MOMO'); }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                      paymentMethod === 'MTN_MOMO'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-300 shadow-md'
                        : 'border-savanna-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-savanna-950 font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                      MTN
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">MTN MoMo</div>
                      <div className="text-[10px] text-savanna-700 font-semibold">*105# Congo</div>
                    </div>
                  </button>

                  {/* Airtel Money */}
                  <button
                    type="button"
                    onClick={() => { playCardFlip(); setPaymentMethod('AIRTEL_MONEY'); }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                      paymentMethod === 'AIRTEL_MONEY'
                        ? 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-300 shadow-md'
                        : 'border-savanna-200 bg-white hover:border-red-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                      airtel
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Airtel Money</div>
                      <div className="text-[10px] text-savanna-700 font-semibold">*128# Congo</div>
                    </div>
                  </button>

                  {/* Carte Bancaire */}
                  <button
                    type="button"
                    onClick={() => { playCardFlip(); setPaymentMethod('VISA_MASTERCARD'); }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                      paymentMethod === 'VISA_MASTERCARD'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-300 shadow-md'
                        : 'border-savanna-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Carte / Diaspora</div>
                      <div className="text-[10px] text-savanna-700 font-semibold">Visa, Master, Stripe</div>
                    </div>
                  </button>
                </div>

                {/* Mobile Money Phone Input Form */}
                {paymentMethod !== 'VISA_MASTERCARD' ? (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-savanna-900">
                      Numéro de téléphone {paymentMethod === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} :
                    </label>
                    <div className="flex gap-2">
                      <div className="px-3 py-2.5 rounded-xl bg-white border-2 border-savanna-300 text-xs font-black text-savanna-900 flex items-center">
                        🇨🇬 {countryPrefix}
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="06 123 45 67"
                        className="flex-1 px-4 py-2.5 rounded-xl border-2 border-savanna-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-extrabold text-savanna-950"
                      />
                    </div>
                    <p className="text-[11px] text-savanna-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                      <span>Vous recevrez une notification instantanée sur votre téléphone pour confirmer avec votre code PIN secret.</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Paiement international par Carte Bancaire</span>
                    </div>
                    <p className="text-[11px] text-blue-900">
                      Idéal pour les parents de la diaspora congolaise (Europe, Amérique, Afrique). Montant converti automatiquement : <strong>{currentPriceEur} €</strong>.
                    </p>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartPayment}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-amber-500 to-brand-600 hover:brightness-110 text-white font-black text-sm sm:text-base shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                >
                  <Zap className="w-5 h-5 text-amber-200 fill-amber-200 animate-bounce" />
                  <span>
                    Valider l'abonnement ({currentPriceFcfa.toLocaleString()} FCFA / {billingCycle === 'yearly' ? 'an' : 'mois'})
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-[11px] text-savanna-700 font-medium mt-2">
                  Sans engagement • Annulable à tout moment • Facture numérique avec TVA incluse
                </p>
              </div>
            </>
          )}

          {/* Step 2: Push Notification Pending Countdown */}
          {step === 'PROCESSING' && (
            <div className="text-center py-8 px-4 space-y-6 animate-fadeIn">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white text-3xl shadow-xl mx-auto animate-pulse">
                  📱
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-forest-500 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                  {countdown}s
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-savanna-950">
                  Vérification du Mobile Money en cours...
                </h3>
                <p className="text-xs sm:text-sm text-savanna-800 font-medium max-w-md mx-auto">
                  Une invitation USSD a été envoyée sur votre téléphone <strong>{countryPrefix} {phoneNumber}</strong>.
                </p>
              </div>

              {/* Instructions Box */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 max-w-md mx-auto text-left space-y-3 shadow-md">
                <div className="font-extrabold text-xs text-amber-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>Instruction sur votre écran de téléphone :</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-amber-900 font-medium">
                  <li>Ouvrez la notification ou composez <strong>{paymentMethod === 'MTN_MOMO' ? '*105#' : '*128#'}</strong></li>
                  <li>Entrez votre <strong>Code PIN Secret MoMo</strong></li>
                  <li>Confirmez le débit de <strong>{currentPriceFcfa.toLocaleString()} FCFA</strong> (Réf: {transactionRef})</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-brand-700">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>En attente de la confirmation réseau (Auto-validation)...</span>
              </div>
            </div>
          )}

          {/* Step 3: Success Confirmation */}
          {step === 'SUCCESS' && (
            <div className="text-center py-6 px-4 space-y-6 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-forest-500 text-white flex items-center justify-center text-4xl shadow-xl mx-auto animate-bounce">
                🎉
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-300 text-xs font-black uppercase tracking-wider">
                  👑 Statut Premium Actif
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-savanna-950">
                  Matondo ! Bienvenue dans Mwana Lari Premium !
                </h3>
                <p className="text-xs sm:text-sm text-savanna-800 font-medium max-w-md mx-auto">
                  Votre abonnement au <strong>{selectedPlan.name}</strong> a été validé avec succès. Tous les contenus (529 mots, contes, jeux, studio micro) sont déverrouillés !
                </p>
              </div>

              {/* Digital Receipt Card */}
              <div className="bg-savanna-50 border-2 border-brand-200 rounded-3xl p-4 sm:p-5 max-w-md mx-auto text-left space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-savanna-200 pb-2">
                  <span className="text-xs font-bold text-savanna-700">Reçu Numérique :</span>
                  <span className="text-xs font-black text-brand-700">{transactionRef}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-savanna-800 font-medium">Forfait :</span>
                  <span className="font-extrabold text-savanna-950">{selectedPlan.name} ({billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'})</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-savanna-800 font-medium">Montant payé :</span>
                  <span className="font-black text-forest-700">{currentPriceFcfa.toLocaleString()} FCFA</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-savanna-800 font-medium">Opérateur :</span>
                  <span className="font-bold text-savanna-950">
                    {paymentMethod === 'MTN_MOMO' ? 'MTN MoMo Congo' : paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money Congo' : 'Carte Bancaire'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-lg shadow-brand-500/30 transition-all"
                >
                  🚀 Commencer à explorer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
