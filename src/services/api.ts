import { WordItem, CulturalStory, LessonUnit, ChildProfile, UserRole, AdminSubscriberItem, AdminTransactionItem, ManualGrantPayload, SubscriptionStateStatus, NetworkRevenueStats } from '../types';

const API_BASE_URL = (typeof window !== 'undefined' && (window as any).__MWANA_API_URL__) || 'http://localhost:8000/api/v1';

// Storage keys
const TOKEN_KEY = 'mwana_lari_token';
const USER_KEY = 'mwana_lari_user';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  token: string;
  phoneNumber?: string;
  countryCode?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  countryCode?: string;
}

export interface CreateChildPayload {
  firstName: string;
  ageGroup: '3-5' | '6-8' | '9-11' | '12-15';
  avatarId?: string;
}

export interface CreateWordPayload {
  wordNative: string;
  phonetic: string;
  translationFr: string;
  translationEn: string;
  category: string;
  difficultyLevel: number;
  culturalNote: string;
  exampleSentenceNative?: string;
  exampleSentenceFr?: string;
  audioUrl?: string;
  speakerName?: string;
}

export interface ContributeStoryPayload {
  type: 'STORY' | 'PROVERB' | 'SONG';
  titleNative: string;
  titleFr: string;
  contentNative: string;
  contentFr: string;
  elderSpeakerName: string;
  durationSeconds?: number;
  moralLesson?: string;
  audioUrl?: string;
}

// Token helper functions
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredSession = (session: UserSession): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session));
};

export const getStoredSession = (): UserSession | null => {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(USER_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  if (!userJson || !token) return null;
  try {
    const user = JSON.parse(userJson);
    return { ...user, token };
  } catch {
    return null;
  }
};

export const clearStoredSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Generic Fetch Wrapper with Authorization & Error Handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // use fallback message
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    console.warn(`[API Client] Échec requête ${endpoint}:`, error.message);
    throw error;
  }
}

