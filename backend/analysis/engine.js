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

import { runAllAgents } from './aiAgents.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ----------------------------------------------------------------------------
// Indicator metadata (for UI display)
// ----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field);
      field = '';
      // Skip completely empty rows
      if (row.some((c) => String(c || '').trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  // last field
  row.push(field);
  if (row.some((c) => String(c || '').trim().length > 0)) rows.push(row);
  return rows;
}

function loadIndicatorNamesFromCsv() {
  // Canonical source: "Indicators and Objection Matrix.csv"
  const csvPath = path.resolve(__dirname, '..', 'data', 'Copy of Zero-Stress Sales Logic - Dec 2025 V1 - Indicators and Objection Matrix.csv');
  try {
    const raw = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCsv(raw);
    if (!rows.length) return {};

    // Find header row containing required columns (some files start with blank lines)
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].map((c) => String(c || '').trim());
      if (r.includes('ID') && r.includes('Pillar & Indicator')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) return {};

    const header = rows[headerIdx].map((c) => String(c || '').trim());
    const idCol = header.indexOf('ID');
    const nameCol = header.indexOf('Pillar & Indicator');
    if (idCol < 0 || nameCol < 0) return {};

    const out = {};
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const id = Number(String(r[idCol] || '').trim());
      const name = String(r[nameCol] || '').trim();
      if (!Number.isFinite(id) || id < 1 || id > 27) continue;
      if (!name) continue;
      out[id] = { name };
    }
    return out;
  } catch (e) {
    console.warn('[Engine] Failed to load indicator names from CSV:', e?.message || e);
    return {};
  }
}

// Default descriptions (UI helper line). Names will be overwritten from CSV for accuracy.
const INDICATOR_META = (() => {
  const base = {
    1: { name: '', description: 'How severe is the prospect’s pain/problem?' },
    2: { name: '', description: 'Do they understand the root cause and consequences?' },
    3: { name: '', description: 'How specific is what they want instead?' },
    4: { name: '', description: 'How important is solving this right now?' },
    5: { name: '', description: 'Is there a real deadline driving urgency?' },
    6: { name: '', description: 'What do they lose by waiting longer?' },
    7: { name: '', description: 'Are they at a breaking point / “can’t keep doing this”?' },
    8: { name: '', description: 'Are they ready/able to take action now?' },
    9: { name: '', description: 'Are they the decision maker?' },
    10: { name: '', description: 'How quickly do they decide once convinced?' },
    11: { name: '', description: 'How committed are they to a next step?' },
    12: { name: '', description: 'Do they trust themselves to decide?' },
    13: { name: '', description: 'Do they have access to money/resources?' },
    14: { name: '', description: 'Can they reallocate money if needed?' },
    15: { name: '', description: 'Do they view it as investment vs cost?' },
    16: { name: '', description: 'Do they find ways when committed?' },
    17: { name: '', description: 'Do they acknowledge their role vs blaming others?' },
    18: { name: '', description: 'Are they taking responsibility to change it?' },
    19: { name: '', description: 'Do they believe they control outcomes?' },
    20: { name: '', description: 'Do their words match their actions?' },
    21: { name: '', description: 'Are they focused on price/discounts?' },
    22: { name: '', description: 'Do they question whether it’s worth it?' },
    23: { name: '', description: 'Are they comparing options to find cheaper/better?' },
    24: { name: '', description: 'Do they doubt the solution will work?' },
    25: { name: '', description: 'Do they ask for evidence, track record, guarantees?' },
    26: { name: '', description: 'Do they hesitate to trust you/process/offer?' },
    27: { name: '', description: 'Fear it won’t work for them / risk of failure.' }
  };

  const csvNames = loadIndicatorNamesFromCsv();
  for (const [idStr, v] of Object.entries(csvNames)) {
    const id = Number(idStr);
    if (!base[id]) base[id] = { name: '', description: '' };
    base[id] = { ...base[id], name: String(v?.name || '').trim() };
  }
  return base;
})();

