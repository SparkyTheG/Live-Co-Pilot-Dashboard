import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Circle, Target, Gauge, Sparkles, Shield } from 'lucide-react';
import { ProspectType } from '../data/coPilotData';
import { diagnosticQuestions } from '../data/diagnosticQuestions';
import { useSettings } from '../contexts/SettingsContext';
import TopObjections from './TopObjections';
import RecordingButton from './coPilot/RecordingButton';


interface AnalysisData {
  prospectType?: string;
  lubometer?: {
    score: number;
    level: string;
    interpretation: string;
    action: string;
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
  const [prospectType, setProspectType] = useState<ProspectType>('foreclosure');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [questionStates, setQuestionStates] = useState<Record<number, { asked: boolean }>>({});
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const { settings } = useSettings();

  // Accumulated history for hot buttons and objections (persists across updates)
  const [hotButtonsHistory, setHotButtonsHistory] = useState<Array<{
    id: number;
    name: string;
    description?: string;
    quote: string;
    score: number;
    prompt: string;
    timestamp: number;
  }>>([]);
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
  const MAX_HOT_BUTTONS_HISTORY = 25;
  const MAX_OBJECTIONS_HISTORY = 25;

  // Reset asked questions and best scores when prospect type changes (different questions for different types)
  useEffect(() => {
    const newSet = new Set<number>();
    setAskedQuestionsHistory(newSet);
    askedQuestionsRef.current = newSet;
    setQuestionStates({});
  }, [prospectType]);

  // Sync ref with state whenever state changes
  useEffect(() => {
    askedQuestionsRef.current = askedQuestionsHistory;
  }, [askedQuestionsHistory]);

  // Get questions for this prospect type (render + validation)
  // IMPORTANT: Dashboard renderer expects { question, why, category }.
  // Settings editor stores { question, helper, badgeText, badgeColor }.
  const questionsFromSettings = settings.diagnosticQuestionsByProspectType?.[prospectType];
  const questions = (Array.isArray(questionsFromSettings) && questionsFromSettings.length > 0)
    ? questionsFromSettings.map((q: any) => ({
        question: String(q?.question || ''),
        why: String(q?.helper || ''),
        // Use badgeColor as the category key for styling
        category: (q?.badgeColor || 'situation'),
        // Use explicit badge text if provided
        badgeText: String(q?.badgeText || '')
      }))
    : diagnosticQuestions[prospectType];

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

    // Accumulate hot buttons (avoid duplicates by ID, keep most recent)
    // DEFENSIVE: Ensure hotButtons is always an array
    const hotButtonsArray = Array.isArray(analysis.hotButtons) ? analysis.hotButtons :
      (typeof analysis.hotButtons === 'object' && analysis.hotButtons !== null) ? [] : [];

    if (hotButtonsArray.length > 0) {
      setHotButtonsHistory(prev => {
        const merged = [...prev];
        
        for (const newItem of hotButtonsArray) {
          const cleanedQuote = cleanQuote(newItem.quote);
          
          // Find exact match by ID AND quote (prevent duplicates from same statement)
          const existingIdx = merged.findIndex(h => 
            h.id === newItem.id && 
            h.quote.toLowerCase().trim() === cleanedQuote.toLowerCase().trim()
          );
          
          if (existingIdx >= 0) {
            // Update existing item: keep original timestamp, update score if higher
            const existing = merged[existingIdx];
            if (newItem.score > existing.score) {
              merged[existingIdx] = {
                ...existing,
                score: newItem.score,
                // Keep original timestamp so order doesn't change
                timestamp: existing.timestamp
              };
            }
          } else {
            // Check if this is a duplicate quote with different ID (same statement, different detection)
            const duplicateIdx = merged.findIndex(h => 
              h.quote.toLowerCase().trim() === cleanedQuote.toLowerCase().trim()
            );
            
            if (duplicateIdx < 0) {
              // Truly new item - add with current timestamp at the top
              merged.unshift({
                ...newItem,
                quote: cleanedQuote,
                timestamp: now
              });
          }
            // If duplicate by quote, ignore it completely
          }
        }
        
        // Never remove old items - only cap if we exceed max
        // Sort by timestamp (newest first) for display, but keep all up to max
        const sorted = merged.sort((a, b) => b.timestamp - a.timestamp);
        const capped = sorted.slice(0, MAX_HOT_BUTTONS_HISTORY);
        
        return capped;
      });
    }

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

    // Update prospect type if detected differently
    if (analysis.prospectType && analysis.prospectType !== prospectType) {
      setProspectType(analysis.prospectType as ProspectType);
    }
  }, [prospectType]);

  // Helper function to clean up stuttering/repeated words from speech-to-text
  const cleanQuote = (text: string): string => {
    if (!text) return '';
    // Remove excessive repetitions (more than 2 consecutive identical words)
    const words = text.split(/\s+/);
    const cleaned: string[] = [];
    let lastWord = '';
    let repeatCount = 0;

    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (lowerWord === lastWord.toLowerCase()) {
        repeatCount++;
        if (repeatCount < 2) {
          cleaned.push(word);
        }
      } else {
        cleaned.push(word);
        lastWord = word;
        repeatCount = 0;
      }
    }

    // Limit quote length to 150 chars
    const result = cleaned.join(' ');
    return result.length > 150 ? result.substring(0, 147) + '...' : result;
  };

  // Get asked questions from accumulated history (persists across updates)
  // Use ref to get latest value (avoids stale state during renders)
  // Fallback to state if ref is empty (shouldn't happen, but defensive)
  const askedQuestionIndices = Array.from(
    askedQuestionsRef.current.size > 0 ? askedQuestionsRef.current : askedQuestionsHistory
  );

  // Use real analysis data only - no mock/calculated fallbacks

  // Only use real lubometer score from analysis
  // Use dynamic maxScore from backend (defaults to 90 if not provided)
  const lubometerMaxScore = analysisData?.lubometer?.maxScore || 90;
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
                prospectType={prospectType}
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
              />

              {/* Live transcript (from backend) - Scrollable */}
              <div className="max-w-[520px] px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">Live transcript (backend) - scroll to view all</div>
                <div className="text-sm text-gray-200 leading-snug max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {liveTranscript || 'Waiting for speech…'}
                </div>
              </div>

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

              <select
                value={prospectType}
                onChange={(e) => {
                  setProspectType(e.target.value as ProspectType);
                }}
                className="bg-gray-800 text-white px-6 py-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg font-medium"
              >
                <option value="foreclosure">Foreclosure</option>
                <option value="creative-seller-financing">Creative Seller Finance</option>
                <option value="distressed-landlord">Distressed Landlord</option>
                <option value="performing-tired-landlord">Tired Landlord</option>
                <option value="cash-equity-seller">Cash Equity Seller</option>
              </select>
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

              {/* Readiness Score */}
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold bg-gradient-to-r ${lubometerColor.gradient} bg-clip-text text-transparent mb-2`}>
                  {lubometerScore}
                </div>
                <div className={`text-xl font-bold ${lubometerColor.text} mb-2`}>{lubometerLevel}</div>
                <div className="text-gray-300 text-sm">
                  {lubometerText}
                </div>
              </div>

              {/* Readiness Bar */}
              <div className="w-full bg-gray-800/50 rounded-full h-4 overflow-hidden mb-6">
                <div
                  className={`h-full bg-gradient-to-r ${lubometerColor.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, (lubometerScore / lubometerMaxScore) * 100)}%` }}
                ></div>
              </div>

              {/* Action Section */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-4">
                <h4 className="text-blue-300 font-bold text-sm mb-2">Action</h4>
                <p className="text-gray-300 text-sm">
                  {analysisData?.lubometer?.action || 'Start recording to get real-time action recommendations...'}
                </p>
              </div>
            </div>

            {/* Hot Buttons */}
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-7 h-7 text-cyan-400" />
                    <div className="absolute inset-0 blur-md bg-cyan-400/30"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Hot Buttons</h3>
                </div>
                {hotButtonsHistory.length > 0 && (
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                    {hotButtonsHistory.length} detected
                  </span>
                )}
              </div>

              <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {hotButtonsHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-2">No hot buttons detected yet.</p>
                    <p className="text-sm">Start recording to analyze conversation and detect all 27 indicators.</p>
                  </div>
                ) : (
                  hotButtonsHistory.map((hotButton, idx) => {
                    // Color based on indicator ID ranges (grouped by pillar)
                    const colors = [
                      { bg: 'from-blue-600/20 via-cyan-600/15 to-blue-700/20', border: 'border-cyan-400/40', text: 'text-cyan-400' }, // P1 (1-4)
                      { bg: 'from-teal-600/20 via-emerald-600/15 to-teal-700/20', border: 'border-teal-400/40', text: 'text-teal-300' }, // P2 (5-8)
                      { bg: 'from-emerald-600/20 via-green-600/15 to-emerald-700/20', border: 'border-emerald-400/40', text: 'text-emerald-300' }, // P3 (9-12)
                      { bg: 'from-purple-600/20 via-pink-600/15 to-purple-700/20', border: 'border-purple-400/40', text: 'text-purple-300' }, // P4 (13-16)
                      { bg: 'from-orange-600/20 via-red-600/15 to-orange-700/20', border: 'border-orange-400/40', text: 'text-orange-300' }, // P5 (17-20)
                      { bg: 'from-yellow-600/20 via-amber-600/15 to-yellow-700/20', border: 'border-yellow-400/40', text: 'text-yellow-300' }, // P6 (21-23)
                      { bg: 'from-indigo-600/20 via-blue-600/15 to-indigo-700/20', border: 'border-indigo-400/40', text: 'text-indigo-300' } // P7 (24-27)
                    ];
                    const pillarIndex = Math.floor((hotButton.id - 1) / 4) % 7;
                    const colorSet = colors[pillarIndex] || colors[0];

                    return (
                      <div
                        key={`${hotButton.id}-${idx}`}
                        className={`bg-gradient-to-br ${colorSet.bg} border ${colorSet.border} rounded-lg p-4 shadow-lg`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`${colorSet.text} font-bold text-xs tracking-wide`}>
                            #{hotButton.id} {hotButton.name}
                          </div>
                          <div className={`${colorSet.text} text-xs font-semibold`}>
                            Score: {hotButton.score?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        {hotButton.description && (
                          <p className="text-gray-300 text-xs mb-2">
                            {hotButton.description}
                          </p>
                        )}
                        <p className="text-gray-100 text-sm italic font-medium mb-2 line-clamp-3">
                          "{hotButton.quote}"
                        </p>
                        {hotButton.prompt && (
                          <p className="text-gray-300 text-xs mt-2 italic">
                            💡 {hotButton.prompt}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Intel */}
          <div className="space-y-6">
            <TopObjections
              realTimeObjections={objectionsHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