// ==========================================
// 1. AUTHENTICATION & USERS API
// ==========================================
export const authAPI = {
  login: async (email: string, password: string): Promise<UserSession> => {
    const res = await apiRequest<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      role: UserRole;
      full_name: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const session: UserSession = {
      id: res.user_id,
      email: res.email,
      role: res.role,
      fullName: res.full_name,
      token: res.access_token,
    };

    setStoredSession(session);
    return session;
  },

  register: async (payload: RegisterPayload, initialChildName?: string): Promise<UserSession> => {
    const res = await apiRequest<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      role: UserRole;
      full_name: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        full_name: payload.fullName,
        role: payload.role,
        phone_number: payload.phoneNumber || '',
        country_code: payload.countryCode || 'CG',
      }),
    });

    const session: UserSession = {
      id: res.user_id,
      email: res.email,
      role: res.role,
      fullName: res.full_name,
      token: res.access_token,
    };

    setStoredSession(session);
    return session;
  },

  demoLogin: async (role: 'parent' | 'teacher' | 'linguist' | 'admin'): Promise<UserSession> => {
    try {
      const res = await apiRequest<{
        access_token: string;
        token_type: string;
        user_id: string;
        email: string;
        role: UserRole;
        full_name: string;
      }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });

      const session: UserSession = {
        id: res.user_id,
        email: res.email,
        role: res.role,
        fullName: res.full_name,
        token: res.access_token,
      };

      setStoredSession(session);
      return session;
    } catch {
      // Fallback offline session for standalone demo without hardcoded passwords
      const demoRoleMap: Record<string, { role: UserRole; email: string; fullName: string }> = {
        parent: { role: 'PARENT', email: 'parent@mwanalari.cg', fullName: 'Mavoungou Jean (Parent)' },
        teacher: { role: 'TEACHER', email: 'enseignant@mwanalari.cg', fullName: 'Maitre Clarisse (Enseignant)' },
        linguist: { role: 'LINGUIST', email: 'linguiste@mwanalari.cg', fullName: 'Mamma Pauline (Linguiste)' },
        admin: { role: 'ADMIN', email: 'admin@mwanalari.cg', fullName: 'Prof. Massamba (Admin)' },
      };
      const info = demoRoleMap[role] || demoRoleMap.parent;
      const fallbackSession: UserSession = {
        id: `demo_${role}_offline`,
        email: info.email,
        role: info.role,
        fullName: info.fullName,
        token: `demo_token_${Date.now()}`,
      };
      setStoredSession(fallbackSession);
      return fallbackSession;
    }
  },

  getMe: async (): Promise<any> => {
    return await apiRequest('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    clearStoredSession();
  },

  checkServerHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ==========================================
// 2. PARENTS & CHILDREN API
// ==========================================
export const parentsAPI = {
  getChildren: async (): Promise<ChildProfile[]> => {
    const data = await apiRequest<any[]>('/parents/children');
    return data.map((c) => ({
      id: c.id,
      firstName: c.first_name,
      ageGroup: c.age_group,
      level: c.level || 1,
      xpPoints: c.xp_points || 0,
      streakDays: c.current_streak || 1,
      avatar: c.avatar_id || 'koko_happy',
    }));
  },

  createChild: async (payload: CreateChildPayload): Promise<ChildProfile> => {
    const c = await apiRequest<any>('/parents/children', {
      method: 'POST',
      body: JSON.stringify({
        first_name: payload.firstName,
        age_group: payload.ageGroup,
        avatar_id: payload.avatarId || 'koko_happy',
      }),
    });

    return {
      id: c.id,
      firstName: c.first_name,
      ageGroup: c.age_group,
      level: c.level || 1,
      xpPoints: c.xp_points || 0,
      streakDays: c.current_streak || 1,
      avatar: c.avatar_id || 'koko_happy',
    };
  },

  getChildProgressStats: async (childId: string): Promise<any> => {
    return await apiRequest(`/parents/children/${childId}/progress`);
  },

  updateChild: async (childId: string, patch: Partial<ChildProfile>): Promise<ChildProfile> => {
    const body: Record<string, any> = {};
    if (patch.firstName) body.first_name = patch.firstName;
    if (patch.ageGroup) body.age_group = patch.ageGroup;
    if (patch.avatar) body.avatar_id = patch.avatar;
    if (patch.xpPoints !== undefined) body.xp_points = patch.xpPoints;
    if (patch.level !== undefined) body.level = patch.level;
    if (patch.streakDays !== undefined) body.current_streak = patch.streakDays;

    const c = await apiRequest<any>(`/parents/children/${childId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    return {
      id: c.id,
      firstName: c.first_name,
      ageGroup: c.age_group,
      level: c.level,
      xpPoints: c.xp_points,
      streakDays: c.current_streak,
      avatar: c.avatar_id,
    };
  },
};

// ==========================================
// 3. LESSONS & PROGRESS API
// ==========================================
export const lessonsAPI = {
  getLessons: async (childId?: string): Promise<LessonUnit[]> => {
    const query = childId ? `?child_id=${encodeURIComponent(childId)}` : '';
    const data = await apiRequest<any[]>(`/lessons${query}`);
    return data.map((item) => ({
      id: item.id,
      level: item.level,
      titleFr: item.title_fr,
      titleNative: item.title_native,
      description: item.description,
      icon: item.icon,
      wordCount: item.word_count,
      isUnlocked: item.is_unlocked,
      isCompleted: item.is_completed,
      progressPercent: item.progress_percent,
    }));
  },

  submitProgress: async (payload: {
    childId: string;
    lessonId: string;
    score: number;
    xpEarned: number;
  }): Promise<any> => {
    return await apiRequest('/progress/submit', {
      method: 'POST',
      body: JSON.stringify({
        child_id: payload.childId,
        lesson_id: payload.lessonId,
        score: payload.score,
        xp_earned: payload.xpEarned,
      }),
    });
  },
};

// ==========================================
// 4. DICTIONARY & WORDS API
// ==========================================
export const wordsAPI = {
  searchWords: async (params: {
    q?: string;
    category?: string;
    language?: string;
    validatedOnly?: boolean;
  } = {}): Promise<WordItem[]> => {
    const queryParts: string[] = [];
    if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
    if (params.category && params.category !== 'Toutes') {
      queryParts.push(`category=${encodeURIComponent(params.category)}`);
    }
    if (params.language) queryParts.push(`language=${encodeURIComponent(params.language)}`);
    if (params.validatedOnly !== undefined) {
      queryParts.push(`validated_only=${params.validatedOnly}`);
    }

    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const data = await apiRequest<any[]>(`/words/search${qs}`);

    return data.map((w) => ({
      id: w.id,
      wordNative: w.word_native,
      phonetic: w.phonetic,
      translationFr: w.translation_fr,
      translationEn: w.translation_en || '',
      category: w.category,
      difficultyLevel: w.difficulty_level || 1,
      culturalNote: w.cultural_note || '',
      exampleSentenceNative: w.example_sentence_native,
      exampleSentenceFr: w.example_sentence_fr,
      audioUrl: w.audio_url,
      validatedByElder: w.is_validated,
      speakerName: w.speaker_name,
    }));
  },

  getWord: async (wordId: string): Promise<WordItem> => {
    const w = await apiRequest<any>(`/words/${wordId}`);
    return {
      id: w.id,
      wordNative: w.word_native,
      phonetic: w.phonetic,
      translationFr: w.translation_fr,
      translationEn: w.translation_en || '',
      category: w.category,
      difficultyLevel: w.difficulty_level || 1,
      culturalNote: w.cultural_note || '',
      exampleSentenceNative: w.example_sentence_native,
      exampleSentenceFr: w.example_sentence_fr,
      audioUrl: w.audio_url,
      validatedByElder: w.is_validated,
      speakerName: w.speaker_name,
    };
  },

  createWord: async (payload: CreateWordPayload): Promise<WordItem> => {
    const w = await apiRequest<any>('/words/', {
      method: 'POST',
      body: JSON.stringify({
        language_id: 'LAR',
        word_native: payload.wordNative,
        phonetic: payload.phonetic,
        translation_fr: payload.translationFr,
        translation_en: payload.translationEn,
        category: payload.category,
        difficulty_level: payload.difficultyLevel,
        cultural_note: payload.culturalNote,
        example_sentence_native: payload.exampleSentenceNative || '',
        example_sentence_fr: payload.exampleSentenceFr || '',
        audio_url: payload.audioUrl || '',
        speaker_name: payload.speakerName || '',
      }),
    });

    return {
      id: w.id,
      wordNative: w.word_native,
      phonetic: w.phonetic,
      translationFr: w.translation_fr,
      translationEn: w.translation_en || '',
      category: w.category,
      difficultyLevel: w.difficulty_level || 1,
      culturalNote: w.cultural_note || '',
      exampleSentenceNative: w.example_sentence_native,
      exampleSentenceFr: w.example_sentence_fr,
      audioUrl: w.audio_url,
      validatedByElder: w.is_validated,
      speakerName: w.speaker_name,
    };
  },
};

// ==========================================
// 5. HERITAGE & ORAL MEMORY API
// ==========================================
export const heritageAPI = {
  getStories: async (type?: string, language: string = 'LAR'): Promise<CulturalStory[]> => {
    const queryParts: string[] = [`language=${encodeURIComponent(language)}`];
    if (type) queryParts.push(`type=${encodeURIComponent(type)}`);
    const qs = `?${queryParts.join('&')}`;

    const data = await apiRequest<any[]>(`/heritage/stories${qs}`);
    return data.map((s) => ({
      id: s.id,
      titleNative: s.title_native,
      titleFr: s.title_fr,
      type: s.type,
      contentNative: s.content_native,
      contentFr: s.content_fr,
      elderSpeakerName: s.elder_speaker_name,
      durationSeconds: s.duration_seconds || 60,
      moralLesson: s.moral_lesson || '',
      category: s.category || 'Contes Traditionnels',
    }));
  },

  contributeStory: async (payload: ContributeStoryPayload): Promise<any> => {
    return await apiRequest('/heritage/contribute', {
      method: 'POST',
      body: JSON.stringify({
        type: payload.type,
        title_native: payload.titleNative,
        title_fr: payload.titleFr,
        content_native: payload.contentNative,
        content_fr: payload.contentFr,
        elder_speaker_name: payload.elderSpeakerName,
        moral_lesson: payload.moralLesson || '',
        audio_url: payload.audioUrl || '',
      }),
    });
  },
};

// ==========================================
// 6. VALIDATIONS & LINGUISTIC PIPELINE API
// ==========================================
export const validationsAPI = {
  getPendingValidations: async (): Promise<any[]> => {
    return await apiRequest('/admin/validations/pending');
  },

  decideValidation: async (validationId: string, decision: 'APPROVED' | 'REJECTED', comments: string = ''): Promise<any> => {
    return await apiRequest(`/admin/validations/${validationId}/decide`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        comments,
      }),
    });
  },
};

// ==========================================
// 7. MONÉTISATION & PAIEMENTS MOBILE MONEY
// ==========================================
export const DEFAULT_PRICING_PLANS = [
  {
    id: 'plan_free',
    tier: 'FREE' as const,
    name: 'Découverte (Gratuit)',
    tagline: 'Pour s\'initier aux premiers mots',
    priceFcfaMonthly: 0,
    priceFcfaYearly: 0,
    priceEurMonthly: 0,
    priceEurYearly: 0,
    maxChildren: 1,
    features: [
      'Accès au Niveau 1 (Découverte)',
      '100 mots du Dictionnaire avec audio',
      '1 profil enfant',
      'Jeu des devinettes de Koko'
    ]
  },
  {
    id: 'plan_family',
    tier: 'FAMILY' as const,
    name: 'Famille Mwana Lari',
    tagline: 'L\'accès complet pour les familles au Congo',
    priceFcfaMonthly: 1500,
    priceFcfaYearly: 15000,
    priceEurMonthly: 2.49,
    priceEurYearly: 24.99,
    maxChildren: 3,
    isPopular: true,
    features: [
      'Accès illimité aux 5 Niveaux Pédagogiques',
      'Grand Dictionnaire complet (+2600 mots Lari authentiques)',
      'Tous les Contes & Récits audio des Aînés (WAV HD)',
      'Jusqu\'à 3 profils enfants personnalisés',
      'Tous les 4 Mini-Jeux de Koko illimités',
      'Mode 100% Hors-Ligne (PWA sans connexion)'
    ]
  },
  {
    id: 'plan_clan',
    tier: 'CLAN_DIASPORA' as const,
    name: 'Grand Clan & Diaspora',
    tagline: 'Pour les grandes familles et la diaspora',
    priceFcfaMonthly: 2500,
    priceFcfaYearly: 25000,
    priceEurMonthly: 4.99,
    priceEurYearly: 49.99,
    maxChildren: 10,
    features: [
      'Tout le forfait Famille inclus',
      'Profils enfants illimités (jusqu\'à 10)',
      'Studio d\'Enregistrement Vocal familial illimité',
      'Tableau de bord de suivi personnalisé',
      'Certificat officiel de réussite de l\'Académie Lari',
      'Support prioritaire par WhatsApp'
    ]
  }
];

const SUBSCRIPTION_STORAGE_KEY = 'mwana_lari_subscription';

export const paymentsAPI = {
  getPlans: async () => {
    try {
      const data = await apiRequest<any[]>('/payments/plans');
      if (data && data.length > 0) return data;
    } catch {
      // offline / mock fallback
    }
    return DEFAULT_PRICING_PLANS;
  },

  initiateMomoPayment: async (payload: {
    planId: string;
    tier: 'FAMILY' | 'CLAN_DIASPORA';
    billingCycle: 'monthly' | 'yearly';
    method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'VISA_MASTERCARD';
    phoneNumber: string;
    amountFcfa: number;
  }) => {
    try {
      return await apiRequest('/payments/momo/initiate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Fallback local simulation with instant response
      const refCode = `MOMO-${Date.now().toString().slice(-6)}`;
      const ussdGuide = payload.method === 'MTN_MOMO' ? '*105#' : '*128#';
      return {
        transaction_id: `tx_${Date.now()}`,
        status: 'PENDING',
        reference_code: refCode,
        amount_fcfa: payload.amountFcfa,
        operator: payload.method === 'MTN_MOMO' ? 'MTN Congo (MoMo)' : 'Airtel Congo (Airtel Money)',
        ussd_instruction: `Validez le prélèvement de ${payload.amountFcfa.toLocaleString()} FCFA en composant votre code secret sur ${ussdGuide}`,
      };
    }
  },

  verifyPayment: async (transactionId: string) => {
    try {
      const res = await apiRequest<{ status: string; is_successful?: boolean }>(`/payments/verify/${transactionId}`);
      return res;
    } catch (err) {
      // En mode hors-ligne / démo, vérifie si la confirmation manuelle de test a été activée
      const isConfirmed = localStorage.getItem(`tx_verified_${transactionId}`);
      if (isConfirmed === 'true') {
        return {
          status: 'SUCCESS',
          is_successful: true,
          transaction_id: transactionId,
          message: 'Paiement Mobile Money validé avec succès !',
        };
      }
      return {
        status: 'PENDING',
        is_successful: false,
        transaction_id: transactionId,
        message: 'Transaction toujours en attente de validation USSD sur votre téléphone.',
      };
    }
  },

  confirmDemoPayment: (transactionId: string) => {
    localStorage.setItem(`tx_verified_${transactionId}`, 'true');
  },

  // Intégration officielle OpenPay Congo (MTN MoMo & Airtel Money)
  initiateOpenPay: async (payload: {
    planId: string;
    tier: 'FAMILY' | 'CLAN_DIASPORA';
    billingCycle: 'monthly' | 'yearly';
    method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'VISA_MASTERCARD';
    phoneNumber: string;
    amountFcfa: number;
    customerName?: string;
    customerEmail?: string;
  }) => {
    try {
      const res = await apiRequest<any>('/payments/openpay/initiate', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: payload.planId,
          tier: payload.tier,
          billing_cycle: payload.billingCycle,
          method: payload.method,
          phone_number: payload.phoneNumber,
          amount_fcfa: payload.amountFcfa,
          customer_name: payload.customerName,
          customer_email: payload.customerEmail,
        }),
      });
      return res;
    } catch (err: any) {
      // Fallback simulation locale si le serveur backend n'est pas actif
      const txId = `tx_op_${Date.now()}`;
      const refCode = `OP-${Date.now().toString().slice(-6)}`;
      const ussdGuide = payload.method === 'MTN_MOMO' ? '*105#' : '*128#';
      return {
        status: 'PENDING',
        transaction_id: txId,
        reference_code: refCode,
        amount_fcfa: payload.amountFcfa,
        operator: payload.method === 'MTN_MOMO' ? 'MTN MoMo Congo' : 'Airtel Money Congo',
        provider: payload.method === 'MTN_MOMO' ? 'MTN' : 'AIRTEL',
        phone_number: payload.phoneNumber,
        ussd_instruction: `Composez votre code secret sur votre téléphone (${ussdGuide}) pour valider le paiement de ${payload.amountFcfa.toLocaleString()} FCFA.`,
      };
    }
  },

  checkOpenPayStatus: async (referenceId: string) => {
    try {
      return await apiRequest<any>(`/payments/openpay/check/${referenceId}`);
    } catch {
      const isConfirmed = localStorage.getItem(`tx_verified_${referenceId}`);
      if (isConfirmed === 'true') {
        return {
          reference: referenceId,
          status: 'SUCCESS',
          is_successful: true,
        };
      }
      return {
        reference: referenceId,
        status: 'PENDING',
        is_successful: false,
      };
    }
  },

  // Intégration CinetPay (Guichet unifié MTN MoMo, Airtel Money, Visa / Mastercard)
  initiateCinetPay: async (payload: {
    planId: string;
    tier: 'FAMILY' | 'CLAN_DIASPORA';
    billingCycle: 'monthly' | 'yearly';
    method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'VISA_MASTERCARD' | 'ALL';
    phoneNumber: string;
    amountFcfa: number;
    customerName?: string;
    customerEmail?: string;
  }) => {
    try {
      const res = await apiRequest<any>('/payments/cinetpay/initiate', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: payload.planId,
          tier: payload.tier,
          billing_cycle: payload.billingCycle,
          method: payload.method,
          amount_fcfa: payload.amountFcfa,
          customer_phone_number: payload.phoneNumber,
          customer_name: payload.customerName || 'Famille',
          customer_email: payload.customerEmail || 'contact@mwanalari.cg',
        }),
      });
      return res;
    } catch (err) {
      // Fallback local simulation pour test hors-ligne
      const txId = `cp_tx_${Date.now()}`;
      const refCode = `CP-${Date.now().toString().slice(-6)}`;
      return {
        status: 'SUCCESS',
        transaction_id: txId,
        reference_code: refCode,
        amount_fcfa: payload.amountFcfa,
        cinetpay_response: {
          code: '201',
          message: 'CREATED_SIMULATED',
          data: {
            payment_token: `token_sim_${txId}`,
            payment_url: `/#payment-sim?tx=${txId}`,
            is_simulated: true,
          }
        }
      };
    }
  },

  checkCinetPayStatus: async (transactionId: string) => {
    try {
      return await apiRequest<any>(`/payments/cinetpay/check/${transactionId}`);
    } catch {
      const isConfirmed = localStorage.getItem(`tx_verified_${transactionId}`);
      if (isConfirmed === 'true') {
        return {
          transaction_id: transactionId,
          status: 'SUCCESS',
          is_successful: true,
        };
      }
      return {
        transaction_id: transactionId,
        status: 'PENDING',
        is_successful: false,
      };
    }
  },

  getLocalSubscription: (): {
    isPremium: boolean;
    tier: 'FREE' | 'FAMILY' | 'CLAN_DIASPORA';
    planName: string;
    billingCycle: 'monthly' | 'yearly';
    expiresAt: string;
    phoneNumber?: string;
  } => {
    try {
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      isPremium: false,
      tier: 'FREE',
      planName: 'Découverte (Gratuit)',
      billingCycle: 'monthly',
      expiresAt: '',
    };
  },

  saveLocalSubscription: (sub: {
    isPremium: boolean;
    tier: 'FREE' | 'FAMILY' | 'CLAN_DIASPORA';
    planName: string;
    billingCycle: 'monthly' | 'yearly';
    expiresAt: string;
    phoneNumber?: string;
  }) => {
    try {
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(sub));
    } catch {}
  },
};

