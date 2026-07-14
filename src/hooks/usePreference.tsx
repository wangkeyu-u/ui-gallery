import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserPreference } from '../types';

const DEFAULT_PREFERENCE: UserPreference = {
  likedProjectIds: [],
  dislikedProjectIds: [],
  positiveKeywords: [],
  negativeKeywords: [],
  lockedDecisions: [],
  colorPreferences: [],
  materialPreferences: [],
  densityPreferences: [],
  fontPreferences: [],
  animationPreferences: [],
  rejectedPatterns: [],
  history: [],
};

interface PreferenceContextType {
  preference: UserPreference;
  likeProject: (id: string) => void;
  dislikeProject: (id: string) => void;
  addPositiveKeyword: (kw: string) => void;
  addNegativeKeyword: (kw: string) => void;
  lockDecision: (decision: string) => void;
  rejectPattern: (pattern: string) => void;
  resetPreference: () => void;
}

const PreferenceContext = createContext<PreferenceContextType>({
  preference: DEFAULT_PREFERENCE,
  likeProject: () => {},
  dislikeProject: () => {},
  addPositiveKeyword: () => {},
  addNegativeKeyword: () => {},
  lockDecision: () => {},
  rejectPattern: () => {},
  resetPreference: () => {},
});

const STORAGE_KEY = 'ui-gallery-preference';

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<UserPreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_PREFERENCE, ...JSON.parse(saved) } : DEFAULT_PREFERENCE;
    } catch {
      return DEFAULT_PREFERENCE;
    }
  });

  const save = useCallback((next: UserPreference) => {
    setPreference(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const likeProject = useCallback((id: string) => {
    setPreference(prev => {
      if (prev.likedProjectIds.includes(id)) return prev;
      const next = {
        ...prev,
        likedProjectIds: [...prev.likedProjectIds, id],
        dislikedProjectIds: prev.dislikedProjectIds.filter(d => d !== id),
        history: [...prev.history, { action: 'like', value: id, timestamp: new Date().toISOString() }],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const dislikeProject = useCallback((id: string) => {
    setPreference(prev => {
      if (prev.dislikedProjectIds.includes(id)) return prev;
      const next = {
        ...prev,
        dislikedProjectIds: [...prev.dislikedProjectIds, id],
        likedProjectIds: prev.likedProjectIds.filter(l => l !== id),
        history: [...prev.history, { action: 'dislike', value: id, timestamp: new Date().toISOString() }],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addPositiveKeyword = useCallback((kw: string) => {
    setPreference(prev => {
      if (prev.positiveKeywords.includes(kw)) return prev;
      const next = { ...prev, positiveKeywords: [...prev.positiveKeywords, kw] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addNegativeKeyword = useCallback((kw: string) => {
    setPreference(prev => {
      if (prev.negativeKeywords.includes(kw)) return prev;
      const next = { ...prev, negativeKeywords: [...prev.negativeKeywords, kw] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const lockDecision = useCallback((decision: string) => {
    setPreference(prev => {
      if (prev.lockedDecisions.includes(decision)) return prev;
      const next = { ...prev, lockedDecisions: [...prev.lockedDecisions, decision] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const rejectPattern = useCallback((pattern: string) => {
    setPreference(prev => {
      if (prev.rejectedPatterns.includes(pattern)) return prev;
      const next = { ...prev, rejectedPatterns: [...prev.rejectedPatterns, pattern] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetPreference = useCallback(() => {
    save(DEFAULT_PREFERENCE);
  }, [save]);

  return (
    <PreferenceContext.Provider value={{
      preference,
      likeProject,
      dislikeProject,
      addPositiveKeyword,
      addNegativeKeyword,
      lockDecision,
      rejectPattern,
      resetPreference,
    }}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreference() {
  return useContext(PreferenceContext);
}
