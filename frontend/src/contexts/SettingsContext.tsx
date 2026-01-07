import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface PillarWeight {
  id: string;
  name: string;
  weight: number;
}

export interface PriceTierSetting {
  label: string;
  price: number;
}

export type DiagnosticQuestionCategory = 'situation' | 'timeline' | 'authority' | 'pain' | 'financial';

export interface EditableDiagnosticQuestion {
  question: string;
  helper: string;
  badgeText: string;
  badgeColor: DiagnosticQuestionCategory;
}

export interface AdminSettings {
  pillarWeights: PillarWeight[];
  priceTiers: PriceTierSetting[];
  customScriptPrompt: string;
  diagnosticQuestionsByProspectType: Record<string, EditableDiagnosticQuestion[]>;
}

const DEFAULT_SETTINGS: AdminSettings = {
  pillarWeights: [
    { id: 'P1', name: 'Pain & Desire', weight: 1.5 },
    { id: 'P2', name: 'Urgency', weight: 1.0 },
    { id: 'P3', name: 'Decisiveness', weight: 1.0 },
    { id: 'P4', name: 'Available Money', weight: 1.5 },
    { id: 'P5', name: 'Responsibility', weight: 1.0 },
    { id: 'P6', name: 'Price Sensitivity', weight: 1.5 },
    { id: 'P7', name: 'Trust', weight: 1.5 },
  ],
  priceTiers: [
    { label: 'Starter', price: 2997 },
    { label: 'Professional', price: 7997 },
    { label: 'Elite', price: 15997 },
  ],
  customScriptPrompt: '',
  diagnosticQuestionsByProspectType: {},
};

interface SettingsContextType {
  settings: AdminSettings;
  updatePillarWeight: (pillarId: string, weight: number) => void;
  updatePriceTier: (index: number, price: number, label?: string) => void;
  updateCustomPrompt: (prompt: string) => void;
  updateDiagnosticQuestions: (prospectType: string, questions: EditableDiagnosticQuestion[]) => void;
  resetToDefaults: () => void;
  saveToSupabase: () => Promise<{ success: boolean; error?: string }>;
  saving: boolean;
  lastSaved: Date | null;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Per-user localStorage key
const getStorageKey = (userId: string | null) => userId ? `zss_settings_${userId}` : 'zss_settings_guest';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;
  const prevUserIdRef = useRef<string | null>(null);

  const mergeWithDefaults = useMemo(() => {
    return (incoming: any): AdminSettings => {
      const parsed = incoming && typeof incoming === 'object' ? incoming : {};
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        pillarWeights: Array.isArray(parsed.pillarWeights) ? parsed.pillarWeights : DEFAULT_SETTINGS.pillarWeights,
        priceTiers: Array.isArray(parsed.priceTiers) ? parsed.priceTiers : DEFAULT_SETTINGS.priceTiers,
        customScriptPrompt: typeof parsed.customScriptPrompt === 'string' ? parsed.customScriptPrompt.slice(0, 70) : DEFAULT_SETTINGS.customScriptPrompt,
        diagnosticQuestionsByProspectType:
          parsed.diagnosticQuestionsByProspectType && typeof parsed.diagnosticQuestionsByProspectType === 'object'
            ? parsed.diagnosticQuestionsByProspectType
            : DEFAULT_SETTINGS.diagnosticQuestionsByProspectType,
      };
    };
  }, []);

  // Start with defaults - will hydrate from Supabase when user logs in
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);

  const hydratingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Reset to defaults and hydrate from Supabase when user changes
  useEffect(() => {
    // Detect user change (login, logout, or switch accounts)
    if (prevUserIdRef.current !== userId) {
      console.log('[settings] User changed:', prevUserIdRef.current, '->', userId);
      prevUserIdRef.current = userId;
      
      // Reset to defaults immediately when user changes
      setSettings(DEFAULT_SETTINGS);
      setLastSaved(null);
      
      // If no user, we're done (use defaults)
      if (!userId) {
        return;
      }
    }

    // Hydrate from Supabase for logged-in user
    if (!userId || !isSupabaseAvailable()) return;

    let cancelled = false;
    hydratingRef.current = true;

    (async () => {
      try {
        console.log('[settings] Fetching settings for user:', userId);
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings, user_email, updated_by_email, updated_at')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('[settings] fetch error:', error);
          return;
        }
        if (cancelled) return;
        
        if (data?.settings) {
          console.log('[settings] Loaded from Supabase:', data.settings);
          setSettings(mergeWithDefaults(data.settings));
        } else {
          console.log('[settings] No saved settings found, using defaults');
          // Keep defaults - user hasn't saved settings yet
        }
      } finally {
        setTimeout(() => {
          hydratingRef.current = false;
        }, 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, mergeWithDefaults]);

  // Save to per-user localStorage whenever settings change (local backup only)
  useEffect(() => {
    if (!userId) return; // Don't save to localStorage if not logged in
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings, userId]);

  // Manual save to Supabase
  const saveToSupabase = async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'You must be signed in to save settings' };
    }

    if (!isSupabaseAvailable()) {
      return { success: false, error: 'Supabase is not configured. Settings saved locally only.' };
    }

    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        user_email: userEmail || '',
        updated_by_email: userEmail || '',
        settings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('user_settings')
        .upsert(payload);
      
      if (error) {
        console.error('[settings] upsert error:', error);
        return { success: false, error: error.message };
      }
      
      setLastSaved(new Date());
      return { success: true };
    } catch (err: any) {
      console.error('[settings] upsert exception:', err);
      return { success: false, error: err?.message || 'Unknown error' };
    } finally {
      setSaving(false);
    }
  };

  const updatePillarWeight = (pillarId: string, weight: number) => {
    setSettings(prev => ({
      ...prev,
      pillarWeights: prev.pillarWeights.map(p =>
        p.id === pillarId ? { ...p, weight: Math.max(0.5, Math.min(3.0, weight)) } : p
      ),
    }));
  };

  const updatePriceTier = (index: number, price: number, label?: string) => {
    setSettings(prev => ({
      ...prev,
      priceTiers: prev.priceTiers.map((t, i) =>
        i === index ? { ...t, price: Math.max(0, price), ...(label !== undefined ? { label } : {}) } : t
      ),
    }));
  };

  const updateCustomPrompt = (prompt: string) => {
    setSettings(prev => ({
      ...prev,
      customScriptPrompt: prompt.slice(0, 70),
    }));
  };

  const updateDiagnosticQuestions: SettingsContextType['updateDiagnosticQuestions'] = (prospectType, questions) => {
    setSettings(prev => ({
      ...prev,
      diagnosticQuestionsByProspectType: {
        ...(prev.diagnosticQuestionsByProspectType || {}),
        [prospectType]: Array.isArray(questions) ? questions : []
      }
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updatePillarWeight,
        updatePriceTier,
        updateCustomPrompt,
        updateDiagnosticQuestions,
        resetToDefaults,
        saveToSupabase,
        saving,
        lastSaved,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
