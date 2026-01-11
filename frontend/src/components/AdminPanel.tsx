import { useState } from 'react';
import { ArrowLeft, Settings, Scale, MessageSquare, RotateCcw, Save, Check, AlertCircle, Mail, Lock, UserPlus, LogIn, FileText } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { prospectTypes } from '../data/coPilotData';

interface AdminPanelProps {
  onBack: () => void;
  onViewSummaries?: () => void;
}

// Full-page login/signup screen
function AuthScreen({ 
  onBack, 
  onAuthSuccess 
}: { 
  onBack: () => void;
  onAuthSuccess: () => void;
}) {
  const { signInWithPassword, signUpWithPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleAuth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      const emailTrimmed = email.trim();
      if (!emailTrimmed) {
        setAuthError('Email is required.');
        return;
      }
      if (!password) {
        setAuthError('Password is required.');
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }

      if (authMode === 'signin') {
        const result = await signInWithPassword(emailTrimmed, password);
        if (result.error) {
          // Make sign-in errors more user-friendly
          if (result.error.toLowerCase().includes('invalid login credentials')) {
            setAuthError('Invalid email or password. Please check your credentials and try again.');
          } else {
            setAuthError(result.error);
          }
        } else {
          onAuthSuccess();
        }
      } else {
        const result = await signUpWithPassword(emailTrimmed, password);
        console.log('[Auth] Signup result:', result);
        
        if (result.error) {
          console.log('[Auth] Signup error:', result.error);
          // Check if account already exists
          const errorLower = result.error.toLowerCase();
          if (errorLower.includes('already registered') || 
              errorLower.includes('already exists') || 
              errorLower.includes('user already') ||
              errorLower.includes('email already') ||
              errorLower.includes('sign in instead') ||
              errorLower.includes('duplicate')) {
            setAuthError('ACCOUNT_EXISTS');
          } else {
            setAuthError(result.error);
          }
        } else {
          // Signup success - show verification message
          setSignupSuccess(true);
        }
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // Show verification message after signup
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="backdrop-blur-xl bg-gray-900/60 border border-gray-700/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check your email!</h2>
            <p className="text-gray-300 mb-6">
              We've sent a verification link to <span className="text-cyan-400 font-medium">{email}</span>. 
              Please click the link in your email to verify your account before signing in.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSignupSuccess(false);
                  setAuthMode('signin');
                  setPassword('');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border border-cyan-500/40 rounded-xl transition-all text-white font-semibold"
              >
                Back to Sign In
              </button>
              <button
                onClick={onBack}
                className="w-full px-4 py-3 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-xl transition-all text-gray-300 font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 mb-6 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-300 text-sm font-medium">Back to Dashboard</span>
        </button>

        <div className="backdrop-blur-xl bg-gray-900/60 border border-gray-700/50 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400 text-sm">
              {authMode === 'signin' 
                ? 'Sign in to access your settings' 
                : 'Create an account to save your settings'}
            </p>
          </div>

          {/* Auth mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('signin')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                authMode === 'signin'
                  ? 'bg-cyan-600/30 border-cyan-500/60 text-white'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800/60 hover:text-gray-300'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                authMode === 'signup'
                  ? 'bg-purple-600/30 border-purple-500/60 text-white'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800/60 hover:text-gray-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="••••••••"
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
              {authMode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              )}
            </div>

            {authError && authError === 'ACCOUNT_EXISTS' ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-amber-300 mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Account already exists!</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  An account with this email already exists. Would you like to sign in instead?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthMode('signin');
                  }}
                  className="w-full px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 rounded-lg transition-all text-amber-200 text-sm font-medium"
                >
                  Switch to Sign In
                </button>
              </div>
            ) : authError ? (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {authError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={authBusy || loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed border border-cyan-500/40 rounded-xl transition-all text-white font-semibold flex items-center justify-center gap-2"
            >
              {authBusy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {authMode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {authMode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {authMode === 'signup' && (
            <p className="text-xs text-gray-500 text-center mt-4">
              By creating an account, you'll receive an email to verify your address before accessing the Admin Panel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Email verification pending screen
function VerificationPendingScreen({ 
  email, 
  onBack,
  onSignOut
}: { 
  email: string;
  onBack: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="backdrop-blur-xl bg-gray-900/60 border border-amber-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Email Verification Required</h2>
          <p className="text-gray-300 mb-2">
            Your email <span className="text-amber-400 font-medium">{email}</span> hasn't been verified yet.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Please check your inbox and click the verification link we sent you. After verifying, refresh this page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border border-amber-500/40 rounded-xl transition-all text-white font-semibold"
            >
              I've Verified - Refresh
            </button>
            <button
              onClick={onSignOut}
              className="w-full px-4 py-3 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-xl transition-all text-gray-300 font-medium"
            >
              Sign Out
            </button>
            <button
              onClick={onBack}
              className="w-full px-4 py-3 text-gray-400 hover:text-gray-300 transition-all text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({ onBack, onViewSummaries }: AdminPanelProps) {
  const { settings, updatePillarWeight, updateCustomPrompt, updateDiagnosticQuestions, resetToDefaults, saveToSupabase, saving, lastSaved } = useSettings();
  const { user, loading, signOut } = useAuth();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    const result = await saveToSupabase();
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error || 'Failed to save');
    }
  };

  const calculateMaxScore = () => {
    return settings.pillarWeights.reduce((sum, p) => sum + p.weight * 10, 0);
  };

  const [dqProspectType, setDqProspectType] = useState<string>('foreclosure');
  const dqList = Array.isArray(settings.diagnosticQuestionsByProspectType?.[dqProspectType])
    ? settings.diagnosticQuestionsByProspectType[dqProspectType]
    : [];

  // AI Generation state
  const [aiGenerationPrompt, setAiGenerationPrompt] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const generateQuestionsWithAI = async () => {
    if (!aiGenerationPrompt.trim()) return;
    
    setIsGeneratingQuestions(true);
    try {
      // Construct API URL from WebSocket URL or use same-origin
      const wsUrl = import.meta.env.VITE_WS_URL;
      let apiBaseUrl: string;
      
      if (wsUrl) {
        // Convert ws://host:port/ws to http://host:port
        apiBaseUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws', '');
      } else if (import.meta.env.DEV) {
        // Development: use localhost
        apiBaseUrl = 'http://localhost:3001';
      } else {
        // Production: use same origin
        apiBaseUrl = window.location.origin;
      }
      
      const response = await fetch(`${apiBaseUrl}/api/generate-diagnostic-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiGenerationPrompt,
          prospectType: dqProspectType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate questions`);
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        // Replace current questions with AI-generated ones
        updateDiagnosticQuestions(dqProspectType, data.questions);
        setAiGenerationPrompt(''); // Clear prompt after success
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveError(`Failed to generate questions: ${errorMsg}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show auth screen
  if (!user) {
    return <AuthScreen onBack={onBack} onAuthSuccess={() => {}} />;
  }

  // Logged in but email not verified - show verification pending
  // Check email_confirmed_at (Supabase v2) - it's a timestamp string when verified, null/undefined when not
  const emailConfirmedAt = (user as any).email_confirmed_at;
  const isEmailVerified = emailConfirmedAt && emailConfirmedAt !== '';
  
  console.log('[AdminPanel] User:', user.email, 'email_confirmed_at:', emailConfirmedAt, 'isVerified:', isEmailVerified);
  
  if (!isEmailVerified) {
    return (
      <VerificationPendingScreen 
        email={user.email || ''} 
        onBack={onBack}
        onSignOut={signOut}
      />
    );
  }

  // Logged in and verified - show admin panel
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/40">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 text-sm font-medium">Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-cyan-400" />
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Signed in as</span> {user.email}
              </div>
              {onViewSummaries && (
                <button
                  onClick={onViewSummaries}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 border border-purple-500/50 rounded-lg transition-all text-purple-300 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Conversation Summaries</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                  saveSuccess
                    ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300'
                    : 'bg-gradient-to-r from-emerald-600/60 to-cyan-600/60 hover:from-emerald-600 hover:to-cyan-600 border-emerald-500/50 text-white'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
                </span>
              </button>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-lg transition-all text-gray-200 text-sm font-medium"
              >
                Sign out
              </button>
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pillar Weights Section */}
          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <Scale className="w-7 h-7 text-purple-400" />
                <div className="absolute inset-0 blur-md bg-purple-400/30" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lubometer Pillar Weights</h2>
                <p className="text-sm text-gray-400">Adjust weights for each pillar (0.5 - 3.0)</p>
              </div>
            </div>

            <div className="space-y-4">
              {settings.pillarWeights.map((pillar) => (
                <div
                  key={pillar.id}
                  className="p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-mono text-sm">{pillar.id}</span>
                      <span className="text-white font-medium">{pillar.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={pillar.weight}
                        onChange={(e) => updatePillarWeight(pillar.id, parseFloat(e.target.value) || 1.0)}
                        className="w-20 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-center font-mono focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="text-gray-400 text-sm">×</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={pillar.weight}
                    onChange={(e) => updatePillarWeight(pillar.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Maximum Lubometer Score:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {calculateMaxScore().toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Script Prompt Section */}
          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <MessageSquare className="w-7 h-7 text-amber-400" />
                <div className="absolute inset-0 blur-md bg-amber-400/30" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Custom Script Prompt</h2>
                <p className="text-sm text-gray-400">
                  Add custom context for personalized handling scripts (max 70 characters)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={settings.customScriptPrompt}
                onChange={(e) => updateCustomPrompt(e.target.value)}
                maxLength={70}
                placeholder="e.g., Focus on building trust before presenting price..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none h-24"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  This text will be included in AI script generation prompts
                </span>
                <span className={`text-sm font-mono ${
                  settings.customScriptPrompt.length >= 60 ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {settings.customScriptPrompt.length}/70
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Questions Editor */}
        <div className="mt-8 backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Diagnostic Questions Editor</h2>
              <p className="text-sm text-gray-400">Edit the question, helper text, and badge for each prospect type</p>
            </div>
            <select
              value={dqProspectType}
              onChange={(e) => setDqProspectType(e.target.value)}
              className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              {prospectTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {dqList.length === 0 ? (
              <div className="text-gray-400 text-sm">
                No custom questions saved yet for this prospect type. Add your first one below.
              </div>
            ) : (
              dqList.map((q, idx) => (
                <div key={idx} className="p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Question</label>
                      <input
                        value={q.question}
                        onChange={(e) => {
                          const next = dqList.map((x, i) => i === idx ? { ...x, question: e.target.value } : x);
                          updateDiagnosticQuestions(dqProspectType, next);
                        }}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                      <label className="block text-xs text-gray-400 mb-1 mt-3">Helper text</label>
                      <input
                        value={q.helper}
                        onChange={(e) => {
                          const next = dqList.map((x, i) => i === idx ? { ...x, helper: e.target.value } : x);
                          updateDiagnosticQuestions(dqProspectType, next);
                        }}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Badge text</label>
                      <input
                        value={q.badgeText}
                        onChange={(e) => {
                          const next = dqList.map((x, i) => i === idx ? { ...x, badgeText: e.target.value } : x);
                          updateDiagnosticQuestions(dqProspectType, next);
                        }}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                      <label className="block text-xs text-gray-400 mb-1 mt-3">Badge color</label>
                      <select
                        value={q.badgeColor}
                        onChange={(e) => {
                          const next = dqList.map((x, i) => i === idx ? { ...x, badgeColor: e.target.value as any } : x);
                          updateDiagnosticQuestions(dqProspectType, next);
                        }}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="situation">Blue</option>
                        <option value="timeline">Red</option>
                        <option value="authority">Purple</option>
                        <option value="pain">Orange</option>
                        <option value="financial">Green</option>
                      </select>

                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            const next = dqList.filter((_, i) => i !== idx);
                            updateDiagnosticQuestions(dqProspectType, next);
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* AI Generation Section */}
            <div className="mt-6 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Question Generator
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Describe what questions you need (e.g., "5 questions to qualify a foreclosure prospect's financial situation")
                  </label>
                  <textarea
                    value={aiGenerationPrompt}
                    onChange={(e) => setAiGenerationPrompt(e.target.value)}
                    placeholder="Example: Generate 5 questions to understand their motivation for selling and timeline urgency..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none min-h-[80px] text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={generateQuestionsWithAI}
                    disabled={isGeneratingQuestions || !aiGenerationPrompt.trim()}
                    className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg text-purple-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Questions
                      </>
                    )}
                  </button>
                  <div className="text-xs text-gray-500">
                    AI will generate questions for: <span className="text-purple-300">{prospectTypes.find(pt => pt.id === dqProspectType)?.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const next = [
                    ...dqList,
                    { question: 'New question...', helper: 'Why this matters...', badgeText: 'Financial', badgeColor: 'financial' as const }
                  ];
                  updateDiagnosticQuestions(dqProspectType, next);
                }}
                className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 rounded-lg text-cyan-200 text-sm font-medium"
              >
                Add question
              </button>
              <div className="text-xs text-gray-500">
                Changes are saved when you click <span className="text-gray-300">Save Settings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Error */}
        {saveError && (
          <div className="mt-8 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{saveError}</span>
          </div>
        )}

        {/* Settings Summary */}
        <div className="mt-8 backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Current Configuration Summary</h3>
            {lastSaved && (
              <span className="text-sm text-gray-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/40 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Pillar Weights</div>
              <div className="text-white font-mono text-sm">
                {settings.pillarWeights.map(p => `${p.id}:${p.weight}`).join(' | ')}
              </div>
            </div>
            <div className="p-4 bg-gray-800/40 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Custom Prompt</div>
              <div className="text-amber-400 text-sm truncate">
                {settings.customScriptPrompt || '(Not set)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
