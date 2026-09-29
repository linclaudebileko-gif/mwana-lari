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
  HeartHandshake,
  ExternalLink,
  Lock,
  Globe
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

  // Champs spécifiques pour paiement par Carte Bancaire
  const [cardCustomerName, setCardCustomerName] = useState<string>('');
  const [cardCustomerEmail, setCardCustomerEmail] = useState<string>('');
  const [cardPhoneContact, setCardPhoneContact] = useState<string>('');
  const [cardPaymentUrl, setCardPaymentUrl] = useState<string>('');

  // Checkout step: 'SELECTION' -> 'PROCESSING' -> 'SUCCESS'
  const [step, setStep] = useState<'SELECTION' | 'PROCESSING' | 'SUCCESS'>('SELECTION');
  const [countdown, setCountdown] = useState<number>(6);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (user) {
      if (!cardCustomerName && user.fullName) setCardCustomerName(user.fullName);
      if (!cardCustomerEmail && user.email) setCardCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setStep('SELECTION');
      setErrorMessage('');
      setCardPaymentUrl('');
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

  const [currentTxId, setCurrentTxId] = useState<string>('');
  const [operatorSmsRef, setOperatorSmsRef] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string>('');

  const handleStartPayment = async () => {
    setErrorMessage('');
    setVerifyStatusMessage('');

    if (!user) {
      setErrorMessage("Veuillez vous connecter ou créer un compte parent avant de souscrire, afin de lier votre abonnement et le retrouver sur tous vos appareils.");
      return;
    }

    const isCard = paymentMethod === 'VISA_MASTERCARD';

    if (isCard) {
      const emailToUse = (cardCustomerEmail || user.email || '').trim();
      if (!emailToUse || !emailToUse.includes('@')) {
        setErrorMessage('Veuillez saisir une adresse email valide pour recevoir la confirmation et le reçu bancaire.');
        return;
      }
    } else {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 8) {
        setErrorMessage('Veuillez saisir un numéro de téléphone valide (ex: 06 123 45 67).');
        return;
      }
    }

    playCardFlip();
    setStep('PROCESSING');
    setCountdown(isCard ? 5 : 10);

    try {
      const isYearly = billingCycle === 'yearly';
      let exactPlanId = selectedPlan.id;
      if (exactPlanId === 'plan_family' || selectedTier === 'FAMILY') {
        exactPlanId = isYearly ? 'plan_family_annual' : 'plan_family_monthly';
      } else if (exactPlanId === 'plan_clan' || selectedTier === 'CLAN_DIASPORA') {
        exactPlanId = isYearly ? 'plan_clan_annual' : 'plan_clan_monthly';
      }

      const resp = await paymentsAPI.initiateOpenPay({
        planId: exactPlanId,
        tier: selectedTier as 'FAMILY' | 'CLAN_DIASPORA',
        billingCycle,
        method: paymentMethod,
        phoneNumber: isCard ? (cardPhoneContact.trim() || '') : `${countryPrefix} ${phoneNumber}`,
        amountFcfa: currentPriceFcfa,
        userId: user?.id,
        customerName: (isCard ? (cardCustomerName.trim() || user?.fullName) : user?.fullName) || 'Parent',
        customerEmail: (isCard ? (cardCustomerEmail.trim() || user?.email) : user?.email) || 'contact@mwanalari.cg',
      });

      if (resp && ((resp as any).success === false || (resp as any).status === 'FAILED')) {
        const errorMsg = (resp as any).message || (resp as any).error || 'La transaction a été rejetée.';
        setErrorMessage(`Échec (${isCard ? 'Paiement Carte' : (paymentMethod === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money')}) : ${errorMsg}`);
        setStep('SELECTION');
        return;
      }

      const txId = (resp as any)?.transaction_id || `tx_op_${Date.now()}`;
      const refCode = (resp as any)?.reference_code || (resp as any)?.reference || `OP-${Date.now().toString().slice(-6)}`;
      setCurrentTxId(txId);
      setTransactionRef(refCode);

      const returnedUrl = (resp as any)?.payment_url || (resp as any)?.checkout_url || (resp as any)?.url;
      if (returnedUrl) {
        setCardPaymentUrl(returnedUrl);
        // Pour les cartes, redirection fluide vers le guichet sécurisé
        if (isCard) {
          setTimeout(() => {
            try {
              window.open(returnedUrl, '_blank');
            } catch {}
          }, 800);
        }
      }

      // Compte à rebours indicatif
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
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

  const handleVerifyPayment = async () => {
    const checkTarget = transactionRef || currentTxId;
    if (!checkTarget) {
      setVerifyStatusMessage('Aucune référence de transaction à vérifier.');
      return;
    }

    setIsVerifying(true);
    setVerifyStatusMessage('');

    try {
      // 1. Vérification réelle auprès de l'API OpenPay Congo / MoMo
      const res = await paymentsAPI.checkOpenPayStatus(checkTarget);
      
      if (res && (res.status === 'SUCCESS' || res.is_successful === true)) {
        // Sauvegarde de la transaction confirmée dans le cache local admin
        try {
          const storedTx = localStorage.getItem('mwana_lari_admin_transactions_cache');
          const txList = storedTx ? JSON.parse(storedTx) : [];
          txList.unshift({
            id: currentTxId || checkTarget,
            reference: operatorSmsRef.trim() || transactionRef || checkTarget,
            userFullName: (paymentMethod === 'VISA_MASTERCARD' ? cardCustomerName : user?.fullName) || 'Abonné Mwana Lari',
            userEmail: (paymentMethod === 'VISA_MASTERCARD' ? cardCustomerEmail : user?.email) || 'parent@mwanalari.cg',
            phoneNumber: paymentMethod === 'VISA_MASTERCARD' ? (cardPhoneContact || 'Carte Bancaire') : `${countryPrefix} ${phoneNumber}`,
            amountFcfa: currentPriceFcfa,
            planTier: selectedTier,
            provider: paymentMethod,
            status: 'SUCCESS',
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('mwana_lari_admin_transactions_cache', JSON.stringify(txList.slice(0, 50)));
        } catch {}

        await upgradeSubscription(selectedTier, {
          planName: selectedPlan.name,
          billingCycle,
          paymentMethod,
          phoneNumber: paymentMethod === 'VISA_MASTERCARD' ? (cardPhoneContact || 'Carte Bancaire') : `${countryPrefix} ${phoneNumber}`,
        });
        playSuccessChime();
        setStep('SUCCESS');
        setIsVerifying(false);
        return;
      }

      if (res && (res.status === 'FAILED' || res.is_failed === true || res.status === 'CANCELLED')) {
        setIsVerifying(false);
        setVerifyStatusMessage("Le paiement a été refusé ou a expiré. Veuillez vérifier votre solde ou plafond et recommencer.");
        return;
      }

      // Si le statut est encore PENDING
      setIsVerifying(false);
      const ussdCode = paymentMethod === 'MTN_MOMO' ? '*105#' : '*128#';
      setVerifyStatusMessage(
        paymentMethod === 'VISA_MASTERCARD'
          ? "Paiement en attente : veuillez finaliser l'autorisation 3D-Secure auprès de votre banque sur la page sécurisée, puis cliquez à nouveau ci-dessous."
          : `Paiement en attente : vous n'avez pas encore validé le débit sur votre téléphone. Veuillez composer ${ussdCode} pour saisir votre code secret, puis cliquez à nouveau sur le bouton ci-dessous.`
      );
    } catch (err: any) {
      setIsVerifying(false);
      const ussdCode = paymentMethod === 'MTN_MOMO' ? '*105#' : '*128#';
      setVerifyStatusMessage(
        paymentMethod === 'VISA_MASTERCARD'
          ? "Paiement par carte en cours de validation : veuillez patienter quelques instants puis réessayer."
          : `Paiement en cours de traitement : composez ${ussdCode} sur votre téléphone pour valider avec votre code secret, puis réessayez.`
      );
    }
  };

  const handleDemoConfirmAndVerify = async () => {
    if (!currentTxId) return;
    paymentsAPI.confirmDemoPayment(currentTxId);
    await handleVerifyPayment();
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

                {/* Formulaire de paiement Mobile Money ou Carte Bancaire */}
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
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-200 text-xs text-blue-950 space-y-1.5 shadow-sm">
                      <div className="font-extrabold flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-950">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>Paiement par Carte Bancaire (Visa, Mastercard, GIMAC)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-950 font-black text-[10px] tracking-wide">
                          3D-Secure 2.0
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-900 font-medium leading-relaxed">
                        Idéal pour les cartes bancaires locales (BSCA, LCB, Ecobank, BGFIBank...) et la diaspora internationale.
                        Montant : <strong>{currentPriceFcfa.toLocaleString()} FCFA</strong> (soit env. <strong>{currentPriceEur} €</strong>).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-savanna-900 mb-1">
                          Nom & Prénom sur la carte :
                        </label>
                        <input
                          type="text"
                          value={cardCustomerName}
                          onChange={(e) => setCardCustomerName(e.target.value)}
                          placeholder={user?.fullName || "Ex: Patrick Moukoko"}
                          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-savanna-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-xs font-bold text-savanna-950 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-savanna-900 mb-1">
                          Email pour le reçu bancaire :
                        </label>
                        <input
                          type="email"
                          value={cardCustomerEmail}
                          onChange={(e) => setCardCustomerEmail(e.target.value)}
                          placeholder={user?.email || "parent@famille.cg"}
                          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-savanna-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-xs font-bold text-savanna-950 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-savanna-800 mb-1">
                        Numéro de téléphone WhatsApp (Optionnel pour notification) :
                      </label>
                      <input
                        type="tel"
                        value={cardPhoneContact}
                        onChange={(e) => setCardPhoneContact(e.target.value)}
                        placeholder="+242 06 ... ou +33 6 ... (International accepté)"
                        className="w-full px-3.5 py-2 rounded-xl border-2 border-savanna-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-xs font-medium text-savanna-950 bg-white"
                      />
                    </div>

                    <p className="text-[11px] text-savanna-700 font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                      <span>Redirection automatique vers la passerelle sécurisée OpenPay. Aucune donnée de carte n'est stockée sur nos serveurs.</span>
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
                    {paymentMethod === 'VISA_MASTERCARD'
                      ? `Payer par Carte Bancaire (${currentPriceFcfa.toLocaleString()} FCFA • env. ${currentPriceEur} €)`
                      : `Payer via OpenPay (${currentPriceFcfa.toLocaleString()} FCFA / ${billingCycle === 'yearly' ? 'an' : 'mois'})`
                    }
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-[11px] text-savanna-700 font-medium mt-2 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                  <span>
                    {paymentMethod === 'VISA_MASTERCARD'
                      ? 'Guichet bancaire sécurisé OpenPay • Chiffrement SSL 256 bits • 3D-Secure 2.0'
                      : 'Guichet sécurisé OpenPay Congo • MTN MoMo • Airtel Money • Validation instantanée'
                    }
                  </span>
                </p>
                <p className="text-center text-[11px] text-savanna-700 font-medium mt-1">
                  Sans engagement • Annulable à tout moment • Facture numérique avec TVA incluse
                </p>
              </div>
            </>
          )}

          {/* Step 2: Push Notification Pending Countdown / Card Processing */}
          {step === 'PROCESSING' && (
            paymentMethod === 'VISA_MASTERCARD' ? (
              <div className="text-center py-6 px-4 space-y-5 animate-fadeIn">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-brand-500 flex items-center justify-center text-white text-3xl shadow-xl mx-auto animate-pulse">
                    💳
                  </div>
                  {countdown > 0 && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                      {countdown}s
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>Guichet Carte Sécurisé OpenPay</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-savanna-950">
                    Validation du Paiement par Carte
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 font-medium max-w-md mx-auto">
                    Titulaire : <strong>{cardCustomerName || user?.fullName || 'Parent'}</strong> • Montant : <strong>{currentPriceFcfa.toLocaleString()} FCFA</strong> (~{currentPriceEur} €)
                  </p>
                </div>

                {/* Card Instructions / Redirect box */}
                <div className="bg-blue-50/80 border-2 border-blue-200 rounded-3xl p-4 sm:p-5 max-w-md mx-auto text-left space-y-3 shadow-md">
                  <div className="font-extrabold text-xs text-blue-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>Processus sécurisé (Visa / Mastercard) :</span>
                    </span>
                    <span className="text-[10px] font-black text-blue-800 bg-blue-200 px-2.5 py-0.5 rounded-full">
                      Réf: {transactionRef}
                    </span>
                  </div>

                  <ol className="list-decimal pl-5 space-y-2 text-xs text-blue-900 font-medium">
                    <li>
                      Cliquez sur le bouton bleu ci-dessous pour <strong>ouvrir la page de saisie sécurisée</strong> si elle ne s'est pas ouverte automatiquement.
                    </li>
                    <li>
                      Entrez les 16 chiffres de votre carte, date d'expiration et cryptogramme visuel (CVV).
                    </li>
                    <li>
                      Validez l'authentification <strong>3D-Secure</strong> envoyée par votre banque (SMS ou notification bancaire).
                    </li>
                    <li>
                      Revenez ici et cliquez sur <strong>"Activer mon forfait"</strong>.
                    </li>
                  </ol>

                  {cardPaymentUrl && (
                    <div className="pt-2">
                      <a
                        href={cardPaymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ouvrir la page de paiement par carte sécurisée</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Optional Bank Transaction Ref input */}
                <div className="max-w-md mx-auto text-left space-y-1.5">
                  <label className="block text-xs font-bold text-savanna-800">
                    Référence de transaction ou reçu bancaire (Optionnel) :
                  </label>
                  <input
                    type="text"
                    value={operatorSmsRef}
                    onChange={(e) => setOperatorSmsRef(e.target.value)}
                    placeholder="Ex: OP-123456 ou code bancaire"
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-savanna-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-xs font-bold text-savanna-950 bg-white"
                  />
                </div>

                {/* Verification Feedback Message */}
                {verifyStatusMessage && (
                  <div className="bg-terracotta-50 border-2 border-terracotta-300 rounded-2xl p-3.5 max-w-md mx-auto text-xs text-terracotta-950 font-bold flex items-start gap-2 text-left animate-shake">
                    <AlertCircle className="w-4 h-4 text-terracotta-600 flex-shrink-0 mt-0.5" />
                    <span>{verifyStatusMessage}</span>
                  </div>
                )}

                {/* Action Buttons: Verification */}
                <div className="space-y-3 max-w-md mx-auto pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={isVerifying}
                    className="w-full py-4 px-6 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-black text-sm sm:text-base shadow-xl shadow-forest-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Vérification de votre paiement par carte...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                        <span>J'ai validé ma carte — Activer mon forfait</span>
                      </>
                    )}
                  </button>

                  {/* Bouton de test démo en local */}
                  {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'))) && (
                    <button
                      type="button"
                      onClick={handleDemoConfirmAndVerify}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs border border-amber-300 transition-all"
                    >
                      ⚡ Simuler la validation carte bancaire (Mode Test)
                    </button>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setStep('SELECTION'); setVerifyStatusMessage(''); }}
                      className="text-xs font-bold text-savanna-700 hover:text-savanna-950 underline"
                    >
                      ← Changer de moyen de paiement
                    </button>

                    <a
                      href={`https://wa.me/242066001122?text=${encodeURIComponent(`Bonjour Mwana Lari, j'ai initié un paiement par carte pour mon forfait ${selectedPlan.name} (${currentPriceFcfa} FCFA). Réf: ${transactionRef}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-forest-700 hover:text-forest-800 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-xl border border-forest-200 flex items-center gap-1.5"
                    >
                      <span>💬 Support WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 space-y-5 animate-fadeIn">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white text-3xl shadow-xl mx-auto animate-pulse">
                    📱
                  </div>
                  {countdown > 0 && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-forest-500 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                      {countdown}s
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-savanna-950">
                    Validation du paiement {paymentMethod === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'}
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 font-medium max-w-md mx-auto">
                    Demande enregistrée pour le numéro <strong>{countryPrefix} {phoneNumber}</strong> • Montant : <strong>{currentPriceFcfa.toLocaleString()} FCFA</strong>
                  </p>
                </div>

                {/* Instructions Box */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 max-w-md mx-auto text-left space-y-3 shadow-md">
                  <div className="font-extrabold text-xs text-amber-950 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-700" />
                    <span>Comment valider sur votre téléphone :</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-2 text-xs text-amber-900 font-medium">
                    <li>
                      Si le message de confirmation automatique ne s'affiche pas sur votre écran, <strong>composez directement sur votre téléphone</strong> :
                      <div className="mt-1.5 p-2 rounded-xl bg-white border border-amber-300 font-black text-xs text-amber-950 flex items-center justify-between">
                        <span>Code USSD :</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-200 text-amber-950 text-sm font-black tracking-wide">
                          {paymentMethod === 'MTN_MOMO' ? '*105#' : '*128#'}
                        </span>
                      </div>
                    </li>
                    <li>
                      Entrez votre <strong>Code PIN Secret</strong> et approuvez le débit de <strong>{currentPriceFcfa.toLocaleString()} FCFA</strong>.
                    </li>
                    <li>
                      Une fois confirmé, cliquez sur le bouton vert ci-dessous pour <strong>activer immédiatement</strong> vos accès !
                    </li>
                  </ol>
                </div>

                {/* Optional SMS Transaction ID input */}
                <div className="max-w-md mx-auto text-left space-y-1.5">
                  <label className="block text-xs font-bold text-savanna-800">
                    ID de transaction ou référence SMS (Optionnel) :
                  </label>
                  <input
                    type="text"
                    value={operatorSmsRef}
                    onChange={(e) => setOperatorSmsRef(e.target.value)}
                    placeholder="Ex: PP260917... ou Référence SMS opérateur"
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-savanna-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-xs font-bold text-savanna-950 bg-white"
                  />
                </div>

                {/* Verification Feedback Message */}
                {verifyStatusMessage && (
                  <div className="bg-terracotta-50 border-2 border-terracotta-300 rounded-2xl p-3.5 max-w-md mx-auto text-xs text-terracotta-950 font-bold flex items-start gap-2 text-left animate-shake">
                    <AlertCircle className="w-4 h-4 text-terracotta-600 flex-shrink-0 mt-0.5" />
                    <span>{verifyStatusMessage}</span>
                  </div>
                )}

                {/* Action Buttons: Explicit Verification */}
                <div className="space-y-3 max-w-md mx-auto pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={isVerifying}
                    className="w-full py-4 px-6 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-black text-sm sm:text-base shadow-xl shadow-forest-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Activation de votre abonnement en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                        <span>J'ai validé mon code secret — Activer mon forfait</span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setStep('SELECTION'); setVerifyStatusMessage(''); }}
                      className="text-xs font-bold text-savanna-700 hover:text-savanna-950 underline"
                    >
                      ← Changer de numéro / forfait
                    </button>

                    <a
                      href={`https://wa.me/242066001122?text=${encodeURIComponent(`Bonjour Mwana Lari, j'ai initié le paiement de mon abonnement ${selectedPlan.name} (${currentPriceFcfa} FCFA) au numéro ${countryPrefix} ${phoneNumber}. Réf: ${transactionRef}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-forest-700 hover:text-forest-800 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-xl border border-forest-200 flex items-center gap-1.5"
                    >
                      <span>💬 Aide WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            )
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
