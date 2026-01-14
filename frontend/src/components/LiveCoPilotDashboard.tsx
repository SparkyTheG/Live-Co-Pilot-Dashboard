import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Circle, Target, Gauge, Shield, Mic } from 'lucide-react';
import { StrategyType, strategyOptions, strategyData } from '../data/coPilotData';
import { useSettings } from '../contexts/SettingsContext';
import TopObjections from './TopObjections';
import HotButtons from './HotButtons';
import RecordingButton from './coPilot/RecordingButton';


interface AnalysisData {
  prospectType?: string;
  lubometer?: {
    score: number;
    level: string;
    interpretation: string;
    action: string;
    maxScore?: number;
  };
  truthIndex?: {
    score: number;
    signals: string[];
    redFlags: string[];
    penalties: Array<{
      rule: string;
      description: string;
      penalty: number;
      details: string;
    }>;
  };
  hotButtons?: Array<{
    id: number;
    name: string;
    description?: string;
    quote: string;
    score: number;
    prompt: string;
  }>;
  emotionalLevers?: {
    riskTolerance?: number;
    fearOfFailure?: number;
    urgency?: number;
    familyPressure?: number;
    desireForCertainty?: number;
  };
  objections?: Array<{
    objectionText: string;
    fear: string;
    whisper: string;
    probability: number;
    rebuttalScript: string;
  }>;
  dials?: {
    urgency: string;
    trust: string;
    authority: string;
    structure: string;
  };
  diagnosticQuestions?: {
    asked: number[]; // Array of question indices that were asked
    total: number;
    completion: number;
  };
}

