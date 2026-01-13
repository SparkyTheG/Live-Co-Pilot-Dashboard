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

import {
  runAllAgents,
  runAllPillarAgents,
  runHotButtonsAgent,
  runObjectionsAgentsProgressive,
  runTruthIndexAgent,
  runLubometerTruthPenaltyAgent,
  runInsightsAgent
} from './aiAgents.js';
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
const MIN_ANALYSIS_INTERVAL = 250; // Minimum 0.25 seconds between AI analyses (backend scheduler also throttles)

/**
 * Progressive analysis: run sub-agents in parallel and emit partial results as they become available.
 * This makes the frontend feel "instant" (lubometer/pillars usually arrive first).
 *
 * @param {string} transcript
 * @param {string|null} prospectTypeOverride
 * @param {string} customScriptPrompt
 * @param {Array|null} pillarWeights
 * @param {(partial: any) => void} onPartial
 */
export async function analyzeConversationProgressive(
  transcript,
  prospectTypeOverride = null,
  customScriptPrompt = '',
  pillarWeights = null,
  onPartial = null,
  newTextOnly = null // Optional: only new text for hot buttons/objections to avoid re-detection
) {
  const startTime = Date.now();

  if (!transcript || transcript.trim().length === 0) {
    return getEmptyAnalysis();
  }

  const cleanedTranscript = cleanTranscriptForAI(transcript);
  const prospectType = prospectTypeOverride || 'foreclosure';

  // Small rolling windows per agent (stable latency)
  // Pillars drive Lubometer + Truth Index (deterministic). Give a bit more context so
  // indicators (esp. Responsibility) can reflect recent contradictions reliably.
  const tPillars = String(cleanedTranscript || '').slice(-2000);
  
  // Hot Buttons and Objections: Use ONLY new text if provided (to avoid re-detecting old triggers)
  // If no new text, skip these agents entirely (return empty arrays)
  const hasNewText = newTextOnly && String(newTextOnly).trim().length > 0;
  const tHotButtons = hasNewText ? String(cleanTranscriptForAI(newTextOnly) || '').slice(-800) : null;
  const tObjections = hasNewText ? String(cleanTranscriptForAI(newTextOnly) || '').slice(-800) : null;
  
  // Truth Index needs MORE context to detect contradictions (e.g., says X early, then says Y later)
  // Give it up to 3000 chars (~5-10 minutes of conversation) to find patterns
  const tTruth = String(cleanedTranscript || '').slice(-3000);
  const tInsights = String(cleanedTranscript || '').slice(-800);

  const emit = (p) => {
    if (typeof onPartial !== 'function') return;
    try { onPartial(p); } catch {}
  };

  // Stream buffering for scores-only agents (Lubometer pillar agents, Hot Buttons, Truth Index).
  // We throttle/batch deltas to avoid flooding the WS during frequent analysis runs.
  const streamBuffers = new Map(); // key -> { buf: string, lastFlushMs: number, group: string, agent: string }
  const STREAM_FLUSH_MS = 120;

  const flushStreamKey = (key, { done = false } = {}) => {
    const st = streamBuffers.get(key);
    if (!st) return;
    const delta = String(st.buf || '');
    if (!delta) return;
    st.buf = '';
    st.lastFlushMs = Date.now();
    streamBuffers.set(key, st);
    emit({
      _stream: {
        group: st.group,
        agent: st.agent,
        delta,
        done: !!done,
        ts: Date.now()
      }
    });
  };

  const flushStreamGroup = (group, { done = false } = {}) => {
    for (const [key, st] of streamBuffers.entries()) {
      if (st?.group !== group) continue;
      flushStreamKey(key, { done });
    }
  };

  const makeOnStream = (group) => (ev) => {
    const agent = String(ev?.agent || '');
    const delta = String(ev?.delta || '');
    if (!agent || !delta) return;
    const key = `${group}:${agent}`;
    const prev = streamBuffers.get(key) || { buf: '', lastFlushMs: 0, group, agent };
    prev.buf = String(prev.buf || '') + delta;
    streamBuffers.set(key, prev);
    const now = Date.now();
    if ((now - (prev.lastFlushMs || 0)) >= STREAM_FLUSH_MS || prev.buf.length >= 256) {
      flushStreamKey(key, { done: false });
    }
  };

  const agentErrors = {};
  const aiAnalysis = {
    indicatorSignals: {},
    hotButtonDetails: [],
    objections: [],
    askedQuestions: [],
    detectedRules: [],
    lubometerPenaltyRules: [],
    coherenceSignals: [],
    overallCoherence: '',
    insights: '',
    keyMotivators: [],
    concerns: [],
    recommendation: '',
    closingReadiness: 'not_ready',
    agentErrors
  };

  let pillarsDone = false;
  let lubometerBase = null;

  const emitTruthIndexIfPossible = () => {
    if (!pillarsDone) return;
    // #region debug log - hypothesis B/D
    fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.js:emitTruthIndex',message:'Computing Truth Index',data:{pillarsDone,indicatorSignalsCount:Object.keys(aiAnalysis.indicatorSignals||{}).length,sampleIndicators:{i1:aiAnalysis.indicatorSignals?.['1'],i2:aiAnalysis.indicatorSignals?.['2'],i17:aiAnalysis.indicatorSignals?.['17'],i18:aiAnalysis.indicatorSignals?.['18'],i21:aiAnalysis.indicatorSignals?.['21']}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion
    // Truth Index is deterministic (per CSV) based on pillar indicator scores + transcript cues.
    // Do NOT wait for the TruthIndex agent; it can be slow and shouldn't gate UI updates.
    const truthIndex = computeTruthIndex(aiAnalysis, aiAnalysis.indicatorSignals || {}, cleanedTranscript);
    // #region debug log - hypothesis B/D
    fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.js:emitTruthIndexResult',message:'Truth Index computed',data:{truthIndex,transcriptLengthForTruth:tTruth.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion
    emit({ truthIndex });
  };

  const applyTruthIndexCsvPenaltiesToLubometer = ({
    lubometer,
    indicatorSignals,
    transcript,
    aiRules
  }) => {
    if (!lubometer || typeof lubometer !== 'object') return lubometer;

    // Apply ALL detected penalties (multiple instances of same rule allowed).
    const penaltyMap = { T1: 15, T2: 15, T3: 10, T4: 10, T5: 15 };
    const penalties = [];

    // Deterministic penalties (CSV-only): reuse TruthIndex deterministic and filter to T1..T5
    const det = computeTruthIndexDeterministic(indicatorSignals || {}, transcript || '');
    const detPenalties = Array.isArray(det?.penalties) ? det.penalties : [];
    for (const p of detPenalties) {
      const ruleId = String(p?.rule || '').slice(0, 2); // "T1", "T2", ...
      if (!penaltyMap[ruleId]) continue;
      penalties.push({
        ruleId,
        rule: String(p?.rule || ''),
        description: String(p?.description || ''),
        penalty: penaltyMap[ruleId],
        source: 'deterministic',
        evidence: String(p?.details || '')
      });
    }

    // AI penalties (from dedicated Lubometer agent): allow if confidence >= 0.7
    const aiDetected = Array.isArray(aiRules) ? aiRules : [];
    for (const r of aiDetected) {
      const ruleId = String(r?.ruleId || '').trim();
      const conf = Number(r?.confidence || 0);
      if (!penaltyMap[ruleId]) continue;
      if (conf < 0.7) continue;
      penalties.push({
        ruleId,
        rule: `${ruleId} (AI-detected)`,
        description: 'Detected from conversation language',
        penalty: penaltyMap[ruleId],
        source: 'ai',
        evidence: String(r?.evidence || '').slice(0, 240),
        confidence: conf
      });
    }

    const totalPenalty = penalties.reduce((sum, p) => sum + (Number(p?.penalty) || 0), 0);
    const rawScore = Number(lubometer.score || 0);
    const newScore = clamp(rawScore - totalPenalty, 0, Number(lubometer.maxScore || 9999));

    return {
      ...lubometer,
      totalBeforePenalties: rawScore,
      score: Math.round(newScore),
      penalties
    };
  };

  const emitLubometerIfPossible = () => {
    if (!pillarsDone) return;
    if (!lubometerBase) return;
    const updated = applyTruthIndexCsvPenaltiesToLubometer({
      lubometer: lubometerBase,
      indicatorSignals: aiAnalysis.indicatorSignals || {},
      transcript: cleanedTranscript,
      aiRules: aiAnalysis.lubometerPenaltyRules || []
    });
    emit({
      lubometer: {
        score: updated.score,
        maxScore: updated.maxScore || 90,
        level: updated.level,
        interpretation: updated.interpretation,
        action: updated.action,
        pillarScores: updated.pillarScores,
        weightsUsed: updated.weightsUsed,
        totalBeforePenalties: updated.totalBeforePenalties,
        penalties: Array.isArray(updated.penalties) ? updated.penalties : []
      },
      pillars: updated.pillarScores
    });
  };

  const pillarsP = runAllPillarAgents(tPillars, makeOnStream('lubometer'))
    .then((r) => {
      flushStreamGroup('lubometer', { done: true });
      aiAnalysis.indicatorSignals = r?.indicatorSignals || {};
      pillarsDone = true;
      
      // #region debug log - hypothesis B/E
      fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.js:310',message:'Pillars complete',data:{indicatorSignals:aiAnalysis.indicatorSignals,transcriptLengthForPillars:tPillars.length,transcriptLast200:tPillars.slice(-200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
      // #endregion
      
      // #region truthindex log H4
      console.log('[DEBUG:H4] Pillars complete, about to emit Truth Index', JSON.stringify({indicatorSignalsCount:Object.keys(aiAnalysis.indicatorSignals||{}).length,tTruthLen:tTruth?.length||0}));
      // #endregion
      
      lubometerBase = computeLubometer(aiAnalysis.indicatorSignals, pillarWeights);
      emitLubometerIfPossible();
      emitTruthIndexIfPossible();
    })
    .catch((e) => {
      flushStreamGroup('lubometer', { done: true });
      agentErrors.pillars = String(e?.message || e || 'error');
    });

  // Hot Buttons: Only run if we have new text (skip if no new content)
  const hotButtonsP = tHotButtons 
    ? runHotButtonsAgent(tHotButtons, makeOnStream('hotButtons'))
        .then((r) => {
          flushStreamGroup('hotButtons', { done: true });
          aiAnalysis.hotButtonDetails = Array.isArray(r?.hotButtonDetails) ? r.hotButtonDetails : [];
          emit({ hotButtons: normalizeHotButtons(aiAnalysis.hotButtonDetails) });
        })
        .catch((e) => {
          flushStreamGroup('hotButtons', { done: true });
          agentErrors.hotButtons = String(e?.message || e || 'error');
        })
    : Promise.resolve();

  // Objections: Only run if we have new text (skip if no new content)
  const objectionsP = tObjections
    ? runObjectionsAgentsProgressive(tObjections, customScriptPrompt, (p) => emit(p))
        .then((r) => {
          aiAnalysis.objections = Array.isArray(r?.objections) ? r.objections : [];
        })
        .catch((e) => {
          agentErrors.objections = String(e?.message || e || 'error');
        })
    : Promise.resolve();

  const truthP = runTruthIndexAgent(tTruth, makeOnStream('truthIndex'))
    .then((r) => {
      flushStreamGroup('truthIndex', { done: true });
      aiAnalysis.detectedRules = Array.isArray(r?.detectedRules) ? r.detectedRules : [];
      aiAnalysis.coherenceSignals = Array.isArray(r?.coherenceSignals) ? r.coherenceSignals : [];
      aiAnalysis.overallCoherence = typeof r?.overallCoherence === 'string' ? r.overallCoherence : '';
      if (r?.error) agentErrors.truthIndex = String(r.error);
      // Marker used by computeTruthIndex to decide if agent actually ran
      aiAnalysis.truthIndexFromAgent = !r?.error;
      // TruthIndex score is already emitted from pillars; don't re-gate it here.
      // We keep this agent for optional streaming/diagnostics only.
    })
    .catch((e) => {
      flushStreamGroup('truthIndex', { done: true });
      agentErrors.truthIndex = String(e?.message || e || 'error');
      aiAnalysis.truthIndexFromAgent = false;
    });

  const lubometerPenaltyP = runLubometerTruthPenaltyAgent(tTruth, null)
    .then((r) => {
      aiAnalysis.lubometerPenaltyRules = Array.isArray(r?.detectedRules) ? r.detectedRules : [];
      if (r?.error) agentErrors.lubometerPenalty = String(r.error);
      // If pillars already emitted, re-emit lubometer with penalties applied.
      if (pillarsDone) emitLubometerIfPossible();
    })
    .catch((e) => {
      agentErrors.lubometerPenalty = String(e?.message || e || 'error');
    });

  const insightsP = runInsightsAgent(tInsights, prospectType)
    .then((r) => {
      aiAnalysis.insights = r?.summary || r?.insights || '';
      aiAnalysis.keyMotivators = Array.isArray(r?.keyMotivators) ? r.keyMotivators : [];
      aiAnalysis.concerns = Array.isArray(r?.concerns) ? r.concerns : [];
      aiAnalysis.recommendation = r?.recommendation || '';
      aiAnalysis.closingReadiness = r?.closingReadiness || 'not_ready';
      emit({
        aiInsights: {
          summary: aiAnalysis.insights,
          keyMotivators: aiAnalysis.keyMotivators,
          concerns: aiAnalysis.concerns,
          recommendation: aiAnalysis.recommendation,
          closingReadiness: aiAnalysis.closingReadiness,
          agentErrors
        }
      });
    })
    .catch((e) => {
      agentErrors.insights = String(e?.message || e || 'error');
    });

  // Wait for all to settle, then build a final unified result (same shape as analyzeConversation)
  await Promise.allSettled([pillarsP, hotButtonsP, objectionsP, truthP, lubometerPenaltyP, insightsP]);

  const result = await buildFinalResultFromAiAnalysis({
    cleanedTranscript,
    prospectType,
    pillarWeights,
    aiAnalysis,
    startTime
  });

  return result;
}

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
  // Defaults should match the frontend's DEFAULT_SETTINGS (SettingsContext.tsx)
  const defaultWeights = { P1: 1.5, P2: 1.0, P3: 1.0, P4: 1.5, P5: 1.0, P6: 1.5, P7: 1.5 };
  const weightsUsed = { ...defaultWeights };
  if (Array.isArray(pillarWeights)) {
    for (const w of pillarWeights) {
      if (w?.id && typeof w.weight === 'number') weightsUsed[w.id] = w.weight;
    }
  }
  // Weighted TOTAL scoring (matches AdminPanel "Maximum Lubometer Score" = sum(weights)*10).
  // Each pillar contributes 0..(10*weight) points, based on its avg (0..10).
  let total = 0;
  let maxScore = 0;
  for (const [pid, avg] of Object.entries(pillarAvg)) {
    const wt = clamp(toNum(weightsUsed[pid] ?? 1), 0, 10);
    total += clamp(toNum(avg), 0, 10) * wt;
    maxScore += 10 * wt;
  }
  maxScore = Math.round(clamp(maxScore, 0, 1000));
  const score = Math.round(clamp(total, 0, maxScore));
  const percent = maxScore ? (score / maxScore) * 100 : 0;

  // Keep level thresholds equivalent to old 0..90 scale:
  // - High: >= 65/90 ≈ 72%
  // - Medium: >= 45/90 = 50%
  const level = percent >= 72 ? 'high' : percent >= 50 ? 'medium' : 'low';
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
  return { score, maxScore, level, interpretation, action, pillarScores: pillarAvg, weightsUsed };
}

