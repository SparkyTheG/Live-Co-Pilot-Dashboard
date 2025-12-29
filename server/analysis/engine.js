import { analyzePillars } from './pillars.js';
import { calculateLubometer } from './lubometer.js';
import { calculateTruthIndex } from './truthIndex.js';
import { extractHotButtons } from './hotButtons.js';
import { detectObjections } from './objections.js';
import { detectProspectType } from './prospectType.js';
import { loadProspectFile } from './prospectFiles.js';
import { detectAskedDiagnosticQuestions } from './diagnosticQuestions.js';

// Simple in-memory cache to avoid duplicate API calls
const analysisCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache
const MAX_CACHE_SIZE = 50;

// Debounce tracker
let lastAnalysisTime = 0;
const MIN_ANALYSIS_INTERVAL = 2000; // Minimum 2 seconds between AI analyses

// Import diagnostic questions for AI prompt
const DIAGNOSTIC_QUESTIONS = {
  'foreclosure': [
    'How many days until your auction date?',
    'What is your loan balance versus current property value?',
    'How many months behind are you on payments?',
    'Why did this happen? (job loss, medical, divorce, etc.)',
    'Have you talked to your lender about options?',
    'Is your family still living in the property?',
    'What happens to you and your family if this goes to auction?',
    'Who else is involved in this decision?',
    'Have you listed the property with an agent or gotten other offers?'
  ],
  'creative-seller-financing': [
    'How many months behind are you on payments?',
    'What is your current loan balance and monthly payment?',
    'Why did you fall behind? (job loss, medical, divorce, business failure)',
    'Have you received any foreclosure notices? What date is the auction?',
    'Are there any other liens, judgments, or HOA issues on the property?',
    'Who else needs to be involved in this decision?',
    'What would happen if you lost this property?',
    'Have you tried listing with an agent or getting other offers?'
  ],
  'distressed-landlord': [
    'How long have you been a landlord?',
    'How many properties do you own?',
    'What is the current tenant situation? (problem tenants, vacancy, eviction)',
    'How much negative cash flow are you experiencing per month?',
    'What was the specific incident that made you say "I\'m done"?',
    'What condition is the property in? Any deferred maintenance?',
    'Are you managing this yourself or using a property manager?',
    'Have you tried to fix this property or situation before? What happened?'
  ],
  'performing-tired-landlord': [
    'How long have you been in the landlord business?',
    'What is your current monthly cash flow on this property?',
    'What triggered you to consider selling now?',
    'How much time do you spend managing this property per month?',
    'What would you do with your time if you didn\'t have this property?',
    'Does your spouse/partner want you to sell?',
    'If you could trade the monthly income for total freedom today, would you?',
    'Have you calculated what your time is worth versus the rental income?'
  ],
  'cash-equity-seller': [
    'What is your timeline for selling?',
    'Why are you selling right now?',
    'What is your bottom-line number to sell?',
    'Have you already purchased your next property or have a time-sensitive need?',
    'What other offers have you received?',
    'What would it take for you to commit today?',
    'Is there anyone else involved in this decision?',
    'Would you accept a slightly lower price for a guaranteed close in 7 days?'
  ]
};
import { getComprehensiveCSVContext } from './csvContext.js';
import OpenAI from 'openai';

// Use OpenRouter for faster models
// OpenRouter provides access to multiple AI providers through a single API
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
  timeout: 60000, // Increased to 60 seconds to prevent premature failure
  maxRetries: 3,
  defaultHeaders: process.env.OPENROUTER_API_KEY ? {
    'HTTP-Referer': 'http://localhost:3001',
    'X-Title': 'Zero-Stress Sales CoPilot'
  } : {}
});

// Using Claude Sonnet 4.5 for best analysis quality
const ANALYSIS_MODEL = process.env.OPENROUTER_API_KEY
  ? 'anthropic/claude-sonnet-4-20250514'  // Claude Sonnet 4.5 - best quality
  : 'gpt-4o-mini';  // OpenAI fallback only if no OpenRouter key

/**
 * Main analysis engine that processes conversation transcripts
 * and returns comprehensive analysis based on CSV logic + prospect-specific txt files
 */