export default function LiveCoPilotDashboard() {
  const [strategy, setStrategy] = useState<StrategyType>('subject-to');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [questionStates, setQuestionStates] = useState<Record<number, { asked: boolean }>>({});
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState<string>('00:00:00');
  const { settings } = useSettings();

  // Accumulated history for objections (persists across updates)
  const [objectionsHistory, setObjectionsHistory] = useState<Array<{
    objectionText: string;
    fear: string;
    whisper: string;
    probability: number;
    rebuttalScript: string;
    timestamp: number;
  }>>([]);

  // Accumulated asked questions (persists across updates - prevents unticking)
  const [askedQuestionsHistory, setAskedQuestionsHistory] = useState<Set<number>>(new Set());
  // Use ref to track latest value (avoids stale closure issues)
  const askedQuestionsRef = useRef<Set<number>>(new Set());

  // Prevent unbounded growth during long sessions
  const MAX_OBJECTIONS_HISTORY = 25;

  // Reset asked questions and best scores when strategy changes (different questions for different strategies)
  useEffect(() => {
    const newSet = new Set<number>();
    setAskedQuestionsHistory(newSet);
    askedQuestionsRef.current = newSet;
    setQuestionStates({});
    // Reset objections history when strategy changes
    setObjectionsHistory([]);
  }, [strategy]);

  // Sync ref with state whenever state changes
  useEffect(() => {
    askedQuestionsRef.current = askedQuestionsHistory;
  }, [askedQuestionsHistory]);

  // Call timer - updates every second when call is active
  useEffect(() => {
    if (!isCallActive || !callStartTime) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - callStartTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      setCallDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  // Get questions based on strategy (simplified - we'll use a generic set for now)
  // For strategies, we use a simplified question set focused on the deal structure
  const getQuestionsForStrategy = (strat: StrategyType) => {
    const baseQuestions = [
      { question: 'What\'s motivating this decision right now?', why: 'Understand urgency and pain points', category: 'situation', badgeText: 'Motivation' },
      { question: 'What\'s your timeline for making this happen?', why: 'Establish urgency', category: 'timeline', badgeText: 'Timeline' },
      { question: 'Who else needs to be involved in this decision?', why: 'Identify decision makers', category: 'authority', badgeText: 'Authority' },
      { question: 'What concerns do you have about this approach?', why: 'Surface objections early', category: 'pain', badgeText: 'Concerns' },
    ];
    
    if (strat === 'lease-purchase') {
      return [
        ...baseQuestions,
        { question: 'What\'s preventing you from qualifying for traditional financing right now?', why: 'Understand credit situation', category: 'financial', badgeText: 'Credit Status' },
        { question: 'How soon do you want to move in and start building equity?', why: 'Establish move-in timeline', category: 'timeline', badgeText: 'Move-in Date' },
      ];
    } else if (strat === 'subject-to') {
      return [
        ...baseQuestions,
        { question: 'How far behind are you on payments?', why: 'Assess urgency and foreclosure risk', category: 'financial', badgeText: 'Payment Status' },
        { question: 'What would happen if you can\'t resolve this soon?', why: 'Amplify consequences', category: 'pain', badgeText: 'Consequences' },
      ];
    } else { // seller-finance
      return [
        ...baseQuestions,
        { question: 'What monthly payment would make this attractive to you?', why: 'Understand income needs', category: 'financial', badgeText: 'Income Goal' },
        { question: 'Have you spoken with a CPA about installment sale benefits?', why: 'Surface tax concerns', category: 'authority', badgeText: 'Tax Planning' },
      ];
    }
  };
  
  const questions = getQuestionsForStrategy(strategy);

  // Extract analysis update handler so it can be reused
  const handleAnalysisUpdate = useCallback((analysis: any) => {
    // Update state with real-time analysis from backend
    console.log('✅ Frontend: Analysis update received:', {
      hotButtons: analysis.hotButtons?.length || 0,
      objections: analysis.objections?.length || 0,
      lubometer: analysis.lubometer?.score,
      truthIndex: analysis.truthIndex?.score
    });

    const now = Date.now();

    // Accumulate objections (avoid duplicates by text similarity)
    // DEFENSIVE: Ensure objections is always an array
    const objectionsArray = Array.isArray(analysis.objections) ? analysis.objections :
      (typeof analysis.objections === 'object' && analysis.objections !== null) ? [] : [];

    // Helper: Check if two objections are semantically similar
    const areSimilarObjections = (text1: string, text2: string): boolean => {
      const normalize = (txt: string) => 
        String(txt || '')
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // remove punctuation
          .replace(/\s+/g, ' ')
          .trim();
      
      const t1 = normalize(text1);
      const t2 = normalize(text2);
      
      // Exact match after normalization
      if (t1 === t2) return true;
      
      // Extract key words (ignore common filler words)
      const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 
        'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 
        'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
        'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
        'some', 'such', 'to', 'of', 'in', 'for', 'on', 'with', 'as', 'by', 'from', 'at',
        'prospect', 'your', 'my', 'thinks', 'seem', 'seems', 'kind', 'really']);
      
      const getKeyWords = (txt: string) => 
        txt.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
      
      const words1 = new Set(getKeyWords(t1));
      const words2 = new Set(getKeyWords(t2));
      
      if (words1.size === 0 || words2.size === 0) return false;
      
      // Count overlapping key words
      let overlap = 0;
      for (const word of words1) {
        if (words2.has(word)) overlap++;
      }
      
      // If 70%+ of key words overlap, consider them similar
      const similarity = overlap / Math.min(words1.size, words2.size);
      return similarity >= 0.7;
    };

    if (objectionsArray.length > 0) {
      setObjectionsHistory(prev => {
        const merged = [...prev];
        
        for (const newItem of objectionsArray) {
          // Find similar objection (exact or semantic match)
          const existingIdx = merged.findIndex(o => 
            areSimilarObjections(o.objectionText, newItem.objectionText)
          );

          if (existingIdx >= 0) {
            // Update existing item: preserve original timestamp, allow scripts to arrive later
            const existing = merged[existingIdx];
            const pickNew = (prevVal: any, nextVal: any) => {
              const prev = String(prevVal || '').trim();
              const next = String(nextVal || '').trim();
              // Allow real values to overwrite empty/placeholder values
              if (next && (next !== 'Generating...' && next !== prev)) return next;
              return prev;
            };
            
            merged[existingIdx] = {
              ...existing,
              // Keep highest probability seen
              probability: Math.max(Number(existing.probability || 0), Number(newItem.probability || 0)),
              // Fill/update fields as they arrive (scripts can arrive later)
              fear: pickNew(existing.fear, newItem.fear),
              whisper: pickNew(existing.whisper, newItem.whisper),
              rebuttalScript: pickNew(existing.rebuttalScript, newItem.rebuttalScript),
              // IMPORTANT: Keep original timestamp so order doesn't jump around
              timestamp: existing.timestamp
            };
          } else {
            // Truly new objection - add at the top with current timestamp
            merged.unshift({
              ...newItem,
              timestamp: now
            });
          }
        }
        
        // Never remove old items - only cap if we exceed max
        // Sort by timestamp (newest first) for display
        const sorted = merged.sort((a, b) => b.timestamp - a.timestamp);
        const capped = sorted.slice(0, MAX_OBJECTIONS_HISTORY);
        
        return capped;
      });
    }

    // Diagnostic Questions are user-controlled now (no AI auto-detection).

    // Merge partial updates: backend may send incremental analysis_update payloads.
    // IMPORTANT: do NOT overwrite existing state with empty arrays for partial updates.
    const currentAskedArray = Array.from(askedQuestionsRef.current).sort((a, b) => a - b);

    const sanitizedPatch: any = {
      ...analysis
    };
    if (Array.isArray(analysis.hotButtons)) sanitizedPatch.hotButtons = analysis.hotButtons;
    if (Array.isArray(analysis.objections)) sanitizedPatch.objections = analysis.objections;

    setAnalysisData(prev => {
      const merged = {
        ...(prev || {}),
        ...sanitizedPatch,
      };

      // Always keep diagnostic questions in a stable shape and preserve asked history.
      merged.diagnosticQuestions = {
        ...(merged.diagnosticQuestions || {}),
        asked: currentAskedArray,
        total: merged.diagnosticQuestions?.total || questions.length,
        completion: merged.diagnosticQuestions?.completion || 0
    };

      return merged;
    });

    // Note: Strategy is now manually selected by user, not auto-detected
  }, [strategy]);


  // Get asked questions from accumulated history (persists across updates)
  // Use ref to get latest value (avoids stale state during renders)
  // Fallback to state if ref is empty (shouldn't happen, but defensive)
  const askedQuestionIndices = Array.from(
    askedQuestionsRef.current.size > 0 ? askedQuestionsRef.current : askedQuestionsHistory
  );

  // Use real analysis data only - no mock/calculated fallbacks

  // Calculate maxScore from pillar weights (so it updates immediately when weights change in Admin Panel)
  const calculateMaxScoreFromWeights = () => {
    const weights = settings.pillarWeights || [];
    let maxScore = 0;
    for (const pillar of weights) {
      maxScore += (pillar.weight || 1) * 10;
    }
    return Math.round(maxScore) || 90; // Fallback to 90 if weights are missing
  };

  // Only use real lubometer score from analysis
  // Use maxScore from backend analysis if available, otherwise calculate from current weights
  const lubometerMaxScore = analysisData?.lubometer?.maxScore || calculateMaxScoreFromWeights();
  const lubometerScoreRaw = analysisData?.lubometer?.score ?? 0;
  const completionPercentage = lubometerScoreRaw > 0
    ? Math.round((lubometerScoreRaw / lubometerMaxScore) * 100)
    : 0;

  // Use stabilized truth index score for display (prevents wild fluctuations)
  const truthScore = analysisData?.truthIndex?.score ?? 0;

  // Calculate Lubometer level - use real analysis data only
  const getLubometerLevel = () => {
    if (analysisData?.lubometer?.level) {
      return analysisData.lubometer.level.toUpperCase();
    }
    return 'WAITING';
  };

  const getLubometerText = () => {
    if (analysisData?.lubometer?.interpretation) {
      return analysisData.lubometer.interpretation;
    }
    // No mock data - show default message
    return 'Ready for real-time analysis...';
  };

  const getLubometerColor = () => {
    const level = analysisData?.lubometer?.level?.toLowerCase() || 'waiting';
    if (level === 'high') {
      return { gradient: 'from-emerald-400 to-green-400', bar: 'from-emerald-500 to-green-500', text: 'text-emerald-400' };
    }
    if (level === 'medium') {
      return { gradient: 'from-cyan-400 to-teal-400', bar: 'from-cyan-500 to-teal-500', text: 'text-cyan-400' };
    }
    if (level === 'low') {
      return { gradient: 'from-blue-400 to-cyan-400', bar: 'from-blue-500 to-cyan-500', text: 'text-blue-400' };
    }
    // Default gray for waiting state
    return { gradient: 'from-gray-400 to-gray-500', bar: 'from-gray-500 to-gray-600', text: 'text-gray-400' };
  };

  const lubometerLevel = getLubometerLevel();
  const lubometerText = getLubometerText();
  const lubometerColor = getLubometerColor();
  const lubometerScore = analysisData?.lubometer?.score ?? 0;

  // (debug display removed)

  // Truth Index helpers for header display - only use real data
  const getTruthIndexColor = () => {
    if (!analysisData?.truthIndex) return 'from-gray-500 to-gray-400';
    if (truthScore >= 75) return 'from-emerald-500 to-green-400';
    if (truthScore >= 50) return 'from-cyan-500 to-teal-400';
    return 'from-blue-500 to-cyan-400';
  };

  const getTruthIndexLabel = () => {
    if (!analysisData?.truthIndex) return 'Waiting...';
    if (truthScore >= 75) return 'High Honesty';
    if (truthScore >= 50) return 'Moderate';
    return 'Low Honesty';
  };

  // Check if a question was asked based on AI analysis OR manual selection
  const isQuestionAsked = (index: number) => {
    return askedQuestionIndices.includes(index) || questionStates[index]?.asked;
  };

  // Badge colors must match Admin Panel "Badge color" dropdown:
  // situation=Blue, timeline=Red, authority=Purple, pain=Orange, financial=Green
  const categoryColors: Record<string, string> = {
    situation: 'text-blue-300 border-blue-400/30',
    timeline: 'text-red-300 border-red-400/30',
    authority: 'text-purple-300 border-purple-400/30',
    pain: 'text-orange-300 border-orange-400/30',
    financial: 'text-green-300 border-green-400/30',
  };

  const categoryLabels: Record<string, string> = {
    situation: 'Situation',
    timeline: 'Timeline',
    authority: 'Authority',
    pain: 'Pain Point',
    financial: 'Financial',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[1900px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6 backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Live Co-Pilot Dashboard</h1>
              <p className="text-gray-400">Ask questions, watch intel update in real-time</p>
            </div>
            <div className="flex items-center gap-6">
              {/* Recording Button */}
              <RecordingButton
                prospectType={strategy}
                onTranscriptUpdate={(t) => {
                  const next = (t || '').trim();
                  if (!next) return;
                  setLiveTranscript((prev) => {
                    // append with a separator unless it already ends with punctuation
                    const sep = prev && !/[.!?]$/.test(prev.trim()) ? ' • ' : ' ';
                    const combined = (prev ? prev + sep : '') + next;
                    // Increased from 600 to 3000 chars to keep more history
                    return combined.length > 3000 ? combined.slice(-3000) : combined;
                  });
                }}
                onAnalysisUpdate={handleAnalysisUpdate}
                onRecordingStateChange={(isRecording) => {
                  setIsCallActive(isRecording);
                  // Only set call start time if it's not already set (first time recording)
                  if (isRecording && !callStartTime) {
                    setCallStartTime(Date.now());
                    setCallDuration('00:00:00');
                  }
                  // Don't reset timer when stopping - let it persist for the session
                }}
              />

              {/* Truth Index Display */}
              <div className="flex items-center gap-3 px-5 py-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="relative">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <div className="absolute inset-0 blur-md bg-emerald-400/20"></div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Truth Index</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold bg-gradient-to-r ${getTruthIndexColor()} bg-clip-text text-transparent`}>
                      {analysisData?.truthIndex ? `${truthScore}%` : '--'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {getTruthIndexLabel()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strategy Selector */}
              <div className="relative">
                <div className="text-xs text-gray-400 mb-1 text-center">Deal Strategy</div>
                <select
                  value={strategy}
                  onChange={(e) => {
                    setStrategy(e.target.value as StrategyType);
                  }}
                  className="bg-gradient-to-r from-cyan-900/40 to-teal-900/40 text-white px-6 py-3 rounded-xl border-2 border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg font-bold shadow-lg shadow-cyan-500/20 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  {strategyOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  {analysisData ? completionPercentage : 0}%
                </div>
                <div className="text-sm text-gray-400">
                  {analysisData ? 'Analysis Active' : 'Ready for analysis'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Call Input Section */}
        <div className="mb-6 backdrop-blur-xl bg-gray-900/40 border-2 border-cyan-500/30 rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Listening Source */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Mic className={`w-8 h-8 ${isCallActive ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                {isCallActive && (
                  <div className="absolute inset-0 blur-lg bg-red-500/40 animate-pulse"></div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Listening From:</div>
                <div className={`text-2xl font-bold ${isCallActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {isCallActive ? 'Microphone' : 'Not Listening'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isCallActive ? 'Live transcription active' : 'Click mic button to start'}
                </div>
              </div>
            </div>

            {/* Call Timer */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div>
                <div className="text-sm text-gray-400 mb-1 text-center">Call Duration</div>
                <div className={`text-4xl font-bold font-mono ${isCallActive ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {callDuration}
                </div>
                {isCallActive && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-400 font-medium">RECORDING</span>
                  </div>
                )}
              </div>
              {callStartTime && !isCallActive && (
                <button
                  onClick={() => {
                    setCallStartTime(null);
                    setCallDuration('00:00:00');
                  }}
                  className="text-xs px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded transition-colors"
                  title="Reset call timer"
                >
                  Reset Timer
                </button>
              )}
            </div>

            {/* Real-time Transcript */}
            <div className="flex flex-col">
              <div className="text-sm text-gray-400 mb-2">Real-time Transcript:</div>
              <div className="flex-1 px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="text-sm text-gray-200 leading-relaxed">
                  {liveTranscript || (isCallActive ? 'Listening for speech...' : 'Start recording to see live transcript')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Three Column View */}
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: Diagnostic Questions */}
          <div>
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Target className="w-7 h-7 text-cyan-400" />
                    <div className="absolute inset-0 blur-md bg-cyan-400/30"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Diagnostic Questions</h2>
                </div>
                <button
                  onClick={() => {
                    // Reset all question states
                    setAskedQuestionsHistory(new Set());
                    askedQuestionsRef.current = new Set();
                    setQuestionStates({});
                  }}
                  className="text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded transition-colors"
                  title="Reset all questions"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No diagnostic questions available for this prospect type.
                  </div>
                ) : (
                  questions.map((q, idx) => {
                    const isAsked = isQuestionAsked(idx);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          // Allow manual toggle for user reference
                          // Also add to accumulated history to persist it
                          const newAskedState = !questionStates[idx]?.asked;
                          setQuestionStates(prev => ({
                            ...prev,
                            [idx]: { asked: newAskedState }
                          }));
                          // Add to accumulated history if being marked as asked
                          if (newAskedState) {
                            setAskedQuestionsHistory(prev => {
                              const newSet = new Set(prev);
                              newSet.add(idx);
                              askedQuestionsRef.current = newSet; // Update ref immediately
                              return newSet;
                            });
                            // Update analysisData to reflect the change
                            setAnalysisData(prev => {
                              const currentAsked = Array.from(askedQuestionsRef.current);
                              return {
                                ...prev,
                                diagnosticQuestions: {
                                  ...prev?.diagnosticQuestions,
                                  asked: currentAsked.length > 0 ? currentAsked : (prev?.diagnosticQuestions?.asked || []),
                                  total: prev?.diagnosticQuestions?.total || questions.length,
                                  completion: prev?.diagnosticQuestions?.completion || 0
                                }
                              } as any;
                            });
                          } else {
                            // Remove from history if being unmarked
                            setAskedQuestionsHistory(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(idx);
                              askedQuestionsRef.current = newSet; // Update ref immediately
                              return newSet;
                            });
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-gray-600/60 ${isAsked || questionStates[idx]?.asked
                            ? 'bg-cyan-500/10 border-cyan-500/50'
                            : 'bg-gray-800/40 border-gray-700/40'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            {(isAsked || questionStates[idx]?.asked) ? (
                              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium mb-2 text-lg ${(isAsked || questionStates[idx]?.asked) ? 'text-white' : 'text-gray-300'}`}>
                              {q.question}
                            </div>
                            {q.why && (
                            <div className="text-sm text-gray-400 mb-2 italic">{q.why}</div>
                            )}
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[q.category] || categoryColors.situation}`}>
                              {(q as any).badgeText || categoryLabels[q.category] || 'Category'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE: Lubometer & Hot Buttons */}
          <div className="space-y-6">
            {/* Lubometer */}
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Gauge className="w-7 h-7 text-emerald-400" />
                  <div className="absolute inset-0 blur-md bg-emerald-400/30"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Lubometer</h2>
                  <p className="text-sm text-gray-400">Prospect readiness level</p>
                </div>
              </div>

              {/* Probability of Close */}
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Probability of Close</div>
                <div className={`text-7xl font-bold bg-gradient-to-r ${lubometerColor.gradient} bg-clip-text text-transparent mb-3 transition-all duration-500`}>
                  {completionPercentage}%
                </div>
              </div>

              {/* Strategic Status Label */}
              <div className="text-center mb-6">
                <div className={`inline-block px-6 py-2 rounded-full border-2 ${lubometerColor.text} ${
                  lubometerLevel === 'HIGH' ? 'bg-emerald-500/10 border-emerald-400/50' :
                  lubometerLevel === 'MEDIUM' ? 'bg-cyan-500/10 border-cyan-400/50' :
                  'bg-blue-500/10 border-blue-400/50'
                }`}>
                  <div className={`text-lg font-bold ${lubometerColor.text}`}>
                    {completionPercentage >= 75 ? 'Ready — Push' :
                     completionPercentage >= 50 ? 'Warming Up — Build Value' :
                     completionPercentage >= 25 ? 'Too Cold — Build Trust' :
                     'Not Ready — Qualify First'}
                  </div>
                </div>
                <div className="text-gray-300 text-sm mt-3">
                  {lubometerText}
                </div>
              </div>

              {/* Giant Hypnotic Bar */}
              <div className="w-full bg-gray-800/50 rounded-full h-8 overflow-hidden mb-2 relative shadow-lg">
                <div
                  className={`h-full bg-gradient-to-r ${lubometerColor.bar} transition-all duration-500 relative overflow-hidden`}
                  style={{ width: `${Math.min(100, completionPercentage)}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                {/* Percentage text overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${completionPercentage > 50 ? 'text-white' : 'text-gray-400'}`}>
                    {lubometerScore} / {lubometerMaxScore}
                  </span>
                </div>
              </div>
              
              {/* Score labels */}
              <div className="flex justify-between text-xs text-gray-500 mb-6">
                <span>0%</span>
                <span className="text-yellow-400">25%</span>
                <span className="text-cyan-400">50%</span>
                <span className="text-emerald-400">75%</span>
                <span className="text-emerald-300">100%</span>
              </div>

              {/* Action Section */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-4">
                <h4 className="text-blue-300 font-bold text-sm mb-2">Action</h4>
                <p className="text-gray-300 text-sm">
                  {analysisData?.lubometer?.action || 'Start recording to get real-time action recommendations...'}
                </p>
              </div>
            </div>

            {/* Hot Buttons - Emotional Levers */}
            <HotButtons emotionalLevers={analysisData?.emotionalLevers} strategyHotButtons={strategyData[strategy].hotButtons} />
          </div>

          {/* RIGHT: Live Intel */}
          <div className="space-y-6">
            <TopObjections
              realTimeObjections={objectionsHistory}
              strategyObjections={strategyData[strategy].objections}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
