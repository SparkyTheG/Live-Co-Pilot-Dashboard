/**
 * Main Analysis Engine - Multi-Agent Architecture
 * 
 * Uses 6 specialized AI agents running in PARALLEL for faster analysis:
 * 1. Pillars Agent - Scores 27 indicators (used for Lubometer calculation)
 * 2. Hot Buttons Agent - Extracts emotional triggers with quotes
 * 3. Objections Agent - Detects objections with rebuttals
 * 4. Diagnostic Questions Agent - Tracks which questions were asked
 * 5. Truth Index Agent - Analyzes coherence signals
 * 6. Insights Agent - Generates overall analysis summary
 * 
 * Lubometer and Truth Index CALCULATIONS are done locally (math, not AI)
 * from the Pillars Agent's indicator scores.
 */

import { analyzePillars } from './pillars.js';
import { calculateLubometer } from './lubometer.js';
import { calculateTruthIndex } from './truthIndex.js';
import { extractHotButtons } from './hotButtons.js';
import { detectObjections } from './objections.js';
import { detectProspectType } from './prospectType.js';
import { loadProspectFile } from './prospectFiles.js';
import { detectAskedDiagnosticQuestions } from './diagnosticQuestions.js';
import { runAllAgents } from './aiAgents.js';

// Simple in-memory cache to avoid duplicate API calls
const analysisCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache
const MAX_CACHE_SIZE = 50;

// Debounce tracker
let lastAnalysisTime = 0;
const MIN_ANALYSIS_INTERVAL = 2000; // Minimum 2 seconds between AI analyses

/**
 * Main analysis function - orchestrates parallel AI agents
 * @param {string} transcript - The conversation transcript
 * @param {string|null} prospectTypeOverride - Override the detected prospect type
 * @param {string} customScriptPrompt - Custom prompt from admin settings for rebuttal scripts
 * @param {Array|null} pillarWeights - Custom pillar weights from Admin Panel [{id: 'P1', weight: 1.5}, ...]
 */
