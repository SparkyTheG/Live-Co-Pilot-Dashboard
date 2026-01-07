/**
 * Multi-Agent AI System for Real-Time Sales Analysis
 * 
 * OPTIMIZED: Each agent has minimal, focused prompts for speed and efficiency.
 * Each agent ONLY analyzes information relevant to its specific output.
 * 
 * LUBOMETER AGENTS (7 parallel agents - one per pillar):
 *   P1 Agent → indicators 1-4 (Pain & Desire)
 *   P2 Agent → indicators 5-8 (Urgency)
 *   P3 Agent → indicators 9-12 (Decisiveness)
 *   P4 Agent → indicators 13-16 (Money)
 *   P5 Agent → indicators 17-20 (Responsibility)
 *   P6 Agent → indicators 21-23 (Price Sensitivity)
 *   P7 Agent → indicators 24-27 (Trust)
 * 
 * OTHER AGENTS:
 * - Hot Buttons Agent → emotional triggers with quotes
 * - Objections System (4 sub-agents): Detection, Fear, Whisper, Rebuttal
 * - Diagnostic Agent → questions asked
 * - Truth Index Agent → coherence/incoherence (T1-T5 rules)
 * - Insights Agent → summary and recommendations
 */

import OpenAI from 'openai';

let openaiClient = null;
function getOpenAIClient() {
  if (openaiClient) return openaiClient;
  const apiKey = String(process.env.OPENAI_API_KEY || '');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing');
  }
  openaiClient = new OpenAI({
    apiKey,
    timeout: 8000, // 8s timeout for faster failure detection
    maxRetries: 0 // No retries - fail fast to prevent freezing
  });
  return openaiClient;
}

const MODEL = 'gpt-4o-mini';

// Request queue to prevent rate limiting
let activeRequests = 0;
const MAX_CONCURRENT = 6; // Max 6 concurrent OpenAI requests (balanced for speed + stability)
const requestQueue = [];

async function throttledRequest(fn) {
  // Wait in queue if too many active requests
  while (activeRequests >= MAX_CONCURRENT) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  activeRequests++;
  try {
    return await fn();
  } finally {
    activeRequests--;
  }
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

/**
 * Helper: Call AI with optimized settings per agent
 * - Enforces JSON output (reduces parse failures + reduces verbosity)
 * - Adds per-call timeout so one slow agent doesn't block everything
 */
async function callAI(systemPrompt, userPrompt, agentName, maxTokensOrOptions = 800) {
  const startTime = Date.now();
  const opts = typeof maxTokensOrOptions === 'number'
    ? { maxTokens: maxTokensOrOptions }
    : (maxTokensOrOptions || {});

  const maxTokens = Number(opts.maxTokens ?? 200);    // Small focused outputs
  const timeoutMs = Number(opts.timeoutMs ?? 4000);   // Fast 4s timeout

  const doCall = async (signal) => {
    const openai = getOpenAIClient();
    const baseReq = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.0,
      max_tokens: maxTokens
    };

    let response;
    try {
      // Prefer strict JSON output if supported by the API/model
      response = await openai.chat.completions.create(
        { ...baseReq, response_format: { type: 'json_object' } },
        // IMPORTANT: signal must be passed as a request option (not in the JSON body),
        // otherwise the API rejects it: "Unrecognized request argument supplied: signal"
        { signal }
      );
    } catch (e) {
      // Fallback for older API behavior: no response_format
      response = await openai.chat.completions.create(
        baseReq,
        { signal }
      );
    }

    let content = response?.choices?.[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(content);
    } catch {
      // Clean common markdown fences (fallback path)
      content = String(content).replace(/```json\n?/g, '').replace(/```\n?/g, '');
      // Ultra-defensive fallback: extract first JSON object if the model emits extra text
      const m = String(content).match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      return { error: 'Invalid JSON from model' };
    }
  };

  try {
    // IMPORTANT: Use AbortController so timeouts actually cancel the underlying request.
    // Without abort, hung requests can occupy concurrency slots forever and the app "stops updating".
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try { controller.abort(); } catch {}
    }, timeoutMs);

    let result;
    try {
      result = await throttledRequest(() => doCall(controller.signal));
    } finally {
      clearTimeout(timer);
    }

    console.log(`[${agentName}] Done in ${Date.now() - startTime}ms`);
    return result;
  } catch (error) {
    const msg = String(error?.message || error || '');
    const name = String(error?.name || '');
    const isAbort =
      name === 'AbortError' ||
      msg.toLowerCase().includes('aborted') ||
      msg.toLowerCase().includes('abort') ||
      msg.toLowerCase().includes('timeout');

    if (isAbort) {
      console.warn(`[${agentName}] Timeout/Abort after ${timeoutMs}ms`);
      return { error: `timeout after ${timeoutMs}ms` };
    }

    console.error(`[${agentName}] Error: ${msg}`);
    return { error: msg };
  }
}

