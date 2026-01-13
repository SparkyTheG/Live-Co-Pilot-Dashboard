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

// Request pools to prevent rate limiting AND prevent background agents (summary/speaker)
// from starving the main real-time analysis agents.
const ACTIVE_BY_POOL = { main: 0, aux: 0 };
const MAX_BY_POOL = {
  main: 20, // main analysis agents
  aux: 1   // background agents (summary, speaker role) - never starve main
};

async function throttledRequest(fn, pool = 'main') {
  const p = pool === 'aux' ? 'aux' : 'main';
  while ((ACTIVE_BY_POOL[p] || 0) >= (MAX_BY_POOL[p] || 1)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  ACTIVE_BY_POOL[p] = (ACTIVE_BY_POOL[p] || 0) + 1;
  try {
    return await fn();
  } finally {
    ACTIVE_BY_POOL[p] = Math.max(0, (ACTIVE_BY_POOL[p] || 1) - 1);
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
  // Railway latency can spike; 4s caused frequent aborts where only Lubometer survived.
  // Keep abort-enabled timeouts, but give enough runway for HotButtons/Objections to complete.
  const timeoutMs = Number(opts.timeoutMs ?? 8000);
  const pool = String(opts.pool || 'main') === 'aux' ? 'aux' : 'main';
  const stream = opts.stream === true;
  const onDelta = typeof opts.onDelta === 'function' ? opts.onDelta : null;

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
      if (stream) {
        // Stream tokens so we can forward deltas to the frontend (scores-only agents).
        const streamResp = await openai.chat.completions.create(
          { ...baseReq, response_format: { type: 'json_object' }, stream: true },
          // IMPORTANT: signal must be passed as a request option (not in the JSON body),
          // otherwise the API rejects it: "Unrecognized request argument supplied: signal"
          { signal }
        );

        let full = '';
        for await (const chunk of streamResp) {
          const delta = chunk?.choices?.[0]?.delta?.content || '';
          if (delta) {
            full += delta;
            try { onDelta?.(delta, agentName); } catch {}
          }
        }

        // Match non-stream response shape used below
        response = { choices: [{ message: { content: full } }] };
      } else {
        response = await openai.chat.completions.create(
          { ...baseReq, response_format: { type: 'json_object' } },
          // IMPORTANT: signal must be passed as a request option (not in the JSON body),
          // otherwise the API rejects it: "Unrecognized request argument supplied: signal"
          { signal }
        );
      }
    } catch (e) {
      // Fallback for older API behavior: no response_format / no stream
      if (stream) {
        const streamResp = await openai.chat.completions.create(
          { ...baseReq, stream: true },
          { signal }
        );
        let full = '';
        for await (const chunk of streamResp) {
          const delta = chunk?.choices?.[0]?.delta?.content || '';
          if (delta) {
            full += delta;
            try { onDelta?.(delta, agentName); } catch {}
          }
        }
        response = { choices: [{ message: { content: full } }] };
      } else {
        response = await openai.chat.completions.create(
          baseReq,
          { signal }
        );
      }
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
      result = await throttledRequest(() => doCall(controller.signal), pool);
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
// AGENT: LUBOMETER TRUTH PENALTY AGENT (T1-T5 from Truth Index CSV)
// Detects the same 5 incoherence rules, but intended to apply as penalties to Lubometer.
// Output: detectedRules (T1-T5 with evidence)
// ============================================================================
export async function runLubometerTruthPenaltyAgent(transcript, onStream = null) {
  const systemPrompt = `Detect which Truth Index CSV penalties apply based on the PROSPECT's language.

Rules (apply ONLY these 5):
T1: High Pain + Low Urgency (–15 pts)
T2: High Desire + Low Decisiveness (–15 pts)
T3: High Money Access + High Price Sensitivity (–10 pts)
T4: Claims Authority + Reveals Need for Approval (–10 pts)
T5: High Desire + Low Responsibility (–15 pts)

IMPORTANT:
- Return ONLY valid JSON.
- Be conservative: only flag a rule if there's clear evidence in the transcript.
- Provide short evidence using exact or near-exact quotes found in the transcript.

Return format:
{
  "detectedRules": [
    {"ruleId":"T2","evidence":"Quote-like evidence from transcript","confidence":0.85}
  ]
}`;

  const userPrompt = `You are analyzing a long sales call transcript.

TRANSCRIPT:
"${String(transcript || '')}"

Return detectedRules (T1-T5) only. If none, return {"detectedRules":[]}.`;

  const res = await callAI(systemPrompt, userPrompt, 'LubometerTruthPenaltyAgent', {
    maxTokens: 450,
    timeoutMs: 8000,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
  if (res && typeof res === 'object' && !res.error) res._fromAgent = true;
  return res;
}

// ============================================================================
// SPEAKER ROLE AGENT (AI)
// Classifies each committed chunk as: closer | prospect | unknown
// Used for:
// - call_transcript_chunks.speaker_role
// - call_sessions.transcript_text speaker labels
// ============================================================================
export async function runSpeakerRoleAgent(newChunk, conversationHistory = '') {
  const text = String(newChunk || '').trim();
  if (!text) return { speaker: 'unknown' };

  // Keep context short + recent (avoid cost + latency)
  const history = String(conversationHistory || '').slice(-1800);

  const systemPrompt = `You label who spoke a chunk in a REAL ESTATE sales conversation.

Return ONLY JSON: {"speaker":"closer"} or {"speaker":"prospect"} or {"speaker":"unknown"}

CRITICAL RULES FOR ACCURACY:
1. **CLOSER** = Salesperson/Agent behaviors:
   - Asks diagnostic questions ("How long?", "When did...?", "What's your timeline?", "Tell me about...")
   - Explains services, process, options, next steps
   - Uses qualifying questions ("Do you own the property?", "Are you behind on payments?")
   - Proposes solutions, schedules appointments, outlines steps
   - Educates about foreclosure, creative finance, timeline implications
   - Uses phrases like "let me ask", "help me understand", "here's what we can do"

2. prospect = property owner/seller (talks about THEIR situation, pain, timeline, money, objections, motivations)
   - Answers questions about THEIR property, situation, finances
   - Shares PERSONAL info: "I am...", "my property", "we're behind", "I need..."
   - Expresses concerns, objections, motivations
   - Talks about THEIR timeline, pain points, money situation
   - Examples: "I'm behind on payments", "My property is...", "I need to sell", "I'm worried about..."

3. unknown = too short/ambiguous OR both speakers in one chunk

CRITICAL RULES:
- If chunk has BOTH question marks AND situation details → closer (asking questions)
- If chunk is ONLY about their situation/problems → prospect
- Questions like "How long?", "When?", "What about X?" → closer
- Answers about their situation → prospect
- Very short chunks (<8 words) → prefer unknown unless crystal clear

Examples:
CLOSER: "How long have you owned the property?", "What's your timeline?", "When do you need to close?"
PROSPECT: "I'm behind on payments", "The property needs repairs", "I inherited it from my dad"`;

  const userPrompt = `Recent conversation (last few exchanges for context):
${history}

New chunk to classify:
"${text}"

Return {"speaker":"closer"} OR {"speaker":"prospect"} OR {"speaker":"unknown"}`;

  const result = await callAI(systemPrompt, userPrompt, 'SpeakerRoleAgent', { 
    maxTokens: 50, 
    timeoutMs: 3500, 
    pool: 'aux' 
  });
  const sp = String(result?.speaker || '').toLowerCase();
  if (sp === 'closer' || sp === 'prospect' || sp === 'unknown') return { speaker: sp };
  return { speaker: 'unknown' };
}

// ============================================================================
// LUBOMETER: 7 PILLAR AGENTS (run in parallel)
// Each agent scores only its pillar's indicators
// ============================================================================

/**
 * P1 AGENT: Pain & Desire (indicators 1-4)
 * Weight: 1.5x - MOST IMPORTANT
 */
async function runP1Agent(transcript, onStream = null) {
  const systemPrompt = `Score PILLAR 1: PAIN & DESIRE from prospect statements.

INDICATORS (1-10 scale):
1. Pain Intensity: How severe? (1=no pain, 5=moderate concern, 10=crisis)
2. Pain Awareness: Do they understand root cause? (1=confused, 5=some clarity, 10=crystal clear)
3. Desire Clarity: How specific? (1=vague, 5=some goals, 10=vivid vision)
4. Desire Priority: How important? (1=low, 5=moderate, 10=urgent priority)

WHAT TO LOOK FOR:
- Pain words: worried, stressed, frustrated, can't, problem, issue, struggling, confused, expensive
- Desire words: want, need, looking for, hope, goal, wish, must have
- IMPORTANT: "confused" = indicator 2 should be 1-3 (low awareness)
- IMPORTANT: "expensive" signals pain intensity (indicator 1 = 7-9) + high desire for solution
- Score 6-8 for clear signals, 4-6 for moderate, 7-10 for strong

Return ONLY: {"1":6,"2":5,"3":7,"4":6}`;

  const userPrompt = `Score:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P1-PainDesire', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * P2 AGENT: Urgency (indicators 5-8)
 */
async function runP2Agent(transcript, onStream = null) {
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
  return await callAI(systemPrompt, userPrompt, 'P2-Urgency', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * P3 AGENT: Decisiveness (indicators 9-12)
 */
async function runP3Agent(transcript, onStream = null) {
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
  return await callAI(systemPrompt, userPrompt, 'P3-Decisiveness', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * P4 AGENT: Money (indicators 13-16)
 * Weight: 1.5x - MOST IMPORTANT
 */
async function runP4Agent(transcript, onStream = null) {
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
  return await callAI(systemPrompt, userPrompt, 'P4-Money', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * P5 AGENT: Responsibility (indicators 17-20)
 */
async function runP5Agent(transcript, onStream = null) {
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
- CONFUSION: "confused", "not sure", "unclear" = score indicators 17-20 as 1-4 (low ownership)
- LIES/CONTRADICTIONS: "I lied", "wasn't being honest", "that was a lie" = VERY LOW scores (1-3) on indicators 19 & 20

Score generously for clear signals. If prospect shows confusion, score indicators 17-20 as 1-4. If prospect admits to lying or contradicting themselves, score indicators 17-20 as 1-3.
Return ONLY: {"17":6,"18":7,"19":5,"20":6}`;

  const userPrompt = `Score Responsibility indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P5-Responsibility', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * P6 AGENT: Price Sensitivity (indicators 21-23)
 * NOTE: This pillar is REVERSE SCORED - LOW scores are GOOD
 */
async function runP6Agent(transcript, onStream = null) {
  const systemPrompt = `Score PILLAR 6: PRICE SENSITIVITY indicators (1-10) from PROSPECT statements.

⚠️ REVERSE SCORING: For this pillar, LOW scores (1-3) are GOOD, HIGH scores (7-10) are BAD

INDICATORS TO SCORE:
21. Emotional Response to Spending: Anxiety about investment? (1=not anxious, 10=very anxious)
22. Negotiation Reflex: Always trying to negotiate? (1=accepts fair price, 10=always haggles)
23. Structural Rigidity: Needs total control over terms? (1=flexible, 10=rigid on terms)

WHAT TO LOOK FOR (score HIGH 8-10 if these appear):
- Price anxiety: "expensive", "too expensive", "can't justify", "worried about cost", "kind of expensive"
- Negotiating: "can you lower", "what's the best price", "discount"
- Rigid: "must be exactly", "won't budge on", "non-negotiable terms"

WHAT TO LOOK FOR (score LOW 1-3 if these appear):
- Price acceptance: "fair price", "worth it", "not worried about cost"
- Flexible: "whatever works", "can adjust", "open to options"

IMPORTANT: Any mention of "expensive" should score indicators 21-22 as 8-9 minimum.

Return ONLY: {"21":4,"22":3,"23":5}`;

  const userPrompt = `Score Price Sensitivity indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P6-PriceSensitivity', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * P7 AGENT: Trust (indicators 24-27)
 */
async function runP7Agent(transcript, onStream = null) {
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
  return await callAI(systemPrompt, userPrompt, 'P7-Trust', {
    maxTokens: 150,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
}

/**
 * RUN ALL 7 PILLAR AGENTS IN PARALLEL
 * Combines results into single indicatorSignals object
 */
export async function runAllPillarAgents(transcript, onStream = null) {
  console.log(`[Lubometer] Starting 7 pillar agents in parallel...`);
  const startTime = Date.now();

  // Run all 7 pillar agents in parallel
  const [p1, p2, p3, p4, p5, p6, p7] = await Promise.all([
    runP1Agent(transcript, onStream),
    runP2Agent(transcript, onStream),
    runP3Agent(transcript, onStream),
    runP4Agent(transcript, onStream),
    runP5Agent(transcript, onStream),
    runP6Agent(transcript, onStream),
    runP7Agent(transcript, onStream)
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

  // #region debug log - pillar score fluctuation
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiAgents.js:507',message:'Pillar Scores Completed',data:{indicatorSignals,transcriptLength:transcript?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'pillar-scores'})}).catch(()=>{});
  // #endregion

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
export async function runHotButtonsAgent(transcript, onStream = null) {
  const systemPrompt = `Find emotional triggers from PROSPECT speech in this sales conversation.

CRITICAL RULES:
- ONLY extract quotes that ACTUALLY APPEAR in the transcript
- DO NOT paraphrase, invent, or create quotes
- DO NOT return hot buttons if you cannot find a real quote
- Quote must be 3-15 words taken DIRECTLY from what the prospect said

INDICATOR IDS (choose most relevant):
1-4: Pain/Desire (worried, stressed, frustrated, want, need, hope, looking for)
5-8: Urgency (deadline, auction, soon, running out, can't wait, now)
9-12: Decisiveness (I decide, ready, let's do it, committed)
13-16: Money (afford, budget, expensive, cost, investment, financing)
17-20: Responsibility (my fault, I should, need to fix, responsible for)
21-23: Price Sensitivity (too much, cheaper, discount, better deal)
24-27: Trust (not sure, skeptical, prove it, guarantee, really work)

OUTPUT per trigger:
- id: indicator number 1-27 that best matches the emotion
- quote: EXACT phrase from transcript (3-15 words, must be verbatim or very close)
- contextualPrompt: Follow-up question (8 words max)
- score: 5-9 (5=mild, 7=clear, 9=intense)

Return: {"hotButtonDetails":[{"id":24,"quote":"not sure it will work for me","contextualPrompt":"What would make you confident?","score":7}]}
Return 1-3 most important triggers with REAL quotes. If no clear emotional triggers with actual quotes, return empty array.`;

  const userPrompt = `Find emotional triggers with EXACT quotes from prospect:\n"${transcript}"`;

  console.log(`[HotButtonsAgent] INPUT: transcript length=${transcript?.length||0}, preview="${transcript?.slice(0,80)||'EMPTY'}"`);
  // #region debug log - hot buttons duplication
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiAgents.js:555',message:'Hot Buttons Agent Input',data:{transcriptLength:transcript?.length||0,transcriptPreview:transcript?.slice(0,200)||'EMPTY'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'hotbutton-input'})}).catch(()=>{});
  // #endregion
  
  const result = await callAI(systemPrompt, userPrompt, 'HotButtonsAgent', {
    maxTokens: 400,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
  console.log(`[HotButtonsAgent] OUTPUT: hotButtonDetails=${result?.hotButtonDetails?.length||0}, error=${result?.error||'none'}, keys=${Object.keys(result||{}).join(',')}`);
  
  // #region debug log - hot buttons duplication
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiAgents.js:563',message:'Hot Buttons Agent Output',data:{count:result?.hotButtonDetails?.length||0,hotButtons:result?.hotButtonDetails?.map(h=>({id:h.id,quote:h.quote,score:h.score}))||[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'hotbutton-output'})}).catch(()=>{});
  // #endregion
  
  return result;
}

// ============================================================================
// UNIFIED ANALYSIS AGENT (single-call, inspired by zero-stress-sales-main)
// Produces: indicatorSignals + hotButtonDetails + objections + truth signals + insights
// This avoids partial timeouts where only some sub-agents finish.
// ============================================================================
async function runUnifiedAnalysisAgent(transcript, prospectType, customScriptPrompt = '') {
  const t = String(transcript || '');
  const pt = String(prospectType || 'foreclosure');
  const custom = String(customScriptPrompt || '').trim();

  const systemPrompt = `You are an expert real estate sales conversation analyzer.

Your job: read a conversation transcript and output ONLY valid JSON with this exact schema:
{
  "indicatorSignals": { "1": 1-10, "2": 1-10, ..., "27": 1-10 },
  "hotButtonDetails": [
    { "id": 1-27, "quote": "3-15 words", "contextualPrompt": "8 words max", "score": 5-9 }
  ],
  "objections": [
    {
      "objectionText": "5-20 words (quote or close paraphrase from prospect)",
      "probability": 0.0-1.0,
      "fear": "short underlying fear",
      "whisper": "short internal whisper (<= 12 words)",
      "rebuttalScript": "2-4 sentences, empathetic + structured"
    }
  ],
  "detectedRules": [
    { "ruleId": "T1|T2|T3|T4|T5", "evidence": "short evidence", "confidence": 0.6-1.0 }
  ],
  "coherenceSignals": ["short signal", "short signal"],
  "overallCoherence": "high|medium|low",
  "insights": "1-2 sentence summary",
  "keyMotivators": ["short", "short"],
  "concerns": ["short", "short"],
  "recommendation": "1 sentence next best move",
  "closingReadiness": "ready|almost|not_ready"
}

Rules:
- Score all 27 indicators (1-10). Use 5 if unclear.
- Hot buttons: return 0-4 items, only if clearly present; tie each to an indicator id.
- Objections: return 0-3 items. Only include objections that are actually present or clearly implied by the prospect.
- Truth rules T1-T5 are contradictions. Be conservative and evidence-based.
- Output must be STRICT JSON. No markdown. No extra keys.`;

  const userPrompt = `Prospect type: ${pt}
${custom ? `Custom script prompt: ${custom}` : ''}

TRANSCRIPT (most recent portion):
${t}`;

  return await callAI(systemPrompt, userPrompt, 'UnifiedAnalysisAgent', { maxTokens: 900, timeoutMs: 9000 });
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
- objectionText MUST be an EXACT QUOTE from the transcript (3-20 words). Do NOT paraphrase or summarize.
- Include hesitations and concerns, not just direct objections
- Probability: 0.8-0.95 for clear objections, 0.65-0.8 for hesitations
- PRIORITIZE THE MOST RECENT statements (end of transcript) over older ones
- Return 1-2 most important objections from the LATEST part of the conversation
- DO NOT return duplicate objections (same concern worded differently)
- If no new objections in recent statements, return empty array

Return: {"detectedObjections":[{"objectionText":"prospect concern here","probability":0.85}]}`;

  const userPrompt = `Detect objections from the MOST RECENT statements:\n"${transcript}"`;

  console.log(`[ObjectionDetectionAgent] INPUT: transcript length=${transcript?.length||0}, preview="${transcript?.slice(0,80)||'EMPTY'}"`);
  const result = await callAI(systemPrompt, userPrompt, 'ObjectionDetectionAgent', 200);
  console.log(`[ObjectionDetectionAgent] OUTPUT (raw): detectedObjections=${result?.detectedObjections?.length||0}, error=${result?.error||'none'}`);
  
  const normalizeText = (s) => String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stopWords = new Set([
    'the','a','an','is','are','was','were','be','been','being','to','of','and','or','but','for','with','about','that','this',
    'my','your','our','their','me','you','we','they','it','its','im','i','am',
    'prospect','client','customer','buyer','seller',
    'kind','sort','really','just','like','seems','seem'
  ]);

  const getWords = (s) => normalizeText(s)
    .split(' ')
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const jaccard = (aWords, bWords) => {
    const a = new Set(aWords);
    const b = new Set(bWords);
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const w of a) if (b.has(w)) inter++;
    const union = a.size + b.size - inter;
    return union ? inter / union : 0;
  };

  const normalizedTranscript = normalizeText(transcript);

  // 1) Hard filter: only keep objections that actually appear in the transcript (verbatim-ish)
  if (result?.detectedObjections && Array.isArray(result.detectedObjections)) {
    result.detectedObjections = result.detectedObjections.filter((obj) => {
      const txt = normalizeText(obj?.objectionText);
      if (!txt) return false;
      // If the "quote" isn't present, it's a paraphrase; drop it to avoid duplicates like:
      // "prospect is not sure this will work for them"
      return normalizedTranscript.includes(txt);
    });
  }

  // 2) Deduplicate objections by stronger semantic similarity (AI sometimes returns near-duplicates)
  if (result?.detectedObjections && Array.isArray(result.detectedObjections)) {
    const deduped = [];
    for (const obj of result.detectedObjections) {
      const objTextNorm = normalizeText(obj?.objectionText);

      const isDuplicate = deduped.some((existing) => {
        const existingNorm = normalizeText(existing?.objectionText);
        if (!existingNorm) return false;

        // Exact/containment checks (catch "are you sure this is going to work" variants)
        if (existingNorm === objTextNorm) return true;
        if (existingNorm.includes(objTextNorm) || objTextNorm.includes(existingNorm)) return true;

        // Semantic via Jaccard of keywords
        const sim = jaccard(getWords(existingNorm), getWords(objTextNorm));
        return sim >= 0.45;
      });
      
      if (!isDuplicate) {
        deduped.push(obj);
      }
    }
    
    result.detectedObjections = deduped;
    console.log(`[ObjectionDetectionAgent] OUTPUT (deduped): ${deduped.length} unique objections`);
  }
  
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

  const trimmedContext = String(customScriptPrompt || '').trim();
  const customContext = trimmedContext
    ? `\n\nCUSTOM BUSINESS CONTEXT (must use for tone/positioning):\n- ${trimmedContext}\n`
    : '';

  console.log('[RebuttalAgent] context', {
    hasCustomContext: Boolean(trimmedContext),
    contextPreview: trimmedContext ? trimmedContext.slice(0, 70) : ''
  });

  const systemPrompt = `Generate empathetic rebuttal scripts (2-3 sentences each).${customContext}

FORMAT:
1. Start with empathy: "I understand..." / "That's valid..." / "It's natural..."
2. Acknowledge concern genuinely
3. Provide value/next step

RULES:
- If CUSTOM BUSINESS CONTEXT is provided, you MUST adapt the rebuttal to fit that business (industry, offer type, positioning).
- Do NOT literally repeat the context line verbatim; weave it naturally into the rebuttal (e.g., reference the relevant domain, outcomes, or approach).
- Keep each rebuttal 2-3 sentences, confident, and non-pushy.
- IMPORTANT: Generate a rebuttal for EVERY objection in the list below.

Return: {"rebuttals":[{"objectionIndex":0,"rebuttalScript":"..."},{"objectionIndex":1,"rebuttalScript":"..."},{"objectionIndex":2,"rebuttalScript":"..."}]}`;

  const userPrompt = `Generate rebuttals for ALL ${detectedObjections.length} objections:\n${objectionsList}`;

  console.log(`[RebuttalAgent] Starting with timeout 12000ms for ${detectedObjections.length} objections...`);
  const result = await callAI(systemPrompt, userPrompt, 'RebuttalAgent', { 
    maxTokens: 250,
    timeoutMs: 12000 // Give extra time for multiple rebuttals
  });
  console.log('[RebuttalAgent] OUTPUT:', {
    requestedCount: detectedObjections.length,
    returnedCount: (result?.rebuttals || []).length,
    error: result?.error || 'none',
    rebuttals: result?.rebuttals || []
  });
  return result;
}

function pickByObjectionIndex(list, idx, valueKey) {
  const arr = Array.isArray(list) ? list : [];
  const match = arr.find((x) => Number(x?.objectionIndex) === idx);
  const v = match?.[valueKey];
  return typeof v === 'string' ? v : '';
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
    fear: pickByObjectionIndex(fearResult?.fears, idx, 'fear') || 'Fear of uncertainty',
    whisper: pickByObjectionIndex(whisperResult?.whispers, idx, 'whisper') || 'They need reassurance',
    rebuttalScript: pickByObjectionIndex(rebuttalResult?.rebuttals, idx, 'rebuttalScript') || 'Address their concern with empathy.'
  }));

  console.log(`[ObjectionsSystem] Done in ${Date.now() - startTime}ms`);
  return { objections };
}

/**
 * PROGRESSIVE OBJECTIONS:
 * - Emit objections ASAP (no waiting for rebuttal scripts)
 * - Then emit an updated objections array once scripts are ready
 *
 * @param {string} transcript
 * @param {string} customScriptPrompt
 * @param {(partial: {objections: any[]}) => void} onPartial
 */
export async function runObjectionsAgentsProgressive(transcript, customScriptPrompt = '', onPartial = null) {
  const emit = (p) => {
    if (typeof onPartial !== 'function') return;
    try { onPartial(p); } catch {}
  };

  console.log(`[ObjectionsSystemProgressive] Starting...`);
  const startTime = Date.now();

  // Step 1: Detect objections (required)
  const detectionResult = await runObjectionDetectionAgent(transcript);
  if (detectionResult.error || !detectionResult.detectedObjections?.length) {
    console.log(`[ObjectionsSystemProgressive] No objections detected`);
    return { objections: [] };
  }

  const detectedObjections = detectionResult.detectedObjections;

  // Emit immediately with placeholders (so UI is instant)
  const base = detectedObjections.map((obj) => ({
    objectionText: obj.objectionText,
    probability: obj.probability,
    fear: '',
    whisper: '',
    rebuttalScript: '' // will arrive later
  }));
  
  // #region objections log H6 H9
  console.log('[DEBUG:H6_H9] Emitting initial objections (empty fear/whisper/rebuttal)', JSON.stringify({objectionsCount:base.length,firstObjection:base[0]}));
  // #endregion
  
  emit({ objections: base });

  // Step 2: Run Fear + Whisper (parallel) and merge (optional, but cheap)
  const fearWhisper = await Promise.allSettled([
    runFearAnalysisAgent(detectedObjections),
    runWhisperReframeAgent(detectedObjections)
  ]);

  const fearResult = fearWhisper[0].status === 'fulfilled' ? fearWhisper[0].value : { fears: [] };
  const whisperResult = fearWhisper[1].status === 'fulfilled' ? fearWhisper[1].value : { whispers: [] };

  // #region objections log H7 H9
  console.log('[DEBUG:H7_H9] Fear+Whisper agents complete', JSON.stringify({fearStatus:fearWhisper[0].status,whisperStatus:fearWhisper[1].status,fearCount:fearResult?.fears?.length||0,whisperCount:whisperResult?.whispers?.length||0,fearSample:fearResult?.fears?.[0],whisperSample:whisperResult?.whispers?.[0]}));
  // #endregion

  const withFearWhisper = detectedObjections.map((obj, idx) => ({
    objectionText: obj.objectionText,
    probability: obj.probability,
    fear: pickByObjectionIndex(fearResult?.fears, idx, 'fear') || '',
    whisper: pickByObjectionIndex(whisperResult?.whispers, idx, 'whisper') || '',
    rebuttalScript: ''
  }));
  
  // #region objections log H6 H9
  console.log('[DEBUG:H6_H9] Emitting objections with fear/whisper', JSON.stringify({objectionsCount:withFearWhisper.length,firstObjection:withFearWhisper[0]}));
  // #endregion
  
  emit({ objections: withFearWhisper });

  // Step 3: Rebuttal scripts (slow lane) - emit when ready
  let rebuttalResult = { rebuttals: [] };
  try {
    rebuttalResult = await runRebuttalScriptAgent(detectedObjections, customScriptPrompt);
    if (!rebuttalResult || rebuttalResult.error) {
      console.warn('[ObjectionsSystemProgressive] Rebuttal agent failed or timed out');
      rebuttalResult = { rebuttals: [] };
    }
    
    // #region objections log H7
    console.log('[DEBUG:H7] Rebuttal agent complete', JSON.stringify({success:true,rebuttalsCount:rebuttalResult?.rebuttals?.length||0,rebuttalSample:rebuttalResult?.rebuttals?.[0]}));
    // #endregion
  } catch (e) {
    console.warn('[ObjectionsSystemProgressive] Rebuttal agent error:', e?.message || e);
    rebuttalResult = { rebuttals: [] };
    
    // #region objections log H7
    console.log('[DEBUG:H7] Rebuttal agent threw error', JSON.stringify({error:String(e?.message||e)}));
    // #endregion
  }
  
  const final = detectedObjections.map((obj, idx) => ({
    objectionText: obj.objectionText,
    probability: obj.probability,
    fear: pickByObjectionIndex(fearResult?.fears, idx, 'fear') || '',
    whisper: pickByObjectionIndex(whisperResult?.whispers, idx, 'whisper') || '',
    rebuttalScript: pickByObjectionIndex(rebuttalResult?.rebuttals, idx, 'rebuttalScript') || ''
  }));
  
  // #region objections log H6 H9
  console.log('[DEBUG:H6_H9] Emitting final objections with rebuttals', JSON.stringify({objectionsCount:final.length,firstObjection:final[0]}));
  // #endregion
  
  emit({ objections: final });

  console.log(`[ObjectionsSystemProgressive] Done in ${Date.now() - startTime}ms`);
  return { objections: final };
}

// NOTE: Diagnostic Questions AI agent removed.
// Diagnostic questions are now user-editable content in the frontend (Admin Panel),
// and the "asked" state is controlled manually (no AI auto-detection).

// NOTE: Diagnostic Questions agent removed.
// Diagnostic questions are now user-editable content in the frontend (Admin Panel),
// and the "asked" state is controlled manually (no AI auto-detection).

// ============================================================================
// AGENT 5: TRUTH INDEX AGENT
// Detects the 5 specific incoherence rules from Truth Index CSV
// Output: detectedRules (T1-T5 with evidence), coherenceSignals, overallCoherence
// ============================================================================
export async function runTruthIndexAgent(transcript, onStream = null) {
  const systemPrompt = `Detect INCOHERENCE patterns (contradictions) in prospect's statements.

You must detect which of these 5 specific rules (from the Truth Index CSV) apply:

T1: HIGH PAIN + LOW URGENCY (–15 pts)
- Trigger: Claims deep pain but shows no urgency to act
- Example: "this is killing me, so stressed" BUT "whenever, no hurry, no rush"

T2: HIGH DESIRE + LOW DECISIVENESS (–15 pts)  
- Trigger: Wants change but avoids making decisions
- Example: "I really want this, need to change" BUT "need to think, not sure, maybe later"
- ALSO USE for GENERAL CONTRADICTIONS/FLIP-FLOPPING that don't fit T1/T3/T4/T5:
  * Says one thing, then opposite (e.g., "I live there... no I don't")
  * Keeps changing story or can't keep facts straight
  * Waffles or contradicts basic facts

T3: HIGH MONEY + HIGH PRICE SENSITIVITY (–10 pts)
- Trigger: Can afford it, but still resists price
- Example: "I have the funds, can afford it" BUT "too expensive, need discount"

T4: CLAIMS AUTHORITY + REVEALS NEED FOR APPROVAL (–10 pts)
- Trigger: Self-contradiction in who owns the decision
- Example: "I make the decisions, my choice" THEN "need to ask spouse/partner/boss"

T5: HIGH DESIRE + LOW RESPONSIBILITY (–15 pts)
- Trigger: Craves result, but doesn't own the change
- Example: "I want success, need this to work" BUT "not my fault, they made me, others are to blame"

IMPORTANT:
- BE AGGRESSIVE - flag contradictions even if messy/unclear
- Look for ANY flip-flopping, changing stories, contradictions
- Use exact quotes showing BOTH parts of contradiction
- Can detect MULTIPLE instances of the same rule (each gets its own entry)

Return format:
{
  "detectedRules": [
    {"ruleId": "T2", "evidence": "Said 'living there 2 years' then 'not living there' then 'yes living there'", "confidence": 0.9}
  ],
  "coherenceSignals": [],
  "overallCoherence": "low"
}

If NO contradictions found, return empty detectedRules array.`;

  const userPrompt = `CONVERSATION CONTEXT:
This is a sales conversation about real estate investment services. The closer is trying to help a prospect who may be facing foreclosure, behind on payments, or looking to sell their property.

KEY FACTS TO WATCH FOR CONTRADICTIONS:
- Whether they live in the property or not
- How long they've owned/lived there
- Whether they have money/can afford services
- Whether they're behind on payments
- Whether they need to sell urgently
- Whether they make decisions or need approval

TRANSCRIPT TO ANALYZE:
"${transcript}"

Flag ANY contradictions or flip-flopping in the above facts.`;

  console.log(`[TruthIndexAgent] INPUT: transcript length=${transcript?.length||0}, preview="${transcript?.slice(0,100)||'EMPTY'}"`);
  const res = await callAI(systemPrompt, userPrompt, 'TruthIndexAgent', {
    maxTokens: 600,
    stream: typeof onStream === 'function',
    onDelta: (delta, agent) => {
      try { onStream?.({ agent, delta }); } catch {}
    }
  });
  console.log(`[TruthIndexAgent] OUTPUT: detectedRules=${res?.detectedRules?.length||0}, coherenceSignals=${res?.coherenceSignals?.length||0}, overallCoherence=${res?.overallCoherence||'none'}, error=${res?.error||'none'}`);
  if (res?.detectedRules?.length > 0) {
    console.log(`[TruthIndexAgent] Rules detected:`, res.detectedRules.map(r => `${r.ruleId}(${r.confidence})`).join(', '));
  }
  
  // Mark successful agent output so the engine can distinguish it from fallbacks/timeouts.
  if (res && typeof res === 'object' && !res.error) {
    res._fromAgent = true;
  }
  return res;
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

  return await callAI(systemPrompt, userPrompt, 'ConversationSummaryAgent', { maxTokens: 2000, timeoutMs: 12000, pool: 'aux' });
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
  const tTruth = String(transcript || '').slice(-800);        // Last ~130 words
  const tInsights = String(transcript || '').slice(-800);     // Last ~130 words

  // Run all agents in parallel with timeouts that work reliably on Railway.
  // Each agent call is still abortable; these caps just prevent premature empty results.
  // Note: runAllPillarAgents internally runs 7 agents in parallel (throttled)
  // Note: runObjectionsAgents internally runs 4 objection agents (throttled)
  const tasks = [
    withTimeout(runAllPillarAgents(tPillars), 12000, { indicatorSignals: {}, pillarErrors: {} }),
    withTimeout(runHotButtonsAgent(tHotButtons), 9000, { hotButtonDetails: [] }),
    withTimeout(runObjectionsAgents(tObjections, customScriptPrompt), 11000, { objections: [] }),
    // If Truth Index times out, force deterministic fallback in engine by surfacing an error.
    withTimeout(runTruthIndexAgent(tTruth), 9000, { detectedRules: [], coherenceSignals: [], overallCoherence: '', error: 'timeout' }),
    withTimeout(runInsightsAgent(tInsights, prospectType), 9000, { summary: '', keyMotivators: [], concerns: [], recommendation: '', closingReadiness: 'not_ready' })
  ];

  const settled = await Promise.allSettled(tasks);
  const [
    pillarsResultRaw,
    hotButtonsResultRaw,
    objectionsResultRaw,
    truthIndexResultRaw,
    insightsResultRaw
  ] = settled.map((r) => (r.status === 'fulfilled' ? r.value : null));

  const pillarsResult = pillarsResultRaw || { indicatorSignals: {}, pillarErrors: {} };
  const hotButtonsResult = hotButtonsResultRaw || { hotButtonDetails: [] };
  const objectionsResult = objectionsResultRaw || { objections: [] };
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
    // Diagnostic Questions: user-controlled (no AI)
    askedQuestions: [],
    // From Truth Index Agent (T1-T5 rules)
    detectedRules: truthIndexResult.detectedRules || [],
    coherenceSignals: truthIndexResult.coherenceSignals || [],
    overallCoherence: truthIndexResult.overallCoherence || 'medium',
    truthIndexFromAgent: Boolean(truthIndexResult._fromAgent),
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
      truthIndex: truthIndexResult.error || null,
      insights: insightsResult.error || null
    }
  };
}