// ==========================================
// 8. ADMINISTRATION DES ABONNEMENTS & FLUX
// ==========================================

const ADMIN_SUBS_LOCAL_KEY = 'mwana_lari_admin_subscribers_cache';
const ADMIN_TX_LOCAL_KEY = 'mwana_lari_admin_transactions_cache';

const DEFAULT_DEMO_SUBSCRIBERS: AdminSubscriberItem[] = [
  {
    id: 'sub_demo_001',
    userId: '0f84b5e1-d82a-41e3-a7c3-b5e95708f11b',
    fullName: 'Mavoungou Jean',
    email: 'parent@mwanalari.cg',
    phoneNumber: '+242 06 600 11 22',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    tier: 'FAMILY',
    status: 'ACTIVE',
    paymentMethod: 'MTN_MOMO',
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    transactionReference: 'MOMO-854921',
    autoRenew: true,
  },
  {
    id: 'sub_demo_002',
    userId: 'usr_diaspora_002',
    fullName: 'Clarisse Loubaki (Diaspora Paris)',
    email: 'clarisse.loubaki@gmail.com',
    phoneNumber: '+33 6 12 34 56 78',
    role: 'PARENT',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    tier: 'CLAN_DIASPORA',
    status: 'ACTIVE',
    paymentMethod: 'VISA_MASTERCARD',
    startDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 353 * 86400000).toISOString(),
    transactionReference: 'STRIPE-994120',
    autoRenew: true,
  },
  {
    id: 'sub_demo_003',
    userId: '2845b4b1-ce27-48ad-b730-63d7c3aadacb',
    fullName: 'Maitre Clarisse (École Bacongo)',
    email: 'enseignant@mwanalari.cg',
    phoneNumber: '+242 05 512 88 99',
    role: 'TEACHER',
    planId: 'plan_clan',
    planName: 'Partenariat Éducation (B2B)',
    tier: 'CLAN_DIASPORA',
    status: 'ACTIVE',
    paymentMethod: 'AIRTEL_MONEY',
    startDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 160 * 86400000).toISOString(),
    transactionReference: 'AIRTEL-331094',
    autoRenew: true,
  },
  {
    id: 'sub_demo_004',
    userId: 'usr_demo_004',
    fullName: 'Bikoumou Guy-Roger',
    email: 'guy.bikoumou@yahoo.fr',
    phoneNumber: '+242 06 654 32 10',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    tier: 'FAMILY',
    status: 'ACTIVE',
    paymentMethod: 'MTN_MOMO',
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
    transactionReference: 'MOMO-771204',
    autoRenew: true,
  },
  {
    id: 'sub_demo_005',
    userId: 'usr_demo_005',
    fullName: 'Nkouka Marie-Chantal',
    email: 'marie.nkouka@gmail.com',
    phoneNumber: '+242 05 444 88 11',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    tier: 'FAMILY',
    status: 'ACTIVE',
    paymentMethod: 'AIRTEL_MONEY',
    startDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 22 * 86400000).toISOString(),
    transactionReference: 'AIRTEL-455219',
    autoRenew: true,
  },
  {
    id: 'sub_demo_006',
    userId: 'usr_demo_006',
    fullName: 'Makosso Antoine (Diaspora Londres)',
    email: 'antoine.makosso@hotmail.com',
    phoneNumber: '+44 7700 900077',
    role: 'PARENT',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    tier: 'CLAN_DIASPORA',
    status: 'ACTIVE',
    paymentMethod: 'VISA_MASTERCARD',
    startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    transactionReference: 'STRIPE-883011',
    autoRenew: true,
  },
  {
    id: 'sub_demo_007',
    userId: 'usr_demo_007',
    fullName: 'Massamba Patrick (Makelekele)',
    email: 'patrick.massamba@gmail.com',
    phoneNumber: '+242 06 912 34 56',
    role: 'PARENT',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    tier: 'CLAN_DIASPORA',
    status: 'ACTIVE',
    paymentMethod: 'MTN_MOMO',
    startDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 29 * 86400000).toISOString(),
    transactionReference: 'MOMO-991402',
    autoRenew: true,
  },
  {
    id: 'sub_demo_008',
    userId: 'usr_demo_008',
    fullName: 'Loudi Sylvain',
    email: 'sylvain.loudi@outlook.fr',
    phoneNumber: '+242 05 333 22 11',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    tier: 'FAMILY',
    status: 'EXPIRED',
    paymentMethod: 'AIRTEL_MONEY',
    startDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    transactionReference: 'AIRTEL-110982',
    autoRenew: false,
  },
  {
    id: 'sub_demo_009',
    userId: 'usr_demo_009',
    fullName: 'Moukassa Germaine (Poto-Poto)',
    email: 'germaine.moukassa@yahoo.com',
    phoneNumber: '+242 06 888 77 66',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari (Annuel)',
    tier: 'FAMILY',
    status: 'ACTIVE',
    paymentMethod: 'MTN_MOMO',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 335 * 86400000).toISOString(),
    transactionReference: 'MOMO-300192',
    autoRenew: true,
  },
  {
    id: 'sub_demo_010',
    userId: 'usr_demo_010',
    fullName: 'Ntsika Paul (Mfilou)',
    email: 'paul.ntsika@gmail.com',
    phoneNumber: '+242 05 111 00 99',
    role: 'PARENT',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    tier: 'CLAN_DIASPORA',
    status: 'ACTIVE',
    paymentMethod: 'AIRTEL_MONEY',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 27 * 86400000).toISOString(),
    transactionReference: 'AIRTEL-662019',
    autoRenew: true,
  },
  {
    id: 'sub_demo_011',
    userId: 'usr_demo_011',
    fullName: 'Koumba Beatrice (Diaspora Bruxelles)',
    email: 'beatrice.koumba@skynet.be',
    phoneNumber: '+32 470 12 34 56',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari (Annuel)',
    tier: 'FAMILY',
    status: 'ACTIVE',
    paymentMethod: 'VISA_MASTERCARD',
    startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 305 * 86400000).toISOString(),
    transactionReference: 'STRIPE-442109',
    autoRenew: true,
  },
  {
    id: 'sub_demo_012',
    userId: 'usr_demo_012',
    fullName: 'Bouanga Roch (Kinkala)',
    email: 'roch.bouanga@gmail.com',
    phoneNumber: '+242 06 777 55 44',
    role: 'PARENT',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    tier: 'FAMILY',
    status: 'ACTIVE',
    paymentMethod: 'MTN_MOMO',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 16 * 86400000).toISOString(),
    transactionReference: 'MOMO-551023',
    autoRenew: true,
  }
];