// ============================================================================
// LUBOMETER: 7 PILLAR AGENTS (run in parallel)
// Each agent scores only its pillar's indicators
// ============================================================================

/**
 * P1 AGENT: Pain & Desire (indicators 1-4)
 * Weight: 1.5x - MOST IMPORTANT
 */
async function runP1Agent(transcript) {
  const systemPrompt = `Score PILLAR 1: PAIN & DESIRE from prospect statements.

INDICATORS (1-10 scale):
1. Pain Intensity: How severe? (1=no pain, 5=moderate concern, 10=crisis)
2. Pain Awareness: Do they understand root cause? (1=confused, 5=some clarity, 10=crystal clear)
3. Desire Clarity: How specific? (1=vague, 5=some goals, 10=vivid vision)
4. Desire Priority: How important? (1=low, 5=moderate, 10=urgent priority)

WHAT TO LOOK FOR:
- Pain words: worried, stressed, frustrated, can't, problem, issue, struggling
- Desire words: want, need, looking for, hope, goal, wish, must have
- Score 6-8 for clear signals, 4-6 for moderate, 7-10 for strong

Return ONLY: {"1":6,"2":5,"3":7,"4":6}`;

  const userPrompt = `Score:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P1-PainDesire', 150);
}

/**
 * P2 AGENT: Urgency (indicators 5-8)
 */
async function runP2Agent(transcript) {
  const systemPrompt = `Score PILLAR 2: URGENCY from prospect speech.

INDICATORS (1-10 scale):
5. Time Pressure: Real deadlines? (1=none, 5=flexible, 10=imminent like auction)
6. Cost of Delay: Losses from waiting? (1=none, 5=some, 10=major losses)
7. Internal Timing: Hit breaking point? (1=no, 5=considering, 10=can't continue)
8. Availability: Ready to act? (1=too busy, 5=could, 10=ready now)

WHAT TO LOOK FOR:
- Deadlines: auction, foreclosure, expires, days left, running out
- Costs: losing money, wasting time, opportunity cost
- Breaking point: had enough, can't anymore, need change now
- Score 6-8 for clear signals

Return ONLY: {"5":6,"6":5,"7":7,"8":6}`;

  const userPrompt = `Score:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P2-Urgency', 150);
}

/**
 * P3 AGENT: Decisiveness (indicators 9-12)
 */
async function runP3Agent(transcript) {
  const systemPrompt = `Score PILLAR 3: DECISIVENESS from prospect speech.

INDICATORS (1-10 scale):
9. Authority: Decision maker? (1=many approvals needed, 5=shared, 10=sole decision)
10. Decision Style: How fast? (1=very slow, 5=normal, 10=fast/intuitive)
11. Commitment: Ready now? (1=wait indefinitely, 5=considering, 10=ready today)
12. Self-Permission: Trust self? (1=overthinks, 5=normal, 10=confident)

WHAT TO LOOK FOR:
- Authority: "I decide", "my choice" vs "ask spouse", "need approval"
- Speed: "let's do it", "ready now" vs "think about it", "research more"
- Score 3-5 for hesitation, 6-8 for confidence

Return ONLY: {"9":6,"10":5,"11":7,"12":6}`;

  const userPrompt = `Score:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P3-Decisiveness', 150);
}

/**
 * P4 AGENT: Money (indicators 13-16)
 * Weight: 1.5x - MOST IMPORTANT
 */
async function runP4Agent(transcript) {
  const systemPrompt = `Score PILLAR 4: AVAILABLE MONEY indicators (1-10) from PROSPECT statements.

INDICATORS TO SCORE:
13. Resource Access: Do they have funds available? (1=no funds, 10=readily available)
14. Resource Fluidity: Can they move/reallocate money? (1=all tied up, 10=very flexible)
15. Investment Mindset: See it as investment vs cost? (1=pure cost mindset, 10=investment mindset)
16. Resourcefulness: History of finding money when committed? (1=never, 10=always figures it out)

WHAT TO LOOK FOR:
- Has money: "have savings", "can afford", "money's not the issue"
- No money: "can't afford", "don't have funds", "tight budget"
- Investment view: "worth it", "good investment", "ROI" vs "expensive", "costs too much"
- Resourceful: "I'll figure it out", "find a way", "make it work"

Score generously for clear signals. This pillar has 1.5x weight.
Return ONLY: {"13":7,"14":6,"15":8,"16":7}`;

  const userPrompt = `Score Money indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P4-Money', 150);
}

/**
 * P5 AGENT: Responsibility (indicators 17-20)
 */
async function runP5Agent(transcript) {
  const systemPrompt = `Score PILLAR 5: RESPONSIBILITY & OWNERSHIP indicators (1-10) from PROSPECT statements.

INDICATORS TO SCORE:
17. Problem Recognition: Do they acknowledge their role? (1=blames everyone else, 10=fully owns it)
18. Solution Ownership: Taking responsibility to change? (1=waiting for rescue, 10=it's on me)
19. Locus of Control: Believe they control outcomes? (1=victim mindset, 10=I control my fate)
20. Desire vs Action Alignment: Do their wants match their actions? (1=all talk, 10=walks the walk)

WHAT TO LOOK FOR:
- Ownership: "my fault", "I should have", "I need to fix this"
- vs blame: "they did this", "market's fault", "not fair", "can't control"
- Action-oriented: "I'm going to", "working on it" vs "wish someone would"

Score generously for clear signals.
Return ONLY: {"17":6,"18":7,"19":5,"20":6}`;

  const userPrompt = `Score Responsibility indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P5-Responsibility', 150);
}

/**
 * P6 AGENT: Price Sensitivity (indicators 21-23)
 * NOTE: This pillar is REVERSE SCORED - LOW scores are GOOD
 */
async function runP6Agent(transcript) {
  const systemPrompt = `Score PILLAR 6: PRICE SENSITIVITY indicators (1-10) from PROSPECT statements.

⚠️ REVERSE SCORING: For this pillar, LOW scores (1-3) are GOOD, HIGH scores (7-10) are BAD

INDICATORS TO SCORE:
21. Emotional Response to Spending: Anxiety about investment? (1=not anxious, 10=very anxious)
22. Negotiation Reflex: Always trying to negotiate? (1=accepts fair price, 10=always haggles)
23. Structural Rigidity: Needs total control over terms? (1=flexible, 10=rigid on terms)

WHAT TO LOOK FOR (score HIGH if these appear):
- Price anxiety: "too expensive", "can't justify", "worried about cost"
- Negotiating: "can you lower", "what's the best price", "discount"
- Rigid: "must be exactly", "won't budge on", "non-negotiable terms"

WHAT TO LOOK FOR (score LOW if these appear):
- Price acceptance: "fair price", "worth it", "not worried about cost"
- Flexible: "whatever works", "can adjust", "open to options"

Return ONLY: {"21":4,"22":3,"23":5}`;

  const userPrompt = `Score Price Sensitivity indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P6-PriceSensitivity', 150);
}

/**
 * P7 AGENT: Trust (indicators 24-27)
 */
async function runP7Agent(transcript) {
  const systemPrompt = `Score PILLAR 7: TRUST indicators (1-10) from PROSPECT statements.

INDICATORS TO SCORE:
24. ROI Ownership: Understand ROI depends on their action? (1=expects guarantees, 10=owns outcomes)
25. External Trust: Trust in provider/offer? (1=very skeptical, 10=high trust)
26. Internal Trust: Trust in own follow-through? (1=doubts self, 10=trusts self)
27. Risk Tolerance: Willing to take calculated risks? (1=plays very safe, 10=embraces smart risks)

WHAT TO LOOK FOR:
- Trust: "I believe", "trust you", "makes sense", "sounds good"
- Skepticism: "not sure", "prove it", "guarantee?", "what if it fails"
- Self-trust: "I can do this", "I'll make it work" vs "probably won't follow through"
- Risk: "worth the risk", "let's try" vs "too risky", "what if"

Score generously for clear signals.
Return ONLY: {"24":6,"25":7,"26":5,"27":6}`;

  const userPrompt = `Score Trust indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P7-Trust', 150);
}

/**
 * RUN ALL 7 PILLAR AGENTS IN PARALLEL
 * Combines results into single indicatorSignals object
 */
export async function runAllPillarAgents(transcript) {
  console.log(`[Lubometer] Starting 7 pillar agents in parallel...`);
  const startTime = Date.now();

  // Run all 7 pillar agents in parallel
  const [p1, p2, p3, p4, p5, p6, p7] = await Promise.all([
    runP1Agent(transcript),
    runP2Agent(transcript),
    runP3Agent(transcript),
    runP4Agent(transcript),
    runP5Agent(transcript),
    runP6Agent(transcript),
    runP7Agent(transcript)
  ]);

  // Combine all indicator scores
  const indicatorSignals = {
    ...p1, // 1-4
    ...p2, // 5-8
    ...p3, // 9-12
    ...p4, // 13-16
    ...p5, // 17-20
    ...p6, // 21-23
    ...p7  // 24-27
  };

  // Remove any error properties
  delete indicatorSignals.error;

  console.log(`[Lubometer] All 7 pillar agents done in ${Date.now() - startTime}ms`);
  console.log(`[Lubometer] Scored ${Object.keys(indicatorSignals).length} indicators`);

  return {
    indicatorSignals,
    pillarErrors: {
      P1: p1.error || null,
      P2: p2.error || null,
      P3: p3.error || null,
      P4: p4.error || null,
      P5: p5.error || null,
      P6: p6.error || null,
      P7: p7.error || null
    }
  };
}

// ============================================================================
// AGENT 2: HOT BUTTONS AGENT
// Output: hotButtonDetails (emotional triggers with quotes)
// ============================================================================
export async function runHotButtonsAgent(transcript) {
  const systemPrompt = `Find emotional triggers from PROSPECT speech in this sales conversation.

INDICATOR IDS (choose most relevant):
1-4: Pain/Desire (worried, stressed, frustrated, want, need, hope, looking for)
5-8: Urgency (deadline, auction, soon, running out, can't wait, now)
9-12: Decisiveness (I decide, ready, let's do it, committed)
13-16: Money (afford, budget, expensive, cost, investment, financing)
17-20: Responsibility (my fault, I should, need to fix, responsible for)
21-23: Price Sensitivity (too much, cheaper, discount, better deal)
24-27: Trust (not sure, skeptical, prove it, guarantee, really work)

OUTPUT per trigger:
- id: indicator number 1-27
- quote: Extract meaningful phrase from transcript (3-15 words, can paraphrase slightly)
- contextualPrompt: Follow-up question (8 words max)
- score: 5-9 (5=mild, 7=clear, 9=intense)

Return: {"hotButtonDetails":[{"id":1,"quote":"prospect's concern here","contextualPrompt":"What worries you?","score":7}]}
Return 2-4 most important triggers. If truly nothing detected, return empty array.`;

  const userPrompt = `Transcript:\n"${transcript}"`;

  console.log(`[HotButtonsAgent] INPUT: transcript length=${transcript?.length||0}, preview="${transcript?.slice(0,80)||'EMPTY'}"`);
  const result = await callAI(systemPrompt, userPrompt, 'HotButtonsAgent', 400);
  console.log(`[HotButtonsAgent] OUTPUT: hotButtonDetails=${result?.hotButtonDetails?.length||0}, error=${result?.error||'none'}, keys=${Object.keys(result||{}).join(',')}`);
  
  return result;
}

// ============================================================================
// OBJECTIONS SYSTEM: 4 Focused Agents
// ============================================================================

/**
 * AGENT 3a: OBJECTION DETECTION
 * Output: detectedObjections [{objectionText, probability}]
 */
export async function runObjectionDetectionAgent(transcript) {
  const systemPrompt = `Detect prospect objections, concerns, or hesitations in this sales conversation.

OBJECTION PATTERNS:
- Price: expensive, cost, afford, money, budget, too much, cheaper
- Timing: think about it, wait, later, not ready, need time, maybe
- Trust: not sure, skeptical, guarantee, proof, really work, sounds too good
- Authority: ask spouse/partner, need to talk to, not my decision
- Competition: other options, shopping around, comparing, another company
- Fear: worried, nervous, what if, concerned, scared

RULES:
- objectionText should capture the concern (can paraphrase if needed, 5-20 words)
- Include hesitations and concerns, not just direct objections
- Probability: 0.8-0.95 for clear objections, 0.65-0.8 for hesitations
- Return 1-3 most important objections

Return: {"detectedObjections":[{"objectionText":"prospect concern here","probability":0.85}]}`;

  const userPrompt = `Detect objections:\n"${transcript}"`;

  console.log(`[ObjectionDetectionAgent] INPUT: transcript length=${transcript?.length||0}, preview="${transcript?.slice(0,80)||'EMPTY'}"`);
  const result = await callAI(systemPrompt, userPrompt, 'ObjectionDetectionAgent', 200);
  console.log(`[ObjectionDetectionAgent] OUTPUT: detectedObjections=${result?.detectedObjections?.length||0}, error=${result?.error||'none'}`);
  
  return result;
}

/**
 * AGENT 3b: FEAR ANALYSIS
 * Input: detected objections
 * Output: fears [{objectionIndex, fear}]
 */
export async function runFearAnalysisAgent(detectedObjections) {
  if (!detectedObjections || detectedObjections.length === 0) {
    return { fears: [] };
  }

  const objectionsList = detectedObjections.map((obj, idx) => 
    `${idx}. "${obj.objectionText}"`
  ).join('\n');

  const systemPrompt = `Identify the UNDERLYING FEAR behind each objection. Be specific and psychological.

FEAR PATTERNS:
"expensive" → Fear of wasting money, making wrong financial choice
"need to think" → Fear of commitment, making wrong decision
"not sure it works" → Fear of failure, disappointment
"ask spouse" → Fear of conflict, not being in control
"tried before" → Fear of repeating past failures

Return: {"fears":[{"objectionIndex":0,"fear":"Fear of making a financial mistake"}]}`;

  const userPrompt = `Identify underlying fears:\n${objectionsList}`;

  return await callAI(systemPrompt, userPrompt, 'FearAgent', 150);
}

/**
 * AGENT 3c: WHISPER/REFRAME
 * Input: detected objections
 * Output: whispers [{objectionIndex, whisper}]
 */
export async function runWhisperReframeAgent(detectedObjections) {
  if (!detectedObjections || detectedObjections.length === 0) {
    return { whispers: [] };
  }

  const objectionsList = detectedObjections.map((obj, idx) => 
    `${idx}. "${obj.objectionText}"`
  ).join('\n');

  const systemPrompt = `Generate a SHORT insight ("whisper") for each objection. This is an internal thought for the salesperson.

FORMAT: "They need..." or "They want..." (under 12 words)

EXAMPLES:
"expensive" → "They need to see value before price"
"think about it" → "They need certainty before committing"
"ask spouse" → "They need to feel in control"

Return: {"whispers":[{"objectionIndex":0,"whisper":"They need to see immediate value"}]}`;

  const userPrompt = `Generate whisper insights:\n${objectionsList}`;

  return await callAI(systemPrompt, userPrompt, 'WhisperAgent', 150);
}

/**
 * AGENT 3d: REBUTTAL SCRIPT
 * Input: detected objections + customScriptPrompt
 * Output: rebuttals [{objectionIndex, rebuttalScript}]
 */
export async function runRebuttalScriptAgent(detectedObjections, customScriptPrompt = '') {
  if (!detectedObjections || detectedObjections.length === 0) {
    return { rebuttals: [] };
  }

  const objectionsList = detectedObjections.map((obj, idx) => 
    `${idx}. "${obj.objectionText}"`
  ).join('\n');

  const customContext = customScriptPrompt?.trim() 
    ? `\nCONTEXT: ${customScriptPrompt}` 
    : '';

  const systemPrompt = `Generate empathetic rebuttal scripts (2-3 sentences each).${customContext}

FORMAT:
1. Start with empathy: "I understand..." / "That's valid..." / "It's natural..."
2. Acknowledge concern genuinely
3. Provide value/next step

Return: {"rebuttals":[{"objectionIndex":0,"rebuttalScript":"I understand. What specific questions can I answer?"}]}`;

  const userPrompt = `Generate rebuttals:\n${objectionsList}`;

  return await callAI(systemPrompt, userPrompt, 'RebuttalAgent', 250);
}

/**
 * COMBINED OBJECTIONS FUNCTION
 * Runs Detection first, then Fear/Whisper/Rebuttal in parallel
 */
export async function runObjectionsAgents(transcript, customScriptPrompt = '') {
  console.log(`[ObjectionsSystem] Starting...`);
  const startTime = Date.now();

  // Step 1: Detect objections
  const detectionResult = await runObjectionDetectionAgent(transcript);
  
  if (detectionResult.error || !detectionResult.detectedObjections?.length) {
    console.log(`[ObjectionsSystem] No objections detected`);
    return { objections: [] };
  }

  const detectedObjections = detectionResult.detectedObjections;
  console.log(`[ObjectionsSystem] ${detectedObjections.length} objections, running 3 sub-agents...`);

  // Step 2: Run Fear, Whisper, Rebuttal in PARALLEL (they only need objections, not full transcript)
  const [fearResult, whisperResult, rebuttalResult] = await Promise.all([
    runFearAnalysisAgent(detectedObjections),
    runWhisperReframeAgent(detectedObjections),
    runRebuttalScriptAgent(detectedObjections, customScriptPrompt)
  ]);

  // Step 3: Combine results
  const objections = detectedObjections.map((obj, idx) => ({
    objectionText: obj.objectionText,
    probability: obj.probability,
    fear: (fearResult.fears || []).find(f => f.objectionIndex === idx)?.fear || 'Fear of uncertainty',
    whisper: (whisperResult.whispers || []).find(w => w.objectionIndex === idx)?.whisper || 'They need reassurance',
    rebuttalScript: (rebuttalResult.rebuttals || []).find(r => r.objectionIndex === idx)?.rebuttalScript || 'Address their concern with empathy.'
  }));

  console.log(`[ObjectionsSystem] Done in ${Date.now() - startTime}ms`);
  return { objections };
}

// ============================================================================
// AGENT 4: DIAGNOSTIC QUESTIONS AGENT
// Output: askedQuestions (indices of questions asked by salesperson)
// ============================================================================
const DIAGNOSTIC_QUESTIONS = {
  'foreclosure': [
    'How many days until auction?',
    'Loan balance vs property value?',
    'Months behind on payments?',
    'Why did this happen?',
    'Talked to lender about options?',
    'Family still living there?',
    'What happens if auction occurs?',
    'Who else is involved in decision?',
    'Listed with agent or other offers?'
  ],
  'creative-seller-financing': [
    'Months behind on payments?',
    'Current loan balance and monthly payment?',
    'Why did you fall behind?',
    'Any foreclosure notices? Auction date?',
    'Other liens or judgments?',
    'Who else involved in decision?',
    'What happens if you lose property?',
    'Listed with agent or other offers?'
  ],
  'distressed-landlord': [
    'How long as landlord?',
    'How many properties?',
    'Current tenant situation?',
    'Monthly negative cash flow?',
    'What incident made you say done?',
    'Property condition?',
    'Self-managing or property manager?',
    'Tried to fix before?'
  ],
  'performing-tired-landlord': [
    'How long in landlord business?',
    'Current monthly cash flow?',
    'What triggered selling consideration?',
    'Time spent managing per month?',
    'What would you do without this property?',
    'Does spouse want you to sell?',
    'Trade income for freedom today?',
    'Calculated time worth vs rental income?'
  ],
  'cash-equity-seller': [
    'Timeline for selling?',
    'Why selling now?',
    'Bottom-line number?',
    'Already purchased next property?',
    'Other offers received?',
    'What to commit today?',
    'Anyone else in decision?',
    'Lower price for guaranteed 7-day close?'
  ]
};

export async function runDiagnosticQuestionsAgent(transcript, prospectType) {
  const questions = DIAGNOSTIC_QUESTIONS[prospectType] || DIAGNOSTIC_QUESTIONS['foreclosure'];
  const questionsList = questions.map((q, idx) => `${idx}. ${q}`).join('\n');
  
  const systemPrompt = `Detect which questions the SALESPERSON asked (semantic match OK).

QUESTIONS:\n${questionsList}

Return: {"askedQuestions":[0,2,5]} (indices of questions asked)`;

  const userPrompt = `Transcript:\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'DiagnosticAgent', 200);
}

// ============================================================================
// AGENT 5: TRUTH INDEX AGENT
// Detects the 5 specific incoherence rules from Truth Index CSV
// Output: detectedRules (T1-T5 with evidence), coherenceSignals, overallCoherence
// ============================================================================
export async function runTruthIndexAgent(transcript) {
  const systemPrompt = `Detect INCOHERENCE patterns (contradictions) in prospect's statements.

INCOHERENCE RULES TO DETECT:

T1: HIGH PAIN + LOW URGENCY (-15 pts)
- Says things like "this is killing me", "can't take it anymore", "so stressed"
- BUT shows no urgency: no deadline, no rush, "whenever", "no hurry"
- Contradiction: Claims suffering but not motivated to act NOW

T2: HIGH DESIRE + LOW DECISIVENESS (-15 pts)  
- Expresses strong desire: "I really want this", "need to change", "desperate"
- BUT avoids decisions: "need to think", "not sure", "maybe later"
- Contradiction: Wants change but won't commit to decision

T3: HIGH MONEY + HIGH PRICE SENSITIVITY (-10 pts)
- Indicates money available: "I have the funds", "can afford it", "money isn't issue"
- BUT resists price: "too expensive", "can you lower price", "need discount"
- Contradiction: Has money but still negotiating hard

T4: CLAIMS AUTHORITY + REVEALS NEED FOR APPROVAL (-10 pts)
- First claims: "I make the decisions", "it's my choice", "I'm the decision maker"
- THEN reveals: "need to ask spouse/partner", "boss needs to approve", "have to check with..."
- Contradiction: Says they decide but actually needs permission

T5: HIGH DESIRE + LOW RESPONSIBILITY (-15 pts)
- Wants results: "I want success", "need this to work", "looking for solution"
- BUT blames others: "it's not my fault", "the market did this", "they made me"
- Contradiction: Wants outcome but doesn't own the problem

For each detected rule, provide:
- ruleId: T1, T2, T3, T4, or T5
- evidence: exact quotes or paraphrased evidence from transcript
- confidence: 0.6-1.0

Also detect POSITIVE coherence:
- Pain + urgency aligned
- Desire + commitment aligned
- Takes full ownership

Return: {
  "detectedRules": [
    {"ruleId": "T4", "evidence": "Said 'I decide' but later 'need to ask my wife'", "confidence": 0.9}
  ],
  "coherenceSignals": ["Pain aligns with urgency - motivated to act"],
  "overallCoherence": "high|medium|low"
}`;

  const userPrompt = `Analyze for incoherence (T1-T5 contradictions):\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'TruthIndexAgent', 600);
}

// NOTE: Speaker detection agent removed (not used; backend uses a simple heuristic).

// ============================================================================
// AGENT 7: INSIGHTS AGENT
// Output: summary, keyMotivators, concerns, recommendation, closingReadiness
// ============================================================================
export async function runInsightsAgent(transcript, prospectType) {
  const systemPrompt = `Provide brief sales insights.

OUTPUT:
- summary: 1-2 sentence situation overview
- keyMotivators: 2-3 driving factors (short phrases)
- concerns: 2-3 blockers (short phrases)
- recommendation: 1 sentence next action
- closingReadiness: "ready" | "almost" | "not_ready"

Return: {"summary":"...","keyMotivators":["..."],"concerns":["..."],"recommendation":"...","closingReadiness":"..."}`;

  const userPrompt = `${prospectType} prospect:\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'InsightsAgent', 200);
}

// ============================================================================
// AGENT 8: CONVERSATION SUMMARY AGENT
// Analyzes the entire conversation (even hour-long) and provides comprehensive summary
// This agent runs continuously during the call and provides final summary when call ends
// ============================================================================
export async function runConversationSummaryAgent(fullTranscript, prospectType, isFinal = false) {
  // For very long conversations, we'll use the full transcript but with a focused prompt
  // GPT-4o-mini can handle up to ~128k tokens, so even hour-long conversations should fit
  
  const appContext = `This is a real estate sales conversation analysis system. 
The conversation is between a CLOSER (salesperson) and a PROSPECT (potential seller).
The transcript is formatted with CLOSER: and PROSPECT: labels.`;

  const systemPrompt = `${appContext}

Analyze the ENTIRE conversation and provide a comprehensive summary.

${isFinal ? 'FINAL SUMMARY (call ended):' : 'PROGRESSIVE SUMMARY (call in progress):'}

OUTPUT FORMAT:
{
  "executiveSummary": "2-3 sentence high-level overview of the entire conversation",
  "prospectSituation": "Detailed description of prospect's situation, problems, and context",
  "keyPoints": [
    "Important point 1",
    "Important point 2",
    "Important point 3"
  ],
  "objectionsRaised": [
    "Objection 1 with context",
    "Objection 2 with context"
  ],
  "objectionsResolved": [
    "How objection 1 was handled",
    "How objection 2 was handled"
  ],
  "nextSteps": [
    "Action item 1",
    "Action item 2"
  ],
  "closerPerformance": "Brief assessment of closer's approach and effectiveness",
  "prospectReadiness": "Assessment of prospect's readiness to move forward (ready/almost/not_ready)",
  "recommendations": "Specific recommendations for follow-up or closing"
}

Be comprehensive but concise. Focus on actionable insights.`;

  // Truncate transcript if extremely long (safety measure, but GPT-4o-mini can handle ~100k chars)
  const MAX_TRANSCRIPT_LENGTH = 100000; // ~100k chars should be enough for hour-long calls
  const transcriptToAnalyze = fullTranscript.length > MAX_TRANSCRIPT_LENGTH
    ? fullTranscript.slice(-MAX_TRANSCRIPT_LENGTH) + '\n\n[Note: Transcript truncated - showing most recent portion]'
    : fullTranscript;

  const userPrompt = `Prospect Type: ${prospectType || 'unknown'}

FULL CONVERSATION TRANSCRIPT:
${transcriptToAnalyze}

${isFinal ? 'Provide the FINAL comprehensive summary of this completed conversation.' : 'Provide a progressive summary of the conversation so far (call still in progress).'}`;

  return await callAI(systemPrompt, userPrompt, 'ConversationSummaryAgent', 2000);
}

// ============================================================================
// MAIN: Run all agents in parallel
// ============================================================================
export async function runAllAgents(transcript, prospectType, customScriptPrompt = '') {
  console.log(`\n[MultiAgent] Starting parallel analysis...`);
  console.log(`[MultiAgent] Full transcript length: ${transcript?.length||0} chars`);
  console.log(`[MultiAgent] Transcript preview: "${String(transcript||'').slice(0,150)}..."`);
  console.log(`[MultiAgent] Lubometer: 7 pillar agents | Objections: 4 agents | Others: 4 agents`);
  const startTime = Date.now();

  // Token control: Balanced windows for accuracy (need enough context)
  const tPillars = String(transcript || '').slice(-800);      // Last ~130 words
  const tHotButtons = String(transcript || '').slice(-800);   // Last ~130 words
  const tObjections = String(transcript || '').slice(-800);   // Last ~130 words
  const tDiagnostic = String(transcript || '').slice(-600);   // Last ~100 words
  const tTruth = String(transcript || '').slice(-800);        // Last ~130 words
  const tInsights = String(transcript || '').slice(-800);     // Last ~130 words

  // Run all agents in parallel with FAST timeouts (2-4s max)
  // Note: runAllPillarAgents internally runs 7 agents in parallel (throttled)
  // Note: runObjectionsAgents internally runs 4 objection agents (throttled)
  const tasks = [
    withTimeout(runAllPillarAgents(tPillars), 6000, { indicatorSignals: {}, pillarErrors: {} }),
    withTimeout(runHotButtonsAgent(tHotButtons), 3000, { hotButtonDetails: [] }),
    withTimeout(runObjectionsAgents(tObjections, customScriptPrompt), 5000, { objections: [] }),
    withTimeout(runDiagnosticQuestionsAgent(tDiagnostic, prospectType), 3000, { askedQuestions: [] }),
    withTimeout(runTruthIndexAgent(tTruth), 3000, { detectedRules: [], coherenceSignals: [], overallCoherence: 'medium' }),
    withTimeout(runInsightsAgent(tInsights, prospectType), 3000, { summary: '', keyMotivators: [], concerns: [], recommendation: '', closingReadiness: 'not_ready' })
  ];

  const settled = await Promise.allSettled(tasks);
  const [
    pillarsResultRaw,
    hotButtonsResultRaw,
    objectionsResultRaw,
    diagnosticResultRaw,
    truthIndexResultRaw,
    insightsResultRaw
  ] = settled.map((r) => (r.status === 'fulfilled' ? r.value : null));

  const pillarsResult = pillarsResultRaw || { indicatorSignals: {}, pillarErrors: {} };
  const hotButtonsResult = hotButtonsResultRaw || { hotButtonDetails: [] };
  const objectionsResult = objectionsResultRaw || { objections: [] };
  const diagnosticResult = diagnosticResultRaw || { askedQuestions: [] };
  const truthIndexResult = truthIndexResultRaw || { detectedRules: [], coherenceSignals: [], overallCoherence: 'medium' };
  const insightsResult = insightsResultRaw || { summary: '', keyMotivators: [], concerns: [], recommendation: '', closingReadiness: 'not_ready' };
  
  const totalTime = Date.now() - startTime;
  console.log(`[MultiAgent] All done in ${totalTime}ms`);
  console.log(`[MultiAgent] Indicators scored: ${Object.keys(pillarsResult.indicatorSignals || {}).length}/27`);
  
  console.log(`[MultiAgent] Truth Index: ${(truthIndexResult.detectedRules || []).length} incoherence rules`);
  
  return {
    // From 7 Pillar Agents (Lubometer)
    indicatorSignals: pillarsResult.indicatorSignals || {},
    pillarErrors: pillarsResult.pillarErrors || {},
    // From Hot Buttons Agent
    hotButtonDetails: hotButtonsResult.hotButtonDetails || [],
    // From 4 Objection Agents
    objections: objectionsResult.objections || [],
    // From Diagnostic Agent
    askedQuestions: diagnosticResult.askedQuestions || [],
    // From Truth Index Agent (T1-T5 rules)
    detectedRules: truthIndexResult.detectedRules || [],
    coherenceSignals: truthIndexResult.coherenceSignals || [],
    overallCoherence: truthIndexResult.overallCoherence || 'medium',
    // From Insights Agent
    insights: insightsResult.summary || '',
    keyMotivators: insightsResult.keyMotivators || [],
    concerns: insightsResult.concerns || [],
    recommendation: insightsResult.recommendation || '',
    closingReadiness: insightsResult.closingReadiness || 'not_ready',
    // Errors
    agentErrors: {
      pillars: pillarsResult.pillarErrors || null,
      hotButtons: hotButtonsResult.error || null,
      objections: objectionsResult.error || null,
      diagnostic: diagnosticResult.error || null,
      truthIndex: truthIndexResult.error || null,
      insights: insightsResult.error || null
    }
  };
}