export async function analyzeConversation(transcript, prospectTypeOverride = null) {
  const startTime = Date.now();

  if (!transcript || transcript.trim().length === 0) {
    return getEmptyAnalysis();
  }

  // Clean transcript early for cache key
  const cleanedTranscript = cleanTranscriptForAI(transcript);
  const lowerTranscript = transcript.toLowerCase();

  // 1. Detect or use provided prospect type
  const prospectType = prospectTypeOverride || detectProspectType(lowerTranscript);

  // Create cache key from transcript hash + prospect type
  const cacheKey = `${prospectType}:${simpleHash(cleanedTranscript)}`;

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
    // Return cached if available, otherwise return basic analysis without AI
    if (cached) {
      return { ...cached.result, fromCache: true, debounced: true };
    }
    // Fall through to do basic analysis without AI
  }

  lastAnalysisTime = Date.now();

  // 2. Load prospect-specific context file
  const prospectContext = loadProspectFile(prospectType);

  // 3. Use Claude Sonnet 4.5 to analyze conversation with CSV logic + prospect context
  // Run with timeout protection (30s for Claude)
  let aiAnalysis;
  try {
    aiAnalysis = await Promise.race([
      analyzeWithAI(cleanedTranscript, prospectType, prospectContext),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 45000))
    ]);
  } catch (error) {
    console.error(`[Engine] CRITICAL: AI analysis failed/timed out: ${error.message}`);
    // Return empty analysis - NO FALLBACKS
    // Note: This causes the score to drop to 0 if it happens mid-recording
    return getEmptyAnalysis();
  }

  // If AI returned an error, return empty - NO FALLBACKS
  if (aiAnalysis.error || aiAnalysis.fallback) {
    console.error(`[Engine] AI returned error: ${aiAnalysis.error}`);
    return getEmptyAnalysis();
  }

  // 4. Analyze 7 Pillars (27 Indicators) - AI ONLY, no keyword fallbacks
  const [pillarScores, dials] = await Promise.all([
    analyzePillars(lowerTranscript, prospectType, aiAnalysis), // Pass AI analysis to use AI scores
    Promise.resolve(extractDials(lowerTranscript))
  ]);

  // 5. Calculate Truth Index (needed for Lubometer penalties)
  const truthIndex = calculateTruthIndex(pillarScores, lowerTranscript);

  // 6. Calculate Lubometer (uses Truth Index penalties)
  const lubometer = calculateLubometer(pillarScores);

  // 7. Extract Hot Buttons (all 27 indicators) - pass pillarScores for accurate detection
  let hotButtons = extractHotButtons(lowerTranscript, prospectType, aiAnalysis, pillarScores);

  // Ensure hotButtons is always an array
  if (!Array.isArray(hotButtons)) {
    hotButtons = [];
  }

  // 8. Detect Objections (enhanced with AI)
  let objections = detectObjections(lowerTranscript, prospectType, aiAnalysis);

  // 9. Get diagnostic questions status
  const diagnosticQuestions = detectAskedDiagnosticQuestions(lowerTranscript, prospectType, aiAnalysis);

  // Ensure objections is always an array
  if (!Array.isArray(objections)) {
    objections = [];
  }

  const result = {
    prospectType,
    lubometer: {
      score: lubometer.score,
      level: lubometer.level,
      interpretation: lubometer.interpretation,
      action: lubometer.action
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
    dials,
    diagnosticQuestions,
    aiInsights: aiAnalysis,
    timestamp: new Date().toISOString()
  };

  // Cache the result
  if (analysisCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  analysisCache.set(cacheKey, { result, timestamp: Date.now() });

  console.log(`[Engine] Analysis complete in ${Date.now() - startTime}ms`);

  // FINAL DEFENSIVE CHECK: Ensure hotButtons and objections are ALWAYS arrays before returning
  if (!Array.isArray(result.hotButtons)) {
    console.error('[Engine] WARNING: hotButtons is not an array, forcing to empty array:', typeof result.hotButtons);
    result.hotButtons = [];
  }
  if (!Array.isArray(result.objections)) {
    console.error('[Engine] WARNING: objections is not an array, forcing to empty array:', typeof result.objections);
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
    let repeatCount = 0;
    let j = i + 1;
    while (j < words.length && words[j].toLowerCase() === word.toLowerCase()) {
      repeatCount++;
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
 * Uses GPT-4o-mini to analyze conversation with CSV logic and prospect-specific context
 */
async function analyzeWithAI(transcript, prospectType, prospectContext) {
  const startTime = Date.now();

  try {
    // Transcript is already cleaned when passed in
    const cleanedTranscript = transcript;

    // Load CSV context for proper analysis
    const csvContext = getComprehensiveCSVContext();

    // Get diagnostic questions for this prospect type
    const questions = DIAGNOSTIC_QUESTIONS[prospectType] || DIAGNOSTIC_QUESTIONS['foreclosure'];
    const questionsList = questions.map((q, idx) => `${idx}. ${q}`).join('\n');

    const systemPrompt = `You are an expert sales conversation analyst. Analyze conversations based on the Zero-Stress Sales framework with 7 Pillars and 27 Indicators.

${csvContext}

PROSPECT-SPECIFIC CONTEXT:
${prospectContext || 'No prospect-specific context available.'}

DIAGNOSTIC QUESTIONS FOR THIS PROSPECT TYPE (${prospectType}):
${questionsList}

CONVERSATION CONTEXT:
This is a REAL-TIME sales conversation between TWO people:
1. SALESPERSON (Closer) - Asking diagnostic questions, probing for pain points, building rapport
2. PROSPECT (Seller) - Responding with their situation, concerns, objections, and emotional state

The transcript captures BOTH voices. You must:
- Identify WHO is speaking based on context (questions = salesperson, answers = prospect)
- Focus on the PROSPECT's statements for indicators, hot buttons, and objections
- Focus on the SALESPERSON's statements for detecting diagnostic questions being asked
- Understand that speech-to-text may jumble both voices together

CRITICAL INSTRUCTION: BE EXTREMELY GENEROUS IN DETECTION AND SCORING
- If you see ANY indicator of pain, urgency, desire, trust issues, etc., DETECT IT and SCORE IT HIGH
- Don't be too strict or conservative - err on the side of detecting more and scoring higher
- When in doubt, score 7-9 rather than 4-6
- The goal is to capture ALL signals, even subtle ones, and score them generously
- Include ALL hot buttons that appear, even if subtle
- Include ALL objections, hesitations, and concerns, even if minor
- It's better to over-detect than miss important signals

YOUR TASK:
1. Identify ALL indicators (1-27) from the PROSPECT's statements, scoring them 1-10
2. Identify "hot buttons" - emotional triggers from the prospect (scores >= 6)
3. Identify objections or hesitations from the PROSPECT
4. Detect which diagnostic questions the SALESPERSON asked (match to the list above)

SPEECH RECOGNITION CONTEXT:
- The transcript may have messy speech-to-text artifacts
- Words may be repeated due to real-time transcription
- Extract the MEANING and INTENT, not literal text
- Both speakers' words are mixed together - use context clues

DETECTING HOT BUTTONS (from PROSPECT's statements):
Hot buttons are emotional triggers that indicate the prospect is motivated. Look for ANY of these patterns:

PAIN/HURT (ID 1): "I'm done", "can't take it anymore", "exhausted", "frustrated", "stressed"
DESIRE (ID 2-3): "I want", "I need", "I'm looking for", "would be great", "dream of"
TIME PRESSURE (ID 5): "auction in X days", "deadline", "need to decide soon", "running out of time"
COST OF DELAY (ID 6): "losing money", "costing me", "every day it gets worse"
TIMING ACTIVATION (ID 7): "can't wait", "now is the time", "something changed"
COMMITMENT (ID 11): "ready to decide", "want to move forward", "let's do this"
TRUST (ID 25-26): "trust you", "believe this will work", OR "not sure", "skeptical", "worried"
CONTROL (ID 19): "it's up to me", "I control this", "my decision"

IMPORTANT: Score generously (6-10) if ANY of these themes appear - don't be too strict.

DETECTING OBJECTIONS (from PROSPECT):
Objections are hesitations, concerns, or pushback. Look for:
- "But...", "However...", "I'm not sure...", "What if...", "I'm worried...", "Sounds too good to be true"
- "I need to think about it", "Can I get back to you?", "Not sure this will work"
- Price concerns: "too expensive", "can't afford", "need a better deal"
- Trust concerns: "how do I know", "sounds like a scam", "why should I trust you"
- Timing: "too fast", "need more time", "not ready"
- Authority: "need to ask my spouse", "not my decision alone"

ANY hesitation or concern counts as an objection - be generous in detection.

You MUST return ONLY valid JSON (no markdown, no text outside JSON).

Required JSON format:
{
  "indicatorSignals": { "1": 8, "2": 7, "5": 9 },
  "hotButtonDetails": [
    { 
      "id": 1, 
      "quote": "Clean summary of what they said",
      "contextualPrompt": "Custom follow-up question based on what they said"
    }
  ],
  "objections": [
    {
      "objectionText": "The objection they raised",
      "fear": "The underlying fear",
      "whisper": "Short insight (1 sentence)",
      "rebuttalScript": "Full response script (2-3 sentences - MUST be different from whisper)",
      "probability": 0.85
    }
  ],
  "askedQuestions": [0, 1, 2],
  "insights": "Brief summary"
}

CRITICAL RULES - SCORE ALL 27 INDICATORS:

1. indicatorSignals: Score ALL 27 indicators from PROSPECT statements (1-10). 
   **MANDATORY: You MUST score indicators that appear (score >= 6), but ALSO include indicators that are relevant even if score < 6.**
   
   Scoring Guidelines (BE GENEROUS - SCORE HIGH WHEN YOU SEE SIGNALS):
   - High (7-10): Strong, clear signal - USE THIS RANGE LIBERALLY
   - Mid (4-6): Moderate signal - ONLY use if signal is weak or ambiguous
   - Low (1-3): Weak signal or absence of signal
   
   **SCORE GENEROUSLY**: When you detect a signal, default to 7-9 range. Only use 4-6 if truly moderate.
   
   Examples (NOTE THE HIGH SCORES):
   - "I'm 3 months behind on payments, auction in 2 weeks, I'm terrified" 
     -> {"1": 10, "5": 10, "6": 10, "2": 9} (Pain Intensity, Time Pressure, Cost of Delay, Pain Awareness)
   - "I have $15k available, price is fair, worth it if it works" 
     -> {"13": 9, "15": 9, "21": 2, "22": 2} (Resource Access, Investment Mindset, LOW Price Sensitivity)
   - "It's my decision, I'm ready to commit today" 
     -> {"9": 10, "11": 10, "12": 9} (Authority, Commitment, Self-Permission)
   - "I take responsibility, it's on me to fix this" 
     -> {"17": 10, "18": 10, "19": 9, "20": 9} (Problem Recognition, Solution Ownership, Locus of Control, Integrity)
   - "I trust you, I believe this will work, worth the risk" 
     -> {"25": 9, "26": 8, "27": 9} (External Trust, Internal Trust, Risk Tolerance)
   - "I'm done with this, can't take it anymore, need to sell now"
     -> {"1": 10, "2": 9, "5": 9, "7": 10} (Pain Intensity, Pain Awareness, Time Pressure, Internal Timing)
   
   **CRITICAL FOR LUBOMETER:**
   - P1 (Indicators 1-4): Pain & Desire - Weight 1.5x (most important!) - SCORE 8-10 when detected
   - P4 (Indicators 13-16): Money - Weight 1.5x (most important!) - SCORE 8-10 when detected
   - P6 (Indicators 21-23): Price Sensitivity - REVERSED (low sensitivity = high score)
     * If they say "price is fair", "worth it", "not worried about cost" -> Score 21, 22, 23 as LOW (1-3)
     * If they say "too expensive", "need discount" -> Score 21, 22, 23 as HIGH (7-9)

2. hotButtonDetails: ARRAY of objects. YOU MUST GENERATE THIS FOR EVERY DETECTED HOT BUTTON.
   Hot button IDs: 1, 2, 3, 4, 5, 6, 7, 11, 12, 15, 16, 17, 18, 19, 20, 24, 25, 26, 27
   
   **CRITICAL - BOTH FIELDS ARE MANDATORY:**
   
   A) "quote" - MUST be EXACT VERBATIM WORDS from the transcript (COPY-PASTE ONLY):
       **THIS IS THE MOST CRITICAL REQUIREMENT - FOLLOW THESE STEPS EXACTLY:**
       
       1. Read the transcript carefully
       2. Find the EXACT phrase where the prospect said something relevant to this hot button
       3. SELECT and COPY that exact phrase word-for-word - DO NOT MODIFY IT
       4. Paste it into the "quote" field - character-for-character match required
       
       **STRICT RULES - NO EXCEPTIONS:**
       - DO NOT paraphrase, summarize, reword, or make up quotes
       - DO NOT add words that weren't in the transcript
       - DO NOT remove words that were in the transcript
       - DO NOT change word order
       - DO NOT use generic descriptions like "The prospect expressed concern" or "They mentioned time pressure"
       - DO NOT create quotes that summarize - ONLY copy exact words
       
       **EXAMPLES - EXACT PROCESS:**
       
       Transcript: "I'm 4 months behind on my mortgage payments. The auction is in 10 days and I'm absolutely terrified of losing my home. I have $15,000 saved that I could use right away."
       
       CORRECT (copy exact phrase):
       - For Pain Awareness (ID 1): Find "I'm absolutely terrified of losing my home" in transcript -> quote: "I'm absolutely terrified of losing my home"
       - For Time Pressure (ID 5): Find "The auction is in 10 days" in transcript -> quote: "The auction is in 10 days"
       - For Cost of Delay (ID 6): Find "I'm 4 months behind on my mortgage payments" -> quote: "I'm 4 months behind on my mortgage payments"
       - For Resource Access (ID 13): Find "I have $15,000 saved that I could use right away" -> quote: "I have $15,000 saved that I could use right away"
       
       WRONG (DO NOT DO THIS):
       - "The prospect is terrified of losing their home" (changed words)
       - "They are behind on payments" (paraphrased)
       - "They mentioned time pressure with the auction" (generic description)
       - "Prospect has $15k available" (changed wording)
       
       **HOW TO FIND THE EXACT QUOTE:**
       - Search the transcript for the key phrase
       - Select the minimum words needed to capture the meaning (usually 5-20 words)
       - Copy it exactly as written, including punctuation if relevant
       - Keep it concise but COMPLETE - include enough context to make sense
       - If the phrase appears multiple times, use the most relevant/emotional instance
   
   B) "contextualPrompt" - MUST be a custom follow-up question YOU generate:
      - Create a personalized question based on what they specifically said
      - Reference their exact situation/words
      - Example: If they said auction is in 2 weeks, ask "With only 2 weeks until the auction, what would it mean for your family if we found a solution?"
   
   CORRECT EXAMPLE:
   Transcript: "I'm 4 months behind on payments and the auction is in 10 days. I'm absolutely terrified of losing my home."
   
   PROCESS:
   1. Read transcript: "I'm 4 months behind on payments and the auction is in 10 days. I'm absolutely terrified of losing my home."
   2. For Pain Awareness (ID 1): Find "I'm absolutely terrified of losing my home" -> COPY EXACTLY
   3. For Time Pressure (ID 5): Find "the auction is in 10 days" -> COPY EXACTLY  
   4. For Cost of Delay (ID 6): Find "I'm 4 months behind on payments" -> COPY EXACTLY
   
   RESULT:
   hotButtonDetails: [
     {"id": 1, "quote": "I'm absolutely terrified of losing my home", "contextualPrompt": "That fear of losing your home after 4 months of struggle - what would change if we could stop that auction?"},
     {"id": 5, "quote": "the auction is in 10 days", "contextualPrompt": "10 days is very tight. If we can't find a solution before the auction, what happens to your family?"},
     {"id": 6, "quote": "I'm 4 months behind on payments", "contextualPrompt": "Being 4 months behind - what has that cost you in sleep and peace of mind?"}
   ]
   
   WRONG EXAMPLES (DO NOT DO THIS):
   {"id": 5, "quote": "The prospect has time pressure", "contextualPrompt": "How does that make you feel?"}  // WRONG: Paraphrased, not exact
   {"id": 1, "quote": "The prospect expressed fear about foreclosure", "contextualPrompt": "..."}  // WRONG: Generic description, not exact quote
   {"id": 6, "quote": "They are behind on their mortgage", "contextualPrompt": "..."}  // WRONG: Changed wording, not exact
   
3. objections: Include ALL hesitations, concerns, or pushback from PROSPECT.
   BE GENEROUS - any doubt or concern counts as an objection.
   
   Examples:
   - "Are you sure this will work?" -> objectionText: "Are you sure this will work?", fear: "Uncertainty about solution effectiveness"
   - "I'm not sure, sounds too good" -> objectionText: "I'm not sure, sounds too good to be true", fear: "Fear of being scammed"
   - "Can I think about it?" -> objectionText: "Can I think about it?", fear: "Need more time to process"
   
   Fields:
   - objectionText: Exact or cleaned quote from prospect
   - fear: Underlying emotional concern (why they're hesitating)
   - whisper: Short insight (1 sentence max) - e.g., "They need proof and social validation"
   - rebuttalScript: Full response (2-3 sentences) - e.g., "I understand your concern. Many clients felt the same way initially. Would it help if I shared some testimonials from homeowners we've helped in similar situations?"
   - probability: 0.85 (if explicit), 0.75 (if moderate), 0.65 (if implied)

4. askedQuestions: Questions the SALESPERSON asked (ONLY SALESPERSON, NOT PROSPECT).
   Match SEMANTICALLY to diagnostic questions list above. Return array of indices (0-based).
   
   **CRITICAL RULES FOR DIAGNOSTIC QUESTIONS:**
   - ONLY detect questions asked BY THE SALESPERSON (the person conducting the sales call)
   - DO NOT detect questions asked by the prospect
   - Match questions SEMANTICALLY - the exact wording doesn't need to match, but the MEANING must match
   - Example: If diagnostic question is "How many days until your auction date?" and salesperson asks "When is your auction?" -> MATCH (index should be included)
   - Example: If prospect says "How many days until the auction?" -> DO NOT MATCH (prospect asking, not salesperson)
   
   SPEAKER IDENTIFICATION (CRITICAL):
   - Salesperson: asks diagnostic questions, probes for information, offers solutions, provides reassurance, uses professional language
   - Prospect: answers questions, shares problems, raises objections, expresses emotions, uses personal language
   - If you're unsure who asked a question, DO NOT include it in askedQuestions
   
   NEGATIVE EXAMPLES (DO NOT DETECT THESE):
   - Prospect: "How many days until the auction?" -> NOT a diagnostic question (prospect asking)
   - Prospect: "What would happen if I lost this property?" -> NOT a diagnostic question (prospect asking)
   - Salesperson: "How are you doing today?" -> NOT a diagnostic question (not in the list)`;

    console.log(`[AI] Calling ${ANALYSIS_MODEL} (${cleanedTranscript.length} chars)`);

    // Build request - some models don't support response_format
    const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const requestBody = {
      model: ANALYSIS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt + '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' },
        {
          role: 'user', content: `Analyze this TWO-PERSON sales conversation.

COMPLETE EXAMPLE OF CORRECT OUTPUT:
Transcript: "I'm 4 months behind on payments. The auction is in 10 days and I'm absolutely terrified of losing my home. I have $15,000 saved that I could use. Price is fair if it works. It's my decision and I'm ready to commit today. I take full responsibility. I trust you can help."

CORRECT OUTPUT:
{
  "indicatorSignals": {
    "1": 9, "2": 8, "3": 7, "4": 9, "5": 10, "6": 10, "7": 8,
    "9": 9, "11": 9, "13": 8, "15": 9, "17": 8, "21": 2, "22": 2, "25": 8
  },
  "hotButtonDetails": [
    {"id": 1, "quote": "I'm absolutely terrified of losing my home", "contextualPrompt": "That terror of losing your family's home - what would it mean to finally have that weight lifted?"},
    {"id": 5, "quote": "The auction is in 10 days", "contextualPrompt": "With only 10 days until auction, what happens to your family if we can't find a solution in time?"},
    {"id": 6, "quote": "I'm 4 months behind on payments", "contextualPrompt": "Being 4 months behind - how much has that cost you in peace of mind and sleepless nights?"},
    {"id": 11, "quote": "I'm ready to commit today", "contextualPrompt": "You said you're ready today - what would it take for you to feel confident moving forward right now?"},
    {"id": 15, "quote": "Price is fair if it works", "contextualPrompt": "You see this as an investment. If this solves your problem, what would that be worth to you?"},
    {"id": 17, "quote": "I take full responsibility", "contextualPrompt": "Taking responsibility is powerful. What would it look like to turn that into action today?"},
    {"id": 25, "quote": "I trust you can help", "contextualPrompt": "That trust means a lot. What specifically made you feel confident we can help?"}
  ],
  "objections": [],
  "askedQuestions": [],
  "insights": "High urgency prospect with strong pain, available resources, and trust."
}

NOW ANALYZE THIS CONVERSATION:
Transcript:
"${cleanedTranscript}"

**CRITICAL REMINDER FOR HOT BUTTON QUOTES:**
1. Read the transcript above carefully
2. For each hot button you detect, find the EXACT phrase in the transcript
3. COPY that phrase word-for-word into the "quote" field
4. DO NOT paraphrase, summarize, or change any words
5. Every word in the quote MUST appear in the transcript exactly as written
6. If you cannot find an exact phrase, do not include that hot button - only include quotes that exist verbatim in the transcript

**SCORE ALL 27 INDICATORS** that appear in the conversation. Use scores 1-10 based on strength of signal.
For Price Sensitivity (21-23): LOW scores (2-3) = good (low sensitivity), HIGH scores (7-9) = bad (high sensitivity).
Return valid JSON only.` }
      ],
      temperature: 0.0, // Zero for maximum consistency and generous scoring
      max_tokens: 2500 // Increased to allow for more hot buttons and objections
    };

    // Only add response_format for OpenAI models (Gemini handles JSON differently)
    if (!isOpenRouter || ANALYSIS_MODEL.includes('openai')) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await openai.chat.completions.create(requestBody);

    let aiContent = response.choices[0].message.content;
    console.log(`[AI] Response in ${Date.now() - startTime}ms (${aiContent.length} chars) from ${ANALYSIS_MODEL}`);

    // Clean up response if it has markdown code blocks
    if (aiContent.includes('```json')) {
      aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (aiContent.includes('```')) {
      aiContent = aiContent.replace(/```\n?/g, '');
    }

    try {
      const parsed = JSON.parse(aiContent);
      console.log(`[AI] Parsed successfully:`, {
        indicators: Object.keys(parsed.indicatorSignals || {}).length,
        hotButtons: (parsed.hotButtonDetails || []).length,
        objections: (parsed.objections || []).length,
        askedQuestions: (parsed.askedQuestions || []).length
      });

      // Log hot button details for debugging
      if (parsed.hotButtonDetails && parsed.hotButtonDetails.length > 0) {
        console.log(`[AI] Hot Button Details from AI:`);
        for (const hb of parsed.hotButtonDetails) {
          console.log(`  ID ${hb.id}: quote="${(hb.quote || '').substring(0, 50)}..." prompt="${(hb.contextualPrompt || '').substring(0, 50)}..."`);
        }
      } else {
        console.log(`[AI] WARNING: No hotButtonDetails returned by AI!`);
      }

      return parsed;
    } catch (parseError) {
      console.warn(`[AI] JSON parse error: ${parseError.message}`);
      console.warn(`[AI] Raw content: ${aiContent.substring(0, 500)}`);
      return { insights: aiContent, raw: true };
    }
  } catch (error) {
    console.error(`[AI] Error after ${Date.now() - startTime}ms:`, error.message);
    return { error: error.message };
  }
}


function extractDials(transcript, aiAnalysis = null) {
  // Dials are now derived from AI analysis - no keyword patterns
  // Returns empty dials - UI can derive from pillar scores if needed
  return {
    urgency: '',
    trust: '',
    authority: '',
    structure: ''
  };
}


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
    hotButtons: [], // FIXED: Return empty array instead of object
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
    timestamp: new Date().toISOString()
  };
}