function normalizeHotButtons(hotButtonDetails) {
  const arr = Array.isArray(hotButtonDetails) ? hotButtonDetails : [];
  return arr
    .map((hb) => {
      const idNum = Number(hb?.id);
      const id = Number.isFinite(idNum) ? idNum : 0;
      const meta = INDICATOR_META[id] || { name: '', description: '' };
      return {
        id,
        name: String(hb?.name || meta.name || ''),
        description: String(hb?.description || meta.description || ''),
        quote: String(hb?.quote || ''),
        score: Number(hb?.score ?? 0),
        // Back-compat: agent uses contextualPrompt; frontend expects prompt
        prompt: String(hb?.prompt || hb?.contextualPrompt || '')
      };
    })
    .filter((hb) => hb.id >= 1 && hb.id <= 27 && (hb.quote || hb.prompt || hb.name));
}

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
  // Prospect type is always chosen in the Live Dashboard and sent to backend.
  // Keep a safe fallback.
  const prospectType = prospectTypeOverride || 'foreclosure';

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
      new Promise((_, reject) => setTimeout(() => reject(new Error('Multi-agent timeout')), 25000))
    ]);
  } catch (error) {
    console.error(`[Engine] CRITICAL: Multi-agent analysis failed: ${error.message}`);
    // Return empty analysis but don't crash
    return getEmptyAnalysis();
  }

  const result = await buildFinalResultFromAiAnalysis({
    cleanedTranscript,
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
// NOTE: analyzeConversationFromAiAnalysis removed (legacy Realtime path no longer used).

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computePillarAverages(indicatorSignals) {
  const ranges = {
    P1: [1, 4],
    P2: [5, 8],
    P3: [9, 12],
    P4: [13, 16],
    P5: [17, 20],
    P6: [21, 23],
    P7: [24, 27]
  };
  const res = {};
  for (const [pid, [a, b]] of Object.entries(ranges)) {
    let sum = 0;
    let cnt = 0;
    for (let i = a; i <= b; i++) {
      const v = toNum(indicatorSignals?.[String(i)]);
      if (v > 0) {
        sum += clamp(v, 0, 10);
        cnt++;
      }
    }
    res[pid] = cnt ? sum / cnt : 0;
  }
  return res;
}

function computeLubometer(indicatorSignals, pillarWeights) {
  const pillarAvg = computePillarAverages(indicatorSignals);
  const defaultWeights = { P1: 1.2, P2: 1.1, P3: 1.0, P4: 1.0, P5: 0.9, P6: 0.8, P7: 1.0 };
  const weightsUsed = { ...defaultWeights };
  if (Array.isArray(pillarWeights)) {
    for (const w of pillarWeights) {
      if (w?.id && typeof w.weight === 'number') weightsUsed[w.id] = w.weight;
    }
  }
  let num = 0;
  let den = 0;
  for (const [pid, avg] of Object.entries(pillarAvg)) {
    const wt = toNum(weightsUsed[pid] ?? 1);
    num += avg * wt;
    den += wt;
  }
  const weightedAvg = den ? num / den : 0; // 0..10
  const score = Math.round(clamp((weightedAvg / 10) * 90, 0, 90));
  const level = score >= 65 ? 'high' : score >= 45 ? 'medium' : 'low';
  const interpretation =
    level === 'high'
      ? 'High readiness: prospect signals strong pain/urgency and openness.'
      : level === 'medium'
        ? 'Moderate readiness: keep clarifying pain, timeline, and decision path.'
        : 'Low readiness: build pain, urgency, and trust before closing.';
  const action =
    level === 'high'
      ? 'Move to next-step commitment and confirm decision timeline.'
      : level === 'medium'
        ? 'Ask diagnostic questions to sharpen pain and urgency.'
        : 'Do not close yet; deepen pain/urgency and establish trust.';
  return { score, maxScore: 90, level, interpretation, action, pillarScores: pillarAvg, weightsUsed };
}

function computeTruthIndex(aiAnalysis) {
  const coherence = String(aiAnalysis?.overallCoherence || 'medium').toLowerCase();
  const base = coherence === 'high' ? 80 : coherence === 'low' ? 45 : 60;
  const rules = Array.isArray(aiAnalysis?.detectedRules) ? aiAnalysis.detectedRules : [];
  const penalty = clamp(rules.length * 4, 0, 30);
  const score = clamp(base - penalty, 0, 100);
  const signals = Array.isArray(aiAnalysis?.coherenceSignals) ? aiAnalysis.coherenceSignals : [];
  const redFlags = rules.map((r) => (typeof r === 'string' ? r : r?.rule || r?.name || 'incoherence')).slice(0, 8);
  const penalties = rules.slice(0, 8).map((r) => ({
    rule: typeof r === 'string' ? r : (r?.rule || r?.name || 'incoherence'),
    description: typeof r === 'string' ? r : (r?.evidence || r?.description || ''),
    penalty: 4,
    details: typeof r === 'string' ? '' : (r?.evidence || '')
  }));
  return { score, signals, redFlags, penalties };
}

function normalizeDiagnosticQuestions(aiAnalysis) {
  const asked = Array.isArray(aiAnalysis?.askedQuestions) ? aiAnalysis.askedQuestions.filter((n) => Number.isInteger(n)) : [];
  return { asked, total: 0, completion: 0 };
}

async function buildFinalResultFromAiAnalysis({ cleanedTranscript, prospectType, pillarWeights, aiAnalysis, startTime }) {
  // Log agent results summary
  console.log(`[Engine] Agent Results Summary:`);
  console.log(`  - Pillars: ${Object.keys(aiAnalysis.indicatorSignals || {}).length} indicators scored`);
  console.log(`  - Hot Buttons: ${(aiAnalysis.hotButtonDetails || []).length} detected`);
  console.log(`  - Objections: ${(aiAnalysis.objections || []).length} detected`);
  console.log(`  - Diagnostic Questions: ${(aiAnalysis.askedQuestions || []).length} asked`);
  console.log(`  - Truth Index: ${aiAnalysis.overallCoherence || 'unknown'} coherence`);
  console.log(`  - Insights: ${aiAnalysis.closingReadiness || 'unknown'} readiness`);

  const lubometer = computeLubometer(aiAnalysis.indicatorSignals || {}, pillarWeights);
  const truthIndex = computeTruthIndex(aiAnalysis);
  const hotButtons = normalizeHotButtons(aiAnalysis.hotButtonDetails);
  const objections = Array.isArray(aiAnalysis.objections) ? aiAnalysis.objections : [];
  const diagnosticQuestions = normalizeDiagnosticQuestions(aiAnalysis);

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
      weightedScores: {},
      totalBeforePenalties: lubometer.score,
      penalties: []
    },
    truthIndex: {
      score: truthIndex.score,
      signals: truthIndex.signals,
      redFlags: truthIndex.redFlags,
      penalties: truthIndex.penalties
    },
    pillars: lubometer.pillarScores,
    hotButtons,
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
    prospectType: 'foreclosure',
    lubometer: {
      score: 0,
      level: 'low',
      interpretation: 'No conversation data available',
      action: 'Start conversation to begin analysis'
    },
    truthIndex: {
      score: 0,
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