const DEFAULT_DEMO_TRANSACTIONS: AdminTransactionItem[] = [
  {
    id: 'tx_demo_001',
    userId: '0f84b5e1-d82a-41e3-a7c3-b5e95708f11b',
    userName: 'Mavoungou Jean',
    userEmail: 'parent@mwanalari.cg',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    amount: 1500,
    currency: 'XAF',
    provider: 'MTN_MOMO',
    phoneNumber: '+242 06 600 11 22',
    status: 'SUCCESS',
    transactionRef: 'MOMO-854921',
    providerTransactionId: 'OP-MTN-854921',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_002',
    userId: 'usr_diaspora_002',
    userName: 'Clarisse Loubaki',
    userEmail: 'clarisse.loubaki@gmail.com',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora (Annuel)',
    amount: 49.99,
    currency: 'EUR',
    provider: 'VISA_MASTERCARD',
    phoneNumber: '+33 6 12 34 56 78',
    status: 'SUCCESS',
    transactionRef: 'STRIPE-994120',
    providerTransactionId: 'ch_3N8e192xX90',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_003',
    userId: '2845b4b1-ce27-48ad-b730-63d7c3aadacb',
    userName: 'Maitre Clarisse',
    userEmail: 'enseignant@mwanalari.cg',
    planId: 'plan_clan',
    planName: 'Partenariat Éducation (B2B)',
    amount: 25000,
    currency: 'XAF',
    provider: 'AIRTEL_MONEY',
    phoneNumber: '+242 05 512 88 99',
    status: 'SUCCESS',
    transactionRef: 'AIRTEL-331094',
    providerTransactionId: 'OP-AIR-331094',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_004',
    userId: 'usr_demo_004',
    userName: 'Bikoumou Guy-Roger',
    userEmail: 'guy.bikoumou@yahoo.fr',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    amount: 1500,
    currency: 'XAF',
    provider: 'MTN_MOMO',
    phoneNumber: '+242 06 654 32 10',
    status: 'SUCCESS',
    transactionRef: 'MOMO-771204',
    providerTransactionId: 'OP-MTN-771204',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_005',
    userId: 'usr_demo_005',
    userName: 'Nkouka Marie-Chantal',
    userEmail: 'marie.nkouka@gmail.com',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    amount: 1500,
    currency: 'XAF',
    provider: 'AIRTEL_MONEY',
    phoneNumber: '+242 05 444 88 11',
    status: 'SUCCESS',
    transactionRef: 'AIRTEL-455219',
    providerTransactionId: 'OP-AIR-455219',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_006',
    userId: 'usr_demo_006',
    userName: 'Makosso Antoine',
    userEmail: 'antoine.makosso@hotmail.com',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    amount: 4.99,
    currency: 'EUR',
    provider: 'VISA_MASTERCARD',
    phoneNumber: '+44 7700 900077',
    status: 'SUCCESS',
    transactionRef: 'STRIPE-883011',
    providerTransactionId: 'ch_4M9f203yY99',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_007',
    userId: 'usr_demo_007',
    userName: 'Massamba Patrick',
    userEmail: 'patrick.massamba@gmail.com',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    amount: 2500,
    currency: 'XAF',
    provider: 'MTN_MOMO',
    phoneNumber: '+242 06 912 34 56',
    status: 'PENDING',
    transactionRef: 'MOMO-991402',
    providerTransactionId: 'OP-MTN-991402',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_008',
    userId: 'usr_demo_008',
    userName: 'Loudi Sylvain',
    userEmail: 'sylvain.loudi@outlook.fr',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    amount: 1500,
    currency: 'XAF',
    provider: 'AIRTEL_MONEY',
    phoneNumber: '+242 05 333 22 11',
    status: 'FAILED',
    transactionRef: 'AIRTEL-110982',
    providerTransactionId: 'OP-AIR-ERR402',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_009',
    userId: 'usr_demo_009',
    userName: 'Moukassa Germaine',
    userEmail: 'germaine.moukassa@yahoo.com',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari (Annuel)',
    amount: 15000,
    currency: 'XAF',
    provider: 'MTN_MOMO',
    phoneNumber: '+242 06 888 77 66',
    status: 'SUCCESS',
    transactionRef: 'MOMO-300192',
    providerTransactionId: 'OP-MTN-300192',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_010',
    userId: 'usr_demo_010',
    userName: 'Ntsika Paul',
    userEmail: 'paul.ntsika@gmail.com',
    planId: 'plan_clan',
    planName: 'Grand Clan & Diaspora',
    amount: 2500,
    currency: 'XAF',
    provider: 'AIRTEL_MONEY',
    phoneNumber: '+242 05 111 00 99',
    status: 'SUCCESS',
    transactionRef: 'AIRTEL-662019',
    providerTransactionId: 'OP-AIR-662019',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_011',
    userId: 'usr_demo_011',
    userName: 'Koumba Beatrice',
    userEmail: 'beatrice.koumba@skynet.be',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari (Annuel)',
    amount: 24.99,
    currency: 'EUR',
    provider: 'VISA_MASTERCARD',
    phoneNumber: '+32 470 12 34 56',
    status: 'SUCCESS',
    transactionRef: 'STRIPE-442109',
    providerTransactionId: 'ch_5K1a304zZ11',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'tx_demo_012',
    userId: 'usr_demo_012',
    userName: 'Bouanga Roch',
    userEmail: 'roch.bouanga@gmail.com',
    planId: 'plan_family',
    planName: 'Famille Mwana Lari',
    amount: 1500,
    currency: 'XAF',
    provider: 'MTN_MOMO',
    phoneNumber: '+242 06 777 55 44',
    status: 'SUCCESS',
    transactionRef: 'MOMO-551023',
    providerTransactionId: 'OP-MTN-551023',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  }
];