export async function analyzeConversation(transcript, prospectTypeOverride = null, customScriptPrompt = '', pillarWeights = null) {
  const startTime = Date.now();

  if (!transcript || transcript.trim().length === 0) {
    return getEmptyAnalysis();
  }

  // Clean transcript early for cache key
  const cleanedTranscript = cleanTranscriptForAI(transcript);
  const lowerTranscript = transcript.toLowerCase();

  // 1. Detect or use provided prospect type
  const prospectType = prospectTypeOverride || detectProspectType(lowerTranscript);

  // Create cache key from transcript hash + prospect type + pillar weights hash
  const weightsHash = pillarWeights ? simpleHash(JSON.stringify(pillarWeights)) : 'default';
  const cacheKey = `${prospectType}:${weightsHash}:${simpleHash(cleanedTranscript)}`;

  // Check cache first (avoid duplicate API calls for same content)
  const cached = analysisCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[Engine] Cache hit, returning cached result (${Date.now() - startTime}ms)`);
    return { ...cached.result, fromCache: true };
  }

  // Debounce: skip if too soon after last analysis
  const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
  if (timeSinceLastAnalysis < MIN_ANALYSIS_INTERVAL) {
    console.log(`[Engine] Debouncing, too soon since last analysis (${timeSinceLastAnalysis}ms < ${MIN_ANALYSIS_INTERVAL}ms)`);
    if (cached) {
      return { ...cached.result, fromCache: true, debounced: true };
    }
  }

  lastAnalysisTime = Date.now();

  // 2. Run all 6 AI agents in PARALLEL
  console.log(`\n[Engine] ====== STARTING MULTI-AGENT ANALYSIS ======`);
  console.log(`[Engine] Prospect Type: ${prospectType}`);
  console.log(`[Engine] Transcript length: ${cleanedTranscript.length} chars`);
  
  let aiAnalysis;
  try {
    aiAnalysis = await Promise.race([
      runAllAgents(cleanedTranscript, prospectType, customScriptPrompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Multi-agent timeout')), 15000))
    ]);
  } catch (error) {
    console.error(`[Engine] CRITICAL: Multi-agent analysis failed: ${error.message}`);
    // Return empty analysis but don't crash
    return getEmptyAnalysis();
  }

  const result = await buildFinalResultFromAiAnalysis({
    cleanedTranscript,
    lowerTranscript,
    prospectType,
    pillarWeights,
    aiAnalysis,
    startTime
  });

  // Cache the result
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  analysisCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

/**
 * Build the final analysis object from a precomputed aiAnalysis object.
 * This allows alternative upstream AI (e.g. Realtime single-session) to produce
 * indicatorSignals/hotButtonDetails/objections/etc, while we keep deterministic
 * Lubometer + Truth Index calculations and frontend payload shape.
 */
export async function analyzeConversationFromAiAnalysis(transcript, prospectTypeOverride = null, pillarWeights = null, aiAnalysis) {
  const startTime = Date.now();
  if (!transcript || transcript.trim().length === 0) return getEmptyAnalysis();

  const cleanedTranscript = cleanTranscriptForAI(transcript);
  const lowerTranscript = transcript.toLowerCase();
  const prospectType = prospectTypeOverride || detectProspectType(lowerTranscript);

  return buildFinalResultFromAiAnalysis({
    cleanedTranscript,
    lowerTranscript,
    prospectType,
    pillarWeights,
    aiAnalysis,
    startTime
  });
}

async function buildFinalResultFromAiAnalysis({ cleanedTranscript, lowerTranscript, prospectType, pillarWeights, aiAnalysis, startTime }) {
  // Log agent results summary
  console.log(`[Engine] Agent Results Summary:`);
  console.log(`  - Pillars: ${Object.keys(aiAnalysis.indicatorSignals || {}).length} indicators scored`);
  console.log(`  - Hot Buttons: ${(aiAnalysis.hotButtonDetails || []).length} detected`);
  console.log(`  - Objections: ${(aiAnalysis.objections || []).length} detected`);
  console.log(`  - Diagnostic Questions: ${(aiAnalysis.askedQuestions || []).length} asked`);
  console.log(`  - Truth Index: ${aiAnalysis.overallCoherence || 'unknown'} coherence`);
  console.log(`  - Insights: ${aiAnalysis.closingReadiness || 'unknown'} readiness`);

  // 3. Calculate Pillars from AI indicator scores
  const pillarScores = await analyzePillars(lowerTranscript, prospectType, aiAnalysis);

  // 4. Calculate Truth Index (uses pillar scores + AI-detected rules)
  // Pass AI Truth Index result so it can detect T4 (Claims Authority + Reveals Need for Approval)
  // which requires conversation analysis, not just indicator scores
  const aiTruthIndexResult = {
    detectedRules: aiAnalysis.detectedRules || [],
    coherenceSignals: aiAnalysis.coherenceSignals || [],
    overallCoherence: aiAnalysis.overallCoherence || 'medium'
  };
  const truthIndex = calculateTruthIndex(pillarScores, lowerTranscript, aiTruthIndexResult);

  // 5. Calculate Lubometer (uses pillar scores + truth index penalties + custom weights)
  const lubometer = calculateLubometer(pillarScores, pillarWeights);

  // 6. Extract Hot Buttons (uses AI hot button details)
  let hotButtons = extractHotButtons(lowerTranscript, prospectType, aiAnalysis, pillarScores);
  if (!Array.isArray(hotButtons)) {
    hotButtons = [];
  }

  // 7. Detect Objections (uses AI objections)
  let objections = detectObjections(lowerTranscript, prospectType, aiAnalysis);
  if (!Array.isArray(objections)) {
    objections = [];
  }

  // 8. Get diagnostic questions status (uses AI detected questions)
  const diagnosticQuestions = detectAskedDiagnosticQuestions(lowerTranscript, prospectType, aiAnalysis);

  // 9. Build final result
  const result = {
    prospectType,
    lubometer: {
      score: lubometer.score,
      maxScore: lubometer.maxScore || 90,
      level: lubometer.level,
      interpretation: lubometer.interpretation,
      action: lubometer.action,
      pillarScores: lubometer.pillarScores,
      weightsUsed: lubometer.weightsUsed,
      weightedScores: lubometer.weightedScores,
      totalBeforePenalties: lubometer.totalBeforePenalties,
      penalties: lubometer.penalties
    },
    truthIndex: {
      score: truthIndex.score,
      signals: truthIndex.signals,
      redFlags: truthIndex.redFlags,
      penalties: truthIndex.penalties
    },
    pillars: pillarScores,
    hotButtons: Array.isArray(hotButtons) ? hotButtons : [],
    objections: Array.isArray(objections) ? objections : [],
    dials: extractDials(),
    diagnosticQuestions,
    // Enhanced AI insights from dedicated agent
    aiInsights: {
      summary: aiAnalysis.insights || '',
      keyMotivators: aiAnalysis.keyMotivators || [],
      concerns: aiAnalysis.concerns || [],
      recommendation: aiAnalysis.recommendation || '',
      closingReadiness: aiAnalysis.closingReadiness || 'not_ready',
      agentErrors: aiAnalysis.agentErrors || {}
    },
    timestamp: new Date().toISOString()
  };

  console.log(`[Engine] ====== ANALYSIS COMPLETE in ${Date.now() - startTime}ms ======\n`);

  // Final defensive check
  if (!Array.isArray(result.hotButtons)) {
    result.hotButtons = [];
  }
  if (!Array.isArray(result.objections)) {
    result.objections = [];
  }

  return result;
}

// Simple hash function for cache keys
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Clean transcript by removing stuttering, repeated words/phrases from speech-to-text
 */
function cleanTranscriptForAI(transcript) {
  if (!transcript) return '';

  // Split into words
  const words = transcript.split(/\s+/);
  const cleaned = [];
  let i = 0;

  while (i < words.length) {
    const word = words[i];

    // Check for repeated words (allow max 1 repeat)
    let j = i + 1;
    while (j < words.length && words[j].toLowerCase() === word.toLowerCase()) {
      j++;
    }

    // Add the word (only once, even if repeated)
    cleaned.push(word);

    // Skip all repetitions
    i = j;
  }

  // Join and clean up extra spaces
  let result = cleaned.join(' ');

  // Remove common speech-to-text artifacts
  result = result.replace(/\b(um|uh|er|ah)\b/gi, '');
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * Extract dials - now derived from pillar scores in UI, not here
 */
function extractDials() {
  return {
    urgency: '',
    trust: '',
    authority: '',
    structure: ''
  };
}

/**
 * Returns empty analysis structure
 */
function getEmptyAnalysis() {
  return {
    prospectType: 'creative-seller-financing',
    lubometer: {
      score: 0,
      level: 'low',
      interpretation: 'No conversation data available',
      action: 'Start conversation to begin analysis'
    },
    truthIndex: {
      score: 45,
      signals: [],
      redFlags: [],
      penalties: []
    },
    pillars: {},
    hotButtons: [],
    objections: [],
    dials: {
      urgency: '',
      trust: '',
      authority: '',
      structure: ''
    },
    diagnosticQuestions: {
      asked: [],
      total: 20,
      completion: 0
    },
    aiInsights: {
      summary: '',
      keyMotivators: [],
      concerns: [],
      recommendation: '',
      closingReadiness: 'not_ready',
      agentErrors: {}
    },
    timestamp: new Date().toISOString()
  };
}
