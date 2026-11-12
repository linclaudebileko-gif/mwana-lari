import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AdminSubscriberItem,
  AdminTransactionItem,
  PaymentMethod,
  SubscriptionTier,
  SubscriptionStateStatus,
  ManualGrantPayload,
} from '../types';
import { adminSubscriptionsAPI } from '../services/api';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Award,
  Zap,
  Globe,
  Lock,
  Unlock,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  FileSpreadsheet,
  XCircle,
  ExternalLink,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

type AdminTab = 'subscribers' | 'transactions' | 'grant' | 'simulator';

export const AdminSubscriptionsDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('subscribers');
  const [subscribers, setSubscribers] = useState<AdminSubscriberItem[]>([]);
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters for Subscribers
  const [subSearch, setSubSearch] = useState<string>('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL');
  const [subTierFilter, setSubTierFilter] = useState<string>('ALL');
  const [subMethodFilter, setSubMethodFilter] = useState<string>('ALL');

  // Filters for Transactions
  const [txSearch, setTxSearch] = useState<string>('');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');
  const [txProviderFilter, setTxProviderFilter] = useState<string>('ALL');

  // Form State: Manual Grant
  const [grantEmailOrPhone, setGrantEmailOrPhone] = useState<string>('');
  const [grantFullName, setGrantFullName] = useState<string>('');
  const [grantTier, setGrantTier] = useState<SubscriptionTier>('FAMILY');
  const [grantDurationMonths, setGrantDurationMonths] = useState<number>(1);
  const [grantNotes, setGrantNotes] = useState<string>('');
  const [isGranting, setIsGranting] = useState<boolean>(false);

  // Form State: Transaction Simulator
  const [simProvider, setSimProvider] = useState<PaymentMethod>('MTN_MOMO');
  const [simPhone, setSimPhone] = useState<string>('+242 06 600 11 22');
  const [simAmount, setSimAmount] = useState<number>(1500);
  const [simCurrency, setSimCurrency] = useState<'XAF' | 'EUR'>('XAF');
  const [simStatus, setSimStatus] = useState<'SUCCESS' | 'PENDING' | 'FAILED'>('SUCCESS');
  const [simTier, setSimTier] = useState<'FAMILY' | 'CLAN_DIASPORA'>('FAMILY');
  const [simUserEmail, setSimUserEmail] = useState<string>('parent@mwanalari.cg');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [subsData, txData] = await Promise.all([
        adminSubscriptionsAPI.getSubscribers(),
        adminSubscriptionsAPI.getTransactions(),
      ]);
      setSubscribers(subsData);
      setTransactions(txData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    playSuccessChime();
  };

  // Financial Stats & KPIs Calculation
  const stats = useMemo(() => {
    let totalXaf = 0;
    let totalEur = 0;
    let momoCount = 0;
    let momoXaf = 0;
    let airtelCount = 0;
    let airtelXaf = 0;
    let cardCount = 0;
    let cardEur = 0;
    let successfulTx = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'SUCCESS') {
        successfulTx++;
        if (tx.currency === 'XAF') {
          totalXaf += tx.amount;
        } else if (tx.currency === 'EUR') {
          totalEur += tx.amount;
        }

        if (tx.provider === 'MTN_MOMO') {
          momoCount++;
          momoXaf += tx.amount;
        } else if (tx.provider === 'AIRTEL_MONEY') {
          airtelCount++;
          airtelXaf += tx.amount;
        } else if (tx.provider === 'VISA_MASTERCARD') {
          cardCount++;
          cardEur += tx.amount;
        }
      }
    });

    const activeSubs = subscribers.filter((s) => s.status === 'ACTIVE').length;
    const expiredSubs = subscribers.filter((s) => s.status === 'EXPIRED').length;
    const successRate = transactions.length > 0 ? Math.round((successfulTx / transactions.length) * 100) : 100;

    return {
      totalXaf,
      totalEur,
      activeSubs,
      expiredSubs,
      momoCount,
      momoXaf,
      airtelCount,
      airtelXaf,
      cardCount,
      cardEur,
      successRate,
    };
  }, [subscribers, transactions]);

  // Filtered Subscribers
  const filteredSubscribers = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    return subscribers.filter((sub) => {
      const matchQuery =
        !q ||
        sub.fullName.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.phoneNumber.toLowerCase().includes(q) ||
        (sub.transactionReference && sub.transactionReference.toLowerCase().includes(q));

      const matchStatus = subStatusFilter === 'ALL' || sub.status === subStatusFilter;
      const matchTier = subTierFilter === 'ALL' || sub.tier === subTierFilter;
      const matchMethod = subMethodFilter === 'ALL' || sub.paymentMethod === subMethodFilter;

      return matchQuery && matchStatus && matchTier && matchMethod;
    });
  }, [subscribers, subSearch, subStatusFilter, subTierFilter, subMethodFilter]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchQuery =
        !q ||
        tx.transactionRef.toLowerCase().includes(q) ||
        (tx.userName && tx.userName.toLowerCase().includes(q)) ||
        (tx.userEmail && tx.userEmail.toLowerCase().includes(q)) ||
        (tx.phoneNumber && tx.phoneNumber.toLowerCase().includes(q));

      const matchStatus = txStatusFilter === 'ALL' || tx.status === txStatusFilter;
      const matchProvider = txProviderFilter === 'ALL' || tx.provider === txProviderFilter;

      return matchQuery && matchStatus && matchProvider;
    });
  }, [transactions, txSearch, txStatusFilter, txProviderFilter]);

  // Action: Extend/Renew Subscription
  const handleExtendSub = async (subId: string, months: number) => {
    try {
      await adminSubscriptionsAPI.updateSubscriptionStatus(subId, 'ACTIVE', months);
      playSuccessChime();
      setSuccessMessage(`Abonnement prolongé de +${months} mois avec succès !`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la mise à jour.');
    }
  };

  // Action: Toggle Status (Suspend / Reactivate)
  const handleToggleSubStatus = async (subId: string, currentStatus: SubscriptionStateStatus) => {
    const newStatus: SubscriptionStateStatus = currentStatus === 'ACTIVE' ? 'CANCELED' : 'ACTIVE';
    try {
      await adminSubscriptionsAPI.updateSubscriptionStatus(subId, newStatus);
      playSuccessChime();
      setSuccessMessage(`Statut de l'abonnement modifié en ${newStatus} !`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la modification.');
    }
  };

  // Action: Submit Manual Grant
  const handleManualGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantEmailOrPhone) {
      setErrorMessage('Veuillez spécifier une adresse email ou un numéro de téléphone.');
      return;
    }

    setIsGranting(true);
    setErrorMessage(null);
    try {
      const payload: ManualGrantPayload = {
        emailOrPhone: grantEmailOrPhone.trim(),
        fullName: grantFullName.trim() || undefined,
        tier: grantTier,
        durationMonths: grantDurationMonths,
        notes: grantNotes.trim() || undefined,
      };

      await adminSubscriptionsAPI.grantSubscription(payload);
      playSuccessChime();
      setSuccessMessage(`Accès '${grantTier}' accordé avec succès pour ${grantDurationMonths} mois !`);
      setGrantEmailOrPhone('');
      setGrantFullName('');
      setGrantNotes('');
      setActiveAdminTab('subscribers');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'attribution de l'abonnement.");
    } finally {
      setIsGranting(false);
    }
  };

  // Action: Submit Simulated Transaction
  const handleSimulateTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      await adminSubscriptionsAPI.simulateTransaction({
        provider: simProvider,
        phoneNumber: simPhone.trim(),
        amount: simAmount,
        currency: simCurrency,
        status: simStatus,
        tier: simTier,
        userEmail: simUserEmail.trim() || undefined,
      });

      playSuccessChime();
      setSuccessMessage(`Transaction ${simProvider} de ${simAmount.toLocaleString()} ${simCurrency} enregistrée avec succès !`);
      setActiveAdminTab('transactions');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Action: Export Subscribers to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) return;

    const headers = ['ID', 'Nom', 'Email', 'Telephone', 'Forfait', 'Tier', 'Mode_Paiement', 'Statut', 'Date_Debut', 'Date_Fin', 'Reference'];
    const rows = subscribers.map((s) => [
      s.id,
      `"${s.fullName}"`,
      s.email,
      `"${s.phoneNumber}"`,
      `"${s.planName}"`,
      s.tier,
      s.paymentMethod,
      s.status,
      s.startDate ? s.startDate.split('T')[0] : '',
      s.endDate ? s.endDate.split('T')[0] : '',
      s.transactionReference || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abonnements_mwana_lari_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccessChime();
  };

  // Format Helper for Providers
  const getProviderBadge = (provider: PaymentMethod) => {
    switch (provider) {
      case 'MTN_MOMO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-yellow-100 text-yellow-900 border border-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            MTN MoMo (*105#)
          </span>
        );
      case 'AIRTEL_MONEY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-900 border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Airtel Money (*128#)
          </span>
        );
      case 'VISA_MASTERCARD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
            <CreditCard className="w-3 h-3 text-blue-600" />
            Carte Bancaire / Stripe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-300">
            Gratuit / Découverte
          </span>
        );
    }
  };

  // Format Helper for Status
  const getStatusBadge = (status: SubscriptionStateStatus | 'SUCCESS' | 'PENDING' | 'FAILED') => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-forest-100 text-forest-900 border border-forest-300">
            <CheckCircle2 className="w-3 h-3 text-forest-600" />
            Actif / Succès
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            En attente USSD
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
            <Clock className="w-3 h-3 text-orange-600" />
            Expiré
          </span>
        );
      case 'CANCELED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" />
            Annulé / Échec
          </span>
        );
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-card rounded-3xl border-2 border-red-300 text-center space-y-4 shadow-xl animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-savanna-950">Accès Administrateur Restreint</h2>
        <p className="text-xs sm:text-sm text-savanna-700 font-medium leading-relaxed">
          Cette rubrique et ses données financières sont strictement réservées aux comptes administrateurs authentifiés.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Header Banner */}
      <div className="glass-card p-5 sm:p-7 rounded-3xl border-2 border-brand-400 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-amber-500 to-terracotta-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl sm:text-2xl text-savanna-950">
                  🛡️ Centre Administrateur — Abonnements & Réseaux
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-900 font-extrabold text-[11px] border border-brand-300">
                  SaaS Hub
                </span>
              </div>
              <p className="text-xs sm:text-sm text-savanna-800 font-semibold mt-0.5">
                Pilotage multi-réseaux : <strong>MTN MoMo</strong> (*105#), <strong>Airtel Money</strong> (*128#) et <strong>Stripe Diaspora</strong> (EUR).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-savanna-50 border border-brand-300 text-savanna-900 font-extrabold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Rafraîchir les données de la base"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-700 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-forest-600 to-emerald-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
            title="Exporter la liste des abonnés au format CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Abonnés (CSV)</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-forest-50 border-2 border-forest-300 text-forest-950 text-xs font-bold flex items-center gap-2 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-forest-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 text-xs font-bold flex items-center gap-2 shadow-md animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Financial KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total FCFA Revenue Card */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border-2 border-amber-300 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
              Chiffre d'Affaires MoMo
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              FCFA
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-savanna-950">
              {stats.totalXaf.toLocaleString()} <span className="text-sm font-extrabold text-amber-700">F</span>
            </div>
            <div className="text-[11px] text-savanna-700 font-bold mt-1 flex items-center gap-1">
              <span>MTN : {stats.momoXaf.toLocaleString()} F</span>
              <span>•</span>
              <span>Airtel : {stats.airtelXaf.toLocaleString()} F</span>
            </div>
          </div>
        </div>

        {/* Total EUR Revenue Card */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border-2 border-blue-300 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
              Diaspora & International
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              EUR €
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-blue-950">
              {stats.totalEur.toFixed(2)} <span className="text-sm font-extrabold text-blue-700">€</span>
            </div>
            <div className="text-[11px] text-blue-800 font-bold mt-1">
              {stats.cardCount} souscription(s) via Stripe / CB
            </div>
          </div>
        </div>

        {/* Active Subscribers Card */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border-2 border-forest-300 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-forest-900 uppercase tracking-wider">
              Abonnés Actifs
            </span>
            <Users className="w-6 h-6 text-forest-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-forest-950">
              {stats.activeSubs} <span className="text-sm font-bold text-forest-700">familles</span>
            </div>
            <div className="text-[11px] text-forest-800 font-bold mt-1">
              +{stats.activeSubs > 0 ? '100%' : '0%'} de fidélisation
            </div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border-2 border-purple-300 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
              Taux d'Aboutissement
            </span>
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-950">
              {stats.successRate} %
            </div>
            <div className="text-[11px] text-purple-800 font-bold mt-1">
              Validation push USSD immédiate
            </div>
          </div>
        </div>

      </div>

      {/* 3. Sub-Navigation Tabs Bar */}
      <div className="glass-card rounded-2xl p-1.5 border border-brand-300 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none">
        
        <button
          onClick={() => setActiveAdminTab('subscribers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
            activeAdminTab === 'subscribers'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-savanna-800 hover:bg-savanna-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestion des Abonnés ({subscribers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
            activeAdminTab === 'transactions'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-savanna-800 hover:bg-savanna-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Flux Multi-Réseaux ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('grant')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
            activeAdminTab === 'grant'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-savanna-800 hover:bg-savanna-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Attribution Manuelle / Partenariat</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
            activeAdminTab === 'simulator'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-950 hover:bg-amber-50'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>Simulateur de Paiement Réseau</span>
        </button>

      </div>

      {/* 4. TAB 1 : GESTION DES ABONNÉS */}
      {activeAdminTab === 'subscribers' && (
        <div className="glass-card rounded-3xl p-5 sm:p-7 border-2 border-brand-300 shadow-xl space-y-5">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-savanna-950">
                📋 Répertoire des Abonnés & Souscriptions
              </h2>
              <p className="text-xs text-savanna-800 font-medium">
                Consultez, prolongez ou suspendez les accès aux forfaits Famille & Clan.
              </p>
            </div>
            <div className="text-xs font-bold text-brand-900 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200 self-start md:self-auto">
              {filteredSubscribers.length} abonné(s) affiché(s)
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
              <input
                type="text"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Rechercher nom, email, tél..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="ACTIVE">Actifs uniquement</option>
              <option value="EXPIRED">Expirés</option>
              <option value="CANCELED">Annulés</option>
            </select>

            <select
              value={subTierFilter}
              onChange={(e) => setSubTierFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les Forfaits</option>
              <option value="FAMILY">Famille Mwana Lari</option>
              <option value="CLAN_DIASPORA">Grand Clan & Diaspora</option>
            </select>

            <select
              value={subMethodFilter}
              onChange={(e) => setSubMethodFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les Modes de Paiement</option>
              <option value="MTN_MOMO">MTN MoMo</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="VISA_MASTERCARD">Carte Bancaire / Stripe</option>
            </select>
          </div>

          {/* Subscribers Table */}
          <div className="overflow-x-auto rounded-2xl border border-brand-200">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="border-b border-brand-200 bg-savanna-50 text-[11px] font-black text-savanna-800 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Titulaire du Compte</th>
                  <th className="py-3 px-3.5">Forfait Souscrit</th>
                  <th className="py-3 px-3.5">Mode / Réseau</th>
                  <th className="py-3 px-3.5">Validité & Expiration</th>
                  <th className="py-3 px-3.5">Statut</th>
                  <th className="py-3 px-3.5 text-right">Actions Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 text-xs">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-savanna-700 font-medium">
                      Aucun abonné ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-savanna-50/70 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-savanna-950">{sub.fullName}</div>
                        <div className="text-[11px] text-savanna-700">{sub.email}</div>
                        <div className="text-[11px] text-brand-700 font-semibold">{sub.phoneNumber}</div>
                      </td>

                      <td className="py-3 px-3.5 font-bold text-savanna-900">
                        <div>{sub.planName}</div>
                        {sub.transactionReference && (
                          <div className="text-[10px] text-savanna-600 font-mono">
                            Réf: {sub.transactionReference}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        {getProviderBadge(sub.paymentMethod)}
                      </td>

                      <td className="py-3 px-3.5 font-medium text-savanna-800">
                        <div>Du : {sub.startDate ? sub.startDate.split('T')[0] : 'N/A'}</div>
                        <div className="font-bold text-savanna-950">Au : {sub.endDate ? sub.endDate.split('T')[0] : 'N/A'}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        {getStatusBadge(sub.status)}
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleExtendSub(sub.id, 1)}
                            className="px-2.5 py-1 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-300 font-extrabold text-[11px] transition-all"
                            title="Prolonger de 1 mois"
                          >
                            +1 mois
                          </button>

                          <button
                            onClick={() => handleExtendSub(sub.id, 12)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-[11px] transition-all"
                            title="Prolonger de 1 an"
                          >
                            +1 an
                          </button>

                          <button
                            onClick={() => handleToggleSubStatus(sub.id, sub.status)}
                            className={`px-2.5 py-1 rounded-lg border font-extrabold text-[11px] transition-all ${
                              sub.status === 'ACTIVE'
                                ? 'bg-red-50 hover:bg-red-100 text-red-900 border-red-300'
                                : 'bg-forest-50 hover:bg-forest-100 text-forest-900 border-forest-300'
                            }`}
                            title={sub.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                          >
                            {sub.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 5. TAB 2 : JOURNAL DES TRANSACTIONS MULTI-RÉSEAUX */}
      {activeAdminTab === 'transactions' && (
        <div className="glass-card rounded-3xl p-5 sm:p-7 border-2 border-brand-300 shadow-xl space-y-5">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-savanna-950">
                💳 Journal des Flux Financiers & Transactions Opérateurs
              </h2>
              <p className="text-xs text-savanna-800 font-medium">
                Historique des notifications de paiement MoMo, Airtel et cartes bancaires.
              </p>
            </div>
            <div className="text-xs font-bold text-brand-900 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200 self-start md:self-auto">
              {filteredTransactions.length} transaction(s) enregistrée(s)
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-savanna-600" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Rechercher référence, téléphone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={txStatusFilter}
              onChange={(e) => setTxStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="SUCCESS">Succès (SUCCESS)</option>
              <option value="PENDING">En cours (PENDING)</option>
              <option value="FAILED">Échecs (FAILED)</option>
            </select>

            <select
              value={txProviderFilter}
              onChange={(e) => setTxProviderFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tous les Réseaux</option>
              <option value="MTN_MOMO">MTN MoMo (*105#)</option>
              <option value="AIRTEL_MONEY">Airtel Money (*128#)</option>
              <option value="VISA_MASTERCARD">Stripe (CB)</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-brand-200">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="border-b border-brand-200 bg-savanna-50 text-[11px] font-black text-savanna-800 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Référence Transaction</th>
                  <th className="py-3 px-3.5">Client & Numéro</th>
                  <th className="py-3 px-3.5">Opérateur / Canal</th>
                  <th className="py-3 px-3.5">Montant Encaissé</th>
                  <th className="py-3 px-3.5">Date & Heure</th>
                  <th className="py-3 px-3.5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 text-xs">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-savanna-700 font-medium">
                      Aucune transaction financière trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-savanna-50/70 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-extrabold text-savanna-950">{tx.transactionRef}</div>
                        {tx.providerTransactionId && (
                          <div className="text-[10px] text-savanna-600 font-mono">ID Op: {tx.providerTransactionId}</div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-savanna-950">{tx.userName || 'Client'}</div>
                        <div className="text-[11px] text-brand-700 font-semibold">{tx.phoneNumber || tx.userEmail || 'N/A'}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        {getProviderBadge(tx.provider)}
                      </td>

                      <td className="py-3 px-3.5 font-black text-savanna-950 text-sm">
                        {tx.amount.toLocaleString()} {tx.currency === 'XAF' ? 'FCFA' : '€'}
                      </td>

                      <td className="py-3 px-3.5 text-savanna-700 font-medium">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString('fr-FR') : 'Récent'}
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        {getStatusBadge(tx.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 6. TAB 3 : ATTRIBUTION MANUELLE / PARTENARIAT */}
      {activeAdminTab === 'grant' && (
        <div className="glass-card rounded-3xl p-5 sm:p-7 border-2 border-brand-300 shadow-xl max-w-2xl mx-auto space-y-5">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-brand-500 to-terracotta-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-brand-500/30">
              🎁
            </div>
            <h2 className="text-xl font-extrabold text-savanna-950">
              Attribution Manuelle de Forfait Premium
            </h2>
            <p className="text-xs text-savanna-800 font-medium">
              Offrez un accès complet à une école partenaire, un chercheur linguiste ou une famille.
            </p>
          </div>

          <form onSubmit={handleManualGrantSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Adresse Email ou Numéro de Téléphone (Requis)
              </label>
              <input
                type="text"
                value={grantEmailOrPhone}
                onChange={(e) => setGrantEmailOrPhone(e.target.value)}
                placeholder="ex: ecole.bacongo@mwanalari.cg ou +242 06 123 45 67"
                className="w-full px-4 py-2.5 rounded-2xl bg-savanna-50 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Nom du Bénéficiaire / Établissement
              </label>
              <input
                type="text"
                value={grantFullName}
                onChange={(e) => setGrantFullName(e.target.value)}
                placeholder="ex: École Primaire de Bacongo"
                className="w-full px-4 py-2.5 rounded-2xl bg-savanna-50 border-2 border-brand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Formule d'Abonnement
                </label>
                <select
                  value={grantTier}
                  onChange={(e) => setGrantTier(e.target.value as SubscriptionTier)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-savanna-50 border-2 border-brand-200 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="FAMILY">Famille Mwana Lari (Jusqu'à 3 enfants)</option>
                  <option value="CLAN_DIASPORA">Grand Clan & Diaspora (Jusqu'à 10 profils)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Durée de Validité
                </label>
                <select
                  value={grantDurationMonths}
                  onChange={(e) => setGrantDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-2xl bg-savanna-50 border-2 border-brand-200 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={1}>1 Mois</option>
                  <option value={3}>3 Mois (Trimestre)</option>
                  <option value={6}>6 Mois (Semestre)</option>
                  <option value={12}>12 Mois (1 An)</option>
                  <option value={24}>24 Mois (2 Ans)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                Motif / Note Interne (Optionnel)
              </label>
              <textarea
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                placeholder="ex: Convention de partenariat éducatif..."
                rows={2}
                className="w-full px-4 py-2 rounded-2xl bg-savanna-50 border-2 border-brand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isGranting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-forest-600 via-emerald-600 to-forest-600 hover:brightness-110 text-white font-extrabold text-sm shadow-lg shadow-forest-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              {isGranting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider & Activer l'Abonnement</span>
                </>
              )}
            </button>
          </form>

        </div>
      )}

      {/* 7. TAB 4 : SIMULATEUR DE PAIEMENTS OPÉRATEURS */}
      {activeAdminTab === 'simulator' && (
        <div className="glass-card rounded-3xl p-5 sm:p-7 border-2 border-amber-400 shadow-xl max-w-2xl mx-auto space-y-5">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white text-2xl shadow-lg shadow-amber-500/30">
              ⚡
            </div>
            <h2 className="text-xl font-extrabold text-savanna-950">
              Simulateur de Paiements Réseaux (Test & Démo)
            </h2>
            <p className="text-xs text-savanna-800 font-medium">
              Générez instantanément des transactions MTN MoMo, Airtel Money ou Carte bancaire pour tester les flux et alimenter la base de données.
            </p>
          </div>

          <form onSubmit={handleSimulateTxSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Opérateur / Canal Réseau
                </label>
                <select
                  value={simProvider}
                  onChange={(e) => {
                    const p = e.target.value as PaymentMethod;
                    setSimProvider(p);
                    if (p === 'MTN_MOMO') {
                      setSimPhone('+242 06 600 11 22');
                      setSimCurrency('XAF');
                      setSimAmount(1500);
                    } else if (p === 'AIRTEL_MONEY') {
                      setSimPhone('+242 05 512 88 99');
                      setSimCurrency('XAF');
                      setSimAmount(1500);
                    } else {
                      setSimPhone('+33 6 12 34 56 78');
                      setSimCurrency('EUR');
                      setSimAmount(2.49);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-bold text-savanna-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="MTN_MOMO">MTN Congo (MoMo - *105#)</option>
                  <option value="AIRTEL_MONEY">Airtel Congo (Airtel Money - *128#)</option>
                  <option value="VISA_MASTERCARD">Stripe (Carte Bancaire / Diaspora)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Numéro de Téléphone Débité
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Montant
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Devise
                </label>
                <select
                  value={simCurrency}
                  onChange={(e) => setSimCurrency(e.target.value as 'XAF' | 'EUR')}
                  className="w-full px-3 py-2 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-bold text-savanna-900"
                >
                  <option value="XAF">FCFA (XAF)</option>
                  <option value="EUR">Euros (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Statut de la Transaction
                </label>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value as 'SUCCESS' | 'PENDING' | 'FAILED')}
                  className="w-full px-3 py-2 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-bold text-savanna-900"
                >
                  <option value="SUCCESS">Succès (Paiement Validé)</option>
                  <option value="PENDING">En Attente USSD</option>
                  <option value="FAILED">Échec (Solde Insuffisant)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Formule Cible
                </label>
                <select
                  value={simTier}
                  onChange={(e) => setSimTier(e.target.value as 'FAMILY' | 'CLAN_DIASPORA')}
                  className="w-full px-3 py-2 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-bold text-savanna-900"
                >
                  <option value="FAMILY">Famille Mwana Lari (1 500 F)</option>
                  <option value="CLAN_DIASPORA">Grand Clan & Diaspora (2 500 F / 4,99 €)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-savanna-900 mb-1">
                  Email du Titulaire
                </label>
                <input
                  type="email"
                  value={simUserEmail}
                  onChange={(e) => setSimUserEmail(e.target.value)}
                  placeholder="parent@mwanalari.cg"
                  className="w-full px-3.5 py-2 rounded-2xl bg-savanna-50 border-2 border-amber-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-savanna-950 font-black text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              {isSimulating ? (
                <div className="w-5 h-5 border-2 border-savanna-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-savanna-950" />
                  <span>Exécuter la Transaction Simulée</span>
                </>
              )}
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