export const adminSubscriptionsAPI = {
  getSubscribers: async (): Promise<AdminSubscriberItem[]> => {
    try {
      const data = await apiRequest<AdminSubscriberItem[]>('/payments/admin/subscribers');
      if (data && data.length > 0) {
        localStorage.setItem(ADMIN_SUBS_LOCAL_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // Fallback
    }

    const localJson = localStorage.getItem(ADMIN_SUBS_LOCAL_KEY);
    if (localJson) {
      try {
        const parsed = JSON.parse(localJson);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem(ADMIN_SUBS_LOCAL_KEY, JSON.stringify(DEFAULT_DEMO_SUBSCRIBERS));
    return DEFAULT_DEMO_SUBSCRIBERS;
  },

  getTransactions: async (): Promise<AdminTransactionItem[]> => {
    try {
      const data = await apiRequest<AdminTransactionItem[]>('/payments/admin/transactions');
      if (data && data.length > 0) {
        localStorage.setItem(ADMIN_TX_LOCAL_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // Fallback
    }

    const localJson = localStorage.getItem(ADMIN_TX_LOCAL_KEY);
    if (localJson) {
      try {
        const parsed = JSON.parse(localJson);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem(ADMIN_TX_LOCAL_KEY, JSON.stringify(DEFAULT_DEMO_TRANSACTIONS));
    return DEFAULT_DEMO_TRANSACTIONS;
  },

  grantSubscription: async (payload: ManualGrantPayload): Promise<any> => {
    try {
      const resp = await apiRequest('/payments/admin/grant', {
        method: 'POST',
        body: JSON.stringify({
          email_or_phone: payload.emailOrPhone,
          full_name: payload.fullName || 'Famille Partenaire',
          tier: payload.tier,
          duration_months: payload.durationMonths,
          notes: payload.notes || '',
        }),
      });
      return resp;
    } catch (err) {
      // Local simulated grant
      const localSubs = (await adminSubscriptionsAPI.getSubscribers()).slice();
      const newSub: AdminSubscriberItem = {
        id: `sub_manual_${Date.now()}`,
        userId: `usr_${Date.now()}`,
        fullName: payload.fullName || payload.emailOrPhone.split('@')[0],
        email: payload.emailOrPhone.includes('@') ? payload.emailOrPhone : `${payload.emailOrPhone}@mwanalari.cg`,
        phoneNumber: !payload.emailOrPhone.includes('@') ? payload.emailOrPhone : '+242 06 000 00 00',
        role: 'PARENT',
        planId: payload.tier === 'CLAN_DIASPORA' ? 'plan_clan' : 'plan_family',
        planName: payload.tier === 'CLAN_DIASPORA' ? 'Grand Clan & Diaspora' : 'Famille Mwana Lari',
        tier: payload.tier,
        status: 'ACTIVE',
        paymentMethod: 'MTN_MOMO',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + payload.durationMonths * 30 * 86400000).toISOString(),
        transactionReference: `ADMIN-GRANT-${Date.now().toString().slice(-6)}`,
        autoRenew: true,
      };

      const updated = [newSub, ...localSubs];
      localStorage.setItem(ADMIN_SUBS_LOCAL_KEY, JSON.stringify(updated));
      return { status: 'SUCCESS', message: 'Abonnement accordé (Mode Local)' };
    }
  },

  updateSubscriptionStatus: async (subId: string, status?: SubscriptionStateStatus, extendMonths?: number): Promise<any> => {
    try {
      return await apiRequest(`/payments/admin/subscriptions/${subId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          extend_months: extendMonths || 0,
        }),
      });
    } catch (err) {
      const localSubs = (await adminSubscriptionsAPI.getSubscribers()).map((s) => {
        if (s.id === subId) {
          const newEndDate = extendMonths && extendMonths > 0
            ? new Date(new Date(s.endDate).getTime() + extendMonths * 30 * 86400000).toISOString()
            : s.endDate;
          return {
            ...s,
            status: status || s.status,
            endDate: newEndDate,
          };
        }
        return s;
      });
      localStorage.setItem(ADMIN_SUBS_LOCAL_KEY, JSON.stringify(localSubs));
      return { status: 'SUCCESS' };
    }
  },

  simulateTransaction: async (payload: {
    provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'VISA_MASTERCARD';
    phoneNumber: string;
    amount: number;
    currency: 'XAF' | 'EUR';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    tier: 'FAMILY' | 'CLAN_DIASPORA';
    userEmail?: string;
  }): Promise<any> => {
    try {
      return await apiRequest('/payments/admin/simulate-tx', {
        method: 'POST',
        body: JSON.stringify({
          provider: payload.provider,
          phone_number: payload.phoneNumber,
          amount: payload.amount,
          currency: payload.currency,
          status: payload.status,
          tier: payload.tier,
          user_email: payload.userEmail,
        }),
      });
    } catch (err) {
      // Local fallback simulation
      const txs = (await adminSubscriptionsAPI.getTransactions()).slice();
      const ref = `SIM-${payload.provider.slice(0, 3)}-${Date.now().toString().slice(-6)}`;
      const newTx: AdminTransactionItem = {
        id: `tx_${Date.now()}`,
        userId: `usr_sim_${Date.now()}`,
        userName: payload.userEmail ? payload.userEmail.split('@')[0] : 'Client MoMo / Airtel',
        userEmail: payload.userEmail || 'client@mwanalari.cg',
        planId: payload.tier === 'CLAN_DIASPORA' ? 'plan_clan' : 'plan_family',
        planName: payload.tier === 'CLAN_DIASPORA' ? 'Grand Clan & Diaspora' : 'Famille Mwana Lari',
        amount: payload.amount,
        currency: payload.currency,
        provider: payload.provider,
        phoneNumber: payload.phoneNumber,
        status: payload.status,
        transactionRef: ref,
        providerTransactionId: `OP-${ref}`,
        createdAt: new Date().toISOString(),
      };

      const updated = [newTx, ...txs];
      localStorage.setItem(ADMIN_TX_LOCAL_KEY, JSON.stringify(updated));
      return { status: 'SUCCESS', message: 'Transaction simulée (Mode Local)' };
    }
  },
};

