import { WordItem, CulturalStory, LessonUnit, ChildProfile, UserRole } from '../types';

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

  register: async (payload: RegisterPayload): Promise<UserSession> => {
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

  getMe: async (): Promise<any> => {
    return await apiRequest('/auth/me');
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