function avgRange(indicatorSignals, a, b) {
  let sum = 0;
  let cnt = 0;
  for (let i = a; i <= b; i++) {
    const v = toNum(indicatorSignals?.[String(i)]);
    if (v > 0) {
      sum += clamp(v, 0, 10);
      cnt++;
    }
  }
  return cnt ? sum / cnt : 0;
}

function computeTruthIndexDeterministic(indicatorSignals, transcript) {
  // #region truthindex log H1 H2 H3 H5
  console.log('[DEBUG:H1_H2_H3_H5] Truth Index calc started', JSON.stringify({transcriptLen:transcript?.length||0,transcriptPreview:String(transcript||'').slice(-200),indicatorSignalsCount:Object.keys(indicatorSignals||{}).length,sampleIndicators:{i1:indicatorSignals?.['1'],i2:indicatorSignals?.['2'],i17:indicatorSignals?.['17'],i18:indicatorSignals?.['18'],i21:indicatorSignals?.['21']}}));
  // #endregion

  const t = String(transcript || '').toLowerCase();

  const painAvg = avgRange(indicatorSignals, 1, 4);
  const desireAvg = (() => {
    const d2 = toNum(indicatorSignals?.['2']);
    const d3 = toNum(indicatorSignals?.['3']);
    const vals = [d2, d3].filter((n) => n > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();
  const urgencyAvg = avgRange(indicatorSignals, 5, 8);
  const decisivenessAvg = avgRange(indicatorSignals, 9, 12);
  const moneyAvg = avgRange(indicatorSignals, 13, 16);
  const responsibilityAvg = avgRange(indicatorSignals, 17, 20);
  const priceSensitivityRaw = avgRange(indicatorSignals, 21, 23);

  // #region truthindex log H1
  console.log('[DEBUG:H1] Pillar averages computed', JSON.stringify({painAvg,desireAvg,urgencyAvg,decisivenessAvg,moneyAvg,responsibilityAvg,priceSensitivityRaw,transcriptContains:{confused:t.includes('confused'),expensive:t.includes('expensive'),absolutely:t.includes('absolutely')}}));
  // #endregion

  const debug = String(process?.env?.DEBUG_TRUTH_INDEX || '') === '1';
  if (debug) {
    console.log(
      `[TruthIndexDeterministic] PILLAR AVERAGES: pain=${painAvg.toFixed(1)}, desire=${desireAvg.toFixed(1)}, urgency=${urgencyAvg.toFixed(1)}, decisiveness=${decisivenessAvg.toFixed(1)}, money=${moneyAvg.toFixed(1)}, responsibility=${responsibilityAvg.toFixed(1)}, priceSensitivity=${priceSensitivityRaw.toFixed(1)}`
    );
  }

  const penalties = [];

  // T1: High Pain + Low Urgency (per CSV: -15 points)
  if (painAvg >= 7 && urgencyAvg > 0 && urgencyAvg <= 4) {
    penalties.push({
      rule: 'T1 High Pain + Low Urgency',
      description: 'Claims deep pain but no urgency to act',
      penalty: 15,
      details: `painAvg=${painAvg.toFixed(1)}, urgencyAvg=${urgencyAvg.toFixed(1)}`
    });
  }

  // T2: High Desire + Low Decisiveness (per CSV: -15 points)
  if (desireAvg >= 7 && decisivenessAvg > 0 && decisivenessAvg <= 4) {
    penalties.push({
      rule: 'T2 High Desire + Low Decisiveness',
      description: 'Wants change but avoids decision',
      penalty: 15,
      details: `desireAvg=${desireAvg.toFixed(1)}, decisivenessAvg=${decisivenessAvg.toFixed(1)}`
    });
  }

  // T3: High Money + High Price Sensitivity (per CSV: -10 points)
  if (moneyAvg >= 7 && priceSensitivityRaw >= 8) {
    penalties.push({
      rule: 'T3 High Money + High Price Sensitivity',
      description: 'Can afford it, but still resists price',
      penalty: 10,
      details: `moneyAvg=${moneyAvg.toFixed(1)}, priceSensitivityRaw=${priceSensitivityRaw.toFixed(1)}`
    });
  }

  // T4: Claims Authority + Reveals Need for Approval (per CSV: -10 points)
  const authority = toNum(indicatorSignals?.['9']);
  const needsApproval =
    t.includes('ask my wife') ||
    t.includes('ask my husband') ||
    t.includes('ask my partner') ||
    t.includes('check with my wife') ||
    t.includes('check with my husband') ||
    t.includes('check with my partner') ||
    t.includes('talk to my wife') ||
    t.includes('talk to my husband') ||
    t.includes('talk to my partner') ||
    t.includes('need to ask') ||
    t.includes('need to check') ||
    t.includes('need to talk to');

  if (authority >= 7 && needsApproval) {
    penalties.push({
      rule: 'T4 Claims Authority + Needs Approval',
      description: 'Self-contradiction in who owns the decision',
      penalty: 10,
      details: `authority=${authority}, approvalCue=true`
    });
  }

  // T5: High Desire + Low Responsibility (per CSV: -15 points)
  if (desireAvg >= 7 && responsibilityAvg > 0 && responsibilityAvg <= 5) {
    penalties.push({
      rule: 'T5 High Desire + Low Responsibility',
      description: 'Craves result, but doesn\'t own the change',
      penalty: 15,
      details: `desireAvg=${desireAvg.toFixed(1)}, responsibilityAvg=${responsibilityAvg.toFixed(1)}`
    });
  }

  // T6: Direct text contradictions - Money/Affordability/Payments (not in CSV, but catches text patterns)
  const haveMoney = ['do have the money', 'do have money', 'have the money', 'can afford', 'have paid', 'not behind', 'paid all'];
  const noMoney = ["don't have the money", "don't have money", "can't afford", 'no money', 'behind on', 'behind with', 'missed payment', 'cannot pay'];
  const haveCount = haveMoney.filter(phrase => t.includes(phrase)).length;
  const noCount = noMoney.filter(phrase => t.includes(phrase)).length;
  
  if (haveCount > 0 && noCount > 0) {
    penalties.push({
      rule: 'T6 Money/Payment Contradiction (text-based)',
      description: 'Says they have money/paid AND don\'t have money/behind on payments in same conversation.',
      penalty: 20,
      details: `${haveCount} positive + ${noCount} negative statements`
    });
  }
  
  // T6b: Explicit lying admission (not in CSV, catches explicit dishonesty)
  const lyingPhrases = ['lying', 'i lied', 'was lying', 'not true', 'made that up', 'not being honest', 'being dishonest'];
  const lyingCount = lyingPhrases.filter(phrase => t.includes(phrase)).length;
  if (lyingCount > 0) {
    penalties.push({
      rule: 'T6b Admitted Lying (text-based)',
      description: 'Explicitly admits to lying or making things up.',
      penalty: 30,
      details: `${lyingCount} dishonesty admission(s)`
    });
  }

  // T7: Direct text contradictions - Clarity/Confusion (not in CSV)
  const clearPhrases = ['very clear', 'absolutely', 'definitely', 'for sure', 'certain', '100%', 'no doubt'];
  const confusedPhrases = ['confused', 'not sure', 'uncertain', "don't know", 'unclear', 'maybe'];
  const clearCount = clearPhrases.filter(phrase => t.includes(phrase)).length;
  const confusedCount = confusedPhrases.filter(phrase => t.includes(phrase)).length;
  
  if (clearCount > 0 && confusedCount > 0) {
    penalties.push({
      rule: 'T7 Clarity Contradiction (text-based)',
      description: 'Says they\'re clear/certain AND confused/uncertain in same conversation.',
      penalty: 12,
      details: `${clearCount} clarity + ${confusedCount} confusion statements`
    });
  }

  // T8: Direct text contradictions - Interest/Readiness (not in CSV)
  const readyPhrases = ['ready to', 'want to move forward', "let's do it", 'sign up', "i'm in", 'sounds good'];
  const notReadyPhrases = ['need time', 'need to think', 'not ready', 'maybe later', 'not now', 'hold off'];
  const readyCount = readyPhrases.filter(phrase => t.includes(phrase)).length;
  const notReadyCount = notReadyPhrases.filter(phrase => t.includes(phrase)).length;
  
  if (readyCount > 0 && notReadyCount > 0) {
    penalties.push({
      rule: 'T8 Readiness Contradiction (text-based)',
      description: 'Says they\'re ready AND not ready in same conversation.',
      penalty: 12,
      details: `${readyCount} ready + ${notReadyCount} not-ready statements`
    });
  }

  const totalPenalty = penalties.reduce((s, p) => s + toNum(p.penalty), 0);
  const score = clamp(100 - totalPenalty, 0, 100);

  // #region truthindex log H1
  console.log('[DEBUG:H1] Truth Index score calculated', JSON.stringify({penalties:penalties.map(p=>({rule:p.rule,penalty:p.penalty})),totalPenalty,score}));
  // #endregion

  if (debug) {
    console.log(
      `[TruthIndexDeterministic] PENALTIES: ${penalties.map((p) => `${p.rule}(-${p.penalty})`).join(', ') || 'NONE'}, FINAL SCORE: ${score}`
    );
  }

  const coherenceSignals = [];
  if (painAvg >= 7 && urgencyAvg >= 6) coherenceSignals.push('Pain aligns with urgency');
  if (desireAvg >= 7 && decisivenessAvg >= 6) coherenceSignals.push('Desire aligns with decisiveness');
  if (responsibilityAvg >= 7) coherenceSignals.push('High ownership/responsibility');

  const overallCoherence = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  const redFlags = penalties.map((p) => p.rule).slice(0, 8);

  // #region debug log - hypothesis B/D
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.js:computeTruthIndexResult',message:'Truth Index calculated',data:{score,penalties:penalties.map(p=>({rule:p.rule,penalty:p.penalty,details:p.details})),coherenceSignals,overallCoherence},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,D'})}).catch(()=>{});
  // #endregion

  return {
    score,
    signals: coherenceSignals,
    redFlags,
    penalties: penalties.slice(0, 8)
  };
}

