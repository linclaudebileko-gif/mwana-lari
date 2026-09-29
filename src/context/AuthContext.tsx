import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserSession,
  RegisterPayload,
  CreateChildPayload,
  authAPI,
  parentsAPI,
  getStoredSession,
  clearStoredSession,
  setStoredSession
} from '../services/api';
import { ChildProfile, UserRole, SubscriptionStatus, SubscriptionTier, PaymentMethod } from '../types';
import { INITIAL_CHILD_PROFILE } from '../data/mockData';
import { paymentsAPI } from '../services/api';

import {
  isParentSessionValid,
  setParentUnlockedSession,
  lockParentSession,
  verifyParentalPin,
  saveParentalPin,
  hasCustomParentalPin
} from '../utils/security';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isServerOnline: boolean;
  activeRole: UserRole;
  activeChild: ChildProfile;
  childrenList: ChildProfile[];
  subscription: SubscriptionStatus;
  isPremium: boolean;
  isParentUnlocked: boolean;
  hasParentalPin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload, initialChildName?: string) => Promise<void>;
  logout: () => void;
  loginAsDemo: (demoType: 'parent' | 'teacher' | 'linguist' | 'admin') => Promise<void>;
  setActiveChild: (child: ChildProfile) => void;
  updateActiveChildStats: (stats: Partial<ChildProfile>) => void;
  addChild: (payload: CreateChildPayload) => Promise<ChildProfile>;
  refreshChildren: () => Promise<void>;
  checkHealth: () => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier, details: {
    planName: string;
    billingCycle: 'monthly' | 'yearly';
    paymentMethod: PaymentMethod;
    phoneNumber?: string;
  }) => Promise<void>;
  unlockParentalGate: (pin: string) => Promise<boolean>;
  unlockWithMathChallenge: (answer: number, expected: number) => boolean;
  lockParentalGate: () => void;
  updateParentalPin: (newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([INITIAL_CHILD_PROFILE]);
  const [activeChild, setActiveChildState] = useState<ChildProfile>(INITIAL_CHILD_PROFILE);
  const [subscription, setSubscription] = useState<SubscriptionStatus>(() => {
    return paymentsAPI.getLocalSubscription() as SubscriptionStatus;
  });

  const [isParentUnlocked, setIsParentUnlocked] = useState<boolean>(() => isParentSessionValid());
  const [hasParentalPinState, setHasParentalPinState] = useState<boolean>(() => hasCustomParentalPin());

  // Computed active role: user role if logged in, otherwise 'CHILD'
  const activeRole: UserRole = user ? user.role : 'CHILD';
  const isPremium: boolean = subscription.isPremium;
  const hasParentalPin: boolean = hasParentalPinState;

  const checkHealth = async () => {
    try {
      const online = await authAPI.checkServerHealth();
      setIsServerOnline(online);
    } catch {
      setIsServerOnline(false);
    }
  };

  const refreshChildren = async () => {
    if (!user || user.role !== 'PARENT') return;
    try {
      const kids = await parentsAPI.getChildren();
      if (kids && kids.length > 0) {
        setChildrenList(kids);
        setActiveChildState((prev) => {
          const match = kids.find((k) => k.id === prev.id);
          return match || kids[0];
        });
      }
    } catch (err) {
      console.warn('Erreur chargement enfants depuis API:', err);
    }
  };

  const refreshSubscription = async () => {
    try {
      const liveSub = await paymentsAPI.getMySubscription();
      if (liveSub) {
        setSubscription(liveSub as SubscriptionStatus);
      }
    } catch (err) {
      console.warn('Erreur synchronisation abonnement:', err);
    }
  };

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkHealth();

      const stored = getStoredSession();
      if (stored) {
        setUser(stored);

        // Si le serveur est accessible, valide la session HttpOnly et rafraîchit si besoin
        try {
          const me = await authAPI.getMe();
          if (me) {
            const liveSession: UserSession = {
              id: me.id,
              email: me.email,
              role: me.role,
              fullName: me.full_name,
              phoneNumber: me.phone_number,
              countryCode: me.country_code,
            };
            setUser(liveSession);
            setStoredSession(liveSession);
          }
        } catch {
          // Mode hors-ligne ou session expirée : conserve les données locales hors-ligne si non-401
        }

        await refreshSubscription();
        if (stored.role === 'PARENT') {
          try {
            const kids = await parentsAPI.getChildren();
            if (kids && kids.length > 0) {
              setChildrenList(kids);
              setActiveChildState(kids[0]);
            }
          } catch {
            // fallback offline
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const session = await authAPI.login(email, pass);
      setUser(session);
      await refreshSubscription();
      if (session.role === 'PARENT') {
        await refreshChildren();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload, initialChildName?: string) => {
    setIsLoading(true);
    try {
      const session = await authAPI.register(payload, initialChildName);
      setUser(session);
      await refreshSubscription();
      if (session.role === 'PARENT') {
        await refreshChildren();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setChildrenList([INITIAL_CHILD_PROFILE]);
    setActiveChildState(INITIAL_CHILD_PROFILE);
    const freeSub: SubscriptionStatus = {
      isPremium: false,
      tier: 'FREE',
      planName: 'Découverte (Gratuit)',
      billingCycle: 'monthly',
      expiresAt: '',
    };
    setSubscription(freeSub);
    paymentsAPI.saveLocalSubscription(freeSub);
  };

  const loginAsDemo = async (demoType: 'parent' | 'teacher' | 'linguist' | 'admin') => {
    setIsLoading(true);
    try {
      const session = await authAPI.demoLogin(demoType);
      setUser(session);
      await refreshSubscription();
      if (session.role === 'PARENT') {
        await refreshChildren();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveChild = (child: ChildProfile) => {
    setActiveChildState(child);
  };

  const updateActiveChildStats = (stats: Partial<ChildProfile>) => {
    setActiveChildState((prev) => {
      const updated = { ...prev, ...stats };
      setChildrenList((list) => list.map((k) => (k.id === updated.id ? updated : k)));
      return updated;
    });
  };

  const addChild = async (payload: CreateChildPayload): Promise<ChildProfile> => {
    const newChild = await parentsAPI.createChild(payload);
    setChildrenList((prev) => [...prev, newChild]);
    setActiveChildState(newChild);
    return newChild;
  };

  const upgradeSubscription = async (
    tier: SubscriptionTier,
    details: {
      planName: string;
      billingCycle: 'monthly' | 'yearly';
      paymentMethod: PaymentMethod;
      phoneNumber?: string;
    }
  ) => {
    const expiryDate = new Date();
    if (details.billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const newSub: SubscriptionStatus = {
      isPremium: tier !== 'FREE',
      tier,
      planName: details.planName,
      billingCycle: details.billingCycle,
      expiresAt: expiryDate.toISOString(),
      phoneNumber: details.phoneNumber,
      paymentMethod: details.paymentMethod,
    };

    setSubscription(newSub);
    paymentsAPI.saveLocalSubscription(newSub);
  };

  const unlockParentalGate = async (pin: string): Promise<boolean> => {
    const isValid = await verifyParentalPin(pin);
    if (isValid) {
      setParentUnlockedSession(15);
      setIsParentUnlocked(true);
      return true;
    }
    return false;
  };

  const unlockWithMathChallenge = (answer: number, expected: number): boolean => {
    if (answer === expected) {
      setParentUnlockedSession(15);
      setIsParentUnlocked(true);
      return true;
    }
    return false;
  };

  const lockParentalGate = () => {
    lockParentSession();
    setIsParentUnlocked(false);
  };

  const updateParentalPin = async (newPin: string): Promise<void> => {
    await saveParentalPin(newPin);
    setHasParentalPinState(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isServerOnline,
        activeRole,
        activeChild,
        childrenList,
        subscription,
        isPremium,
        isParentUnlocked,
        hasParentalPin,
        login,
        register,
        logout,
        loginAsDemo,
        setActiveChild,
        updateActiveChildStats,
        addChild,
        refreshChildren,
        checkHealth,
        upgradeSubscription,
        unlockParentalGate,
        unlockWithMathChallenge,
        lockParentalGate,
        updateParentalPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  }
  return context;
};
