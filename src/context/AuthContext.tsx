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
import { ChildProfile, UserRole } from '../types';
import { INITIAL_CHILD_PROFILE } from '../data/mockData';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isServerOnline: boolean;
  activeRole: UserRole;
  activeChild: ChildProfile;
  childrenList: ChildProfile[];
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload, initialChildName?: string) => Promise<void>;
  logout: () => void;
  loginAsDemo: (demoType: 'parent' | 'teacher' | 'linguist' | 'admin') => Promise<void>;
  setActiveChild: (child: ChildProfile) => void;
  updateActiveChildStats: (stats: Partial<ChildProfile>) => void;
  addChild: (payload: CreateChildPayload) => Promise<ChildProfile>;
  refreshChildren: () => Promise<void>;
  checkHealth: () => Promise<void>;
}

const DEMO_ACCOUNTS = {
  parent: { email: 'parent@mwanalari.cg', password: 'MwanaLari2026!' },
  teacher: { email: 'enseignant@mwanalari.cg', password: 'MwanaLari2026!' },
  linguist: { email: 'linguiste@mwanalari.cg', password: 'MwanaLari2026!' },
  admin: { email: 'admin@mwanalari.cg', password: 'MwanaLari2026!' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([INITIAL_CHILD_PROFILE]);
  const [activeChild, setActiveChildState] = useState<ChildProfile>(INITIAL_CHILD_PROFILE);

  // Computed active role: user role if logged in, otherwise 'CHILD'
  const activeRole: UserRole = user ? user.role : 'CHILD';

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
        // keep current selected if exists, else first
        setActiveChildState((prev) => {
          const match = kids.find((k) => k.id === prev.id);
          return match || kids[0];
        });
      }
    } catch (err) {
      console.warn('Erreur chargement enfants depuis API:', err);
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
        if (stored.role === 'PARENT') {
          try {
            const kids = await parentsAPI.getChildren();
            if (kids && kids.length > 0) {
              setChildrenList(kids);
              setActiveChildState(kids[0]);
            }
          } catch (err) {
            console.warn('Session restaurée, échec chargement enfants:', err);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const session = await authAPI.login(email, password);
      setUser(session);
      setIsServerOnline(true);

      // If parent, fetch associated children
      if (session.role === 'PARENT') {
        try {
          const kids = await parentsAPI.getChildren();
          if (kids && kids.length > 0) {
            setChildrenList(kids);
            setActiveChildState(kids[0]);
          } else {
            // Seed a default child if none
            const newKid = await parentsAPI.createChild({
              firstName: 'Kamba',
              ageGroup: '6-8',
              avatarId: 'koko_happy',
            });
            setChildrenList([newKid]);
            setActiveChildState(newKid);
          }
        } catch (e) {
          console.warn('Erreur récupération enfants après login:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload, initialChildName?: string) => {
    setIsLoading(true);
    try {
      const session = await authAPI.register(payload);
      setUser(session);
      setIsServerOnline(true);

      // If parent, create initial child
      if (session.role === 'PARENT') {
        try {
          const newKid = await parentsAPI.createChild({
            firstName: initialChildName?.trim() || 'Kamba',
            ageGroup: '6-8',
            avatarId: 'koko_happy',
          });
          setChildrenList([newKid]);
          setActiveChildState(newKid);
        } catch (e) {
          console.warn('Erreur création enfant initial:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (demoType: 'parent' | 'teacher' | 'linguist' | 'admin') => {
    const creds = DEMO_ACCOUNTS[demoType];
    if (creds) {
      await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
    setActiveChildState(INITIAL_CHILD_PROFILE);
    setChildrenList([INITIAL_CHILD_PROFILE]);
  };

  const setActiveChild = (child: ChildProfile) => {
    setActiveChildState(child);
  };

  const updateActiveChildStats = (stats: Partial<ChildProfile>) => {
    setActiveChildState((prev) => {
      const updated = { ...prev, ...stats };
      // Update in children list too
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
        login,
        register,
        logout,
        loginAsDemo,
        setActiveChild,
        updateActiveChildStats,
        addChild,
        refreshChildren,
        checkHealth,
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