function computeTruthIndex(aiAnalysis, indicatorSignals, transcript) {
  // Start with deterministic calculation (pillar-based T1-T5, per CSV)
  const deterministic = computeTruthIndexDeterministic(indicatorSignals, transcript);
  
  // If AI agent detected additional T1-T5 contradictions, apply those penalties too
  // AI penalties MUST match CSV spec: T1=-15, T2=-15, T3=-10, T4=-10, T5=-15
  if (aiAnalysis.truthIndexFromAgent && Array.isArray(aiAnalysis.detectedRules) && aiAnalysis.detectedRules.length > 0) {
    const penaltyMap = { T1: 15, T2: 15, T3: 10, T4: 10, T5: 15 }; // Per CSV spec
    const aiPenalties = [];
    
    for (const rule of aiAnalysis.detectedRules) {
      const basePenalty = penaltyMap[rule.ruleId] || 0;
      const confidence = Number(rule.confidence) || 0;
      
      // Only apply if confidence >= 0.7 (high confidence required)
      if (basePenalty > 0 && confidence >= 0.7) {
        // Check if deterministic already caught this (avoid double-penalizing same rule)
        const alreadyDetected = deterministic.penalties.some(p => p.rule.startsWith(rule.ruleId));
        if (!alreadyDetected) {
          aiPenalties.push({
            rule: `${rule.ruleId} (AI-detected)`,
            description: String(rule.evidence || 'AI-detected contradiction').slice(0, 200),
            penalty: basePenalty, // Use exact CSV penalty, no scaling
            confidence
          });
        }
      }
    }
    
    if (aiPenalties.length > 0) {
      console.log(`[TruthIndex] AI agent added ${aiPenalties.length} penalties:`, aiPenalties.map(p => p.rule).join(', '));
      
      // Combine deterministic + AI penalties
      const allPenalties = [...deterministic.penalties, ...aiPenalties];
      const totalPenalty = allPenalties.reduce((sum, p) => sum + (p.penalty || 0), 0);
      const score = clamp(100 - totalPenalty, 0, 100);
      
      return {
        score,
        signals: deterministic.signals,
        redFlags: allPenalties.map(p => p.rule).slice(0, 8),
        penalties: allPenalties.slice(0, 10) // Show up to 10 penalties
      };
    }
  }
  
  return deterministic;
}

function normalizeDiagnosticQuestions(aiAnalysis) {
  // Diagnostic questions are user-controlled (no AI auto-detection).
  // Keep schema stable for the frontend, but don't auto-populate.
  return { asked: [], total: 0, completion: 0 };
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

  const indicatorSignals = aiAnalysis.indicatorSignals || {};
  const lubometerRaw = computeLubometer(indicatorSignals, pillarWeights);
  const lubometer = applyTruthIndexCsvPenaltiesToLubometer({
    lubometer: lubometerRaw,
    indicatorSignals,
    transcript: cleanedTranscript,
    aiRules: aiAnalysis.lubometerPenaltyRules || []
  });
  const truthIndex = computeTruthIndex(aiAnalysis, indicatorSignals, cleanedTranscript);
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
      totalBeforePenalties: lubometer.totalBeforePenalties ?? lubometer.score,
      penalties: Array.isArray(lubometer.penalties) ? lubometer.penalties : []
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
