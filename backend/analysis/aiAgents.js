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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000,
  maxRetries: 2
});

const MODEL = 'gpt-4o-mini';

/**
 * Helper: Call AI with optimized settings per agent
 */
async function callAI(systemPrompt, userPrompt, agentName, maxTokens = 800) {
  const startTime = Date.now();
  
  try {
    console.log(`[${agentName}] Starting...`);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.0,
      max_tokens: maxTokens
    });
    
    let content = response.choices[0].message.content;
    
    // Clean markdown
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(content);
    console.log(`[${agentName}] Done in ${Date.now() - startTime}ms`);
    return parsed;
    
  } catch (error) {
    console.error(`[${agentName}] Error: ${error.message}`);
    return { error: error.message };
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
  const systemPrompt = `Score PILLAR 1: PAIN & DESIRE indicators (1-10) from PROSPECT statements.

INDICATORS TO SCORE:
1. Pain Intensity: How severe is their pain? (1=minor inconvenience, 10=overwhelming crisis)
2. Pain Awareness: Do they understand the root cause? (1=confused, 10=deep understanding)
3. Desire Clarity: How specific is their desired outcome? (1=vague wish, 10=vivid vision)
4. Desire Priority: How important is solving this? (1=nice-to-have, 10=top priority)

WHAT TO LOOK FOR:
- Pain words: worried, stressed, frustrated, scared, anxious, can't take it, killing me
- Desire words: want, need, looking for, hope, dream, goal, must have
- Severity: mild concern vs desperate situation
- Clarity: vague ideas vs specific outcomes

Score generously (7-9) for clear signals. This pillar has 1.5x weight.
Return ONLY: {"1":7,"2":8,"3":6,"4":9}`;

  const userPrompt = `Score Pain & Desire indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P1-PainDesire', 150);
}

/**
 * P2 AGENT: Urgency (indicators 5-8)
 */
async function runP2Agent(transcript) {
  const systemPrompt = `Score PILLAR 2: URGENCY indicators (1-10) from PROSPECT statements.

INDICATORS TO SCORE:
5. Time Pressure: Real deadlines? (1=no deadline, 10=imminent deadline like auction)
6. Cost of Delay: What do they lose each month waiting? (1=nothing, 10=major losses)
7. Internal Timing: "Can't do this anymore" moment? (1=no shift, 10=hit breaking point)
8. Environmental Availability: Do they have bandwidth to act? (1=overwhelmed, 10=ready now)

WHAT TO LOOK FOR:
- Deadlines: auction, foreclosure date, contract expires, days left
- Costs: losing money, wasting time, opportunity cost
- Breaking point: had enough, can't continue, need to change now
- Availability: have time, ready to move, can focus on this

Score generously for clear signals.
Return ONLY: {"5":7,"6":8,"7":6,"8":5}`;

  const userPrompt = `Score Urgency indicators:\n"${transcript}"`;
  return await callAI(systemPrompt, userPrompt, 'P2-Urgency', 150);
}

/**
 * P3 AGENT: Decisiveness (indicators 9-12)
 */
async function runP3Agent(transcript) {
  const systemPrompt = `Score PILLAR 3: DECISIVENESS indicators (1-10) from PROSPECT statements.

INDICATORS TO SCORE:
9. Decision Authority: Are they the final decision maker? (1=needs many approvals, 10=full authority)
10. Decision Style: How do they typically decide? (1=very slow/analytical, 10=fast/intuitive)
11. Commitment to Decide: Ready to commit today? (1=wants to wait indefinitely, 10=ready now)
12. Self-Permission: Can they give themselves permission? (1=overthinks everything, 10=trusts gut)

WHAT TO LOOK FOR:
- Authority: "I decide", "my choice", "don't need to ask anyone"
- vs need approval: "ask spouse", "check with partner", "boss decides"
- Decision speed: "need to think", "research more" vs "let's do it", "ready now"
- Self-trust: confident vs second-guessing

Score generously for clear signals.
Return ONLY: {"9":7,"10":6,"11":5,"12":6}`;

  const userPrompt = `Score Decisiveness indicators:\n"${transcript}"`;
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
  const systemPrompt = `Detect emotional triggers ("hot buttons") from prospect. Extract EXACT quotes.

TRIGGER CATEGORIES:
Pain: worried, scared, stressed, frustrated, concerned, fear, anxious
Desire: want, need, looking for, hope, wish, dream, goal
Urgency: deadline, running out, days left, can't wait, now, soon, auction
Money: afford, expensive, cost, budget, funds, financing, investment
Authority: I decide, my choice, spouse, partner, need to ask
Commitment: ready, let's do, move forward, sign up, commit

OUTPUT per trigger:
- id: indicator number 1-27 (1=Pain,5=Urgency,13=Money,21=PriceSensitivity,etc)
- quote: EXACT words from transcript (3-15 words)
- contextualPrompt: follow-up question (10 words max)
- score: intensity 1-10

Return: {"hotButtonDetails":[{"id":1,"quote":"I'm really worried","contextualPrompt":"What worries you most?","score":8}]}`;

  const userPrompt = `Find emotional triggers:\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'HotButtonsAgent', 800);
}

// ============================================================================
// OBJECTIONS SYSTEM: 4 Focused Agents
// ============================================================================

/**
 * AGENT 3a: OBJECTION DETECTION
 * Output: detectedObjections [{objectionText, probability}]
 */
export async function runObjectionDetectionAgent(transcript) {
  const systemPrompt = `Detect prospect objections, concerns, hesitations. Be generous.

OBJECTION PATTERNS:
Price: expensive, cost, afford, money, budget, too much
Trust: not sure, guarantee, proof, skeptical, really work
Timing: think about it, wait, later, not ready, need time
Authority: ask spouse/partner/boss, not my decision
Fear: scared, worried, what if, concerned, nervous

Return: {"detectedObjections":[{"objectionText":"I need to think about it","probability":0.85}]}
Probability: 0.65-0.95 based on how explicit the objection is.`;

  const userPrompt = `Detect objections:\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'ObjectionDetectionAgent', 400);
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

  return await callAI(systemPrompt, userPrompt, 'FearAgent', 400);
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

  return await callAI(systemPrompt, userPrompt, 'WhisperAgent', 400);
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

Return: {"rebuttals":[{"objectionIndex":0,"rebuttalScript":"I understand you want to think about it. What specific questions can I answer to help you feel confident?"}]}`;

  const userPrompt = `Generate rebuttals:\n${objectionsList}`;

  return await callAI(systemPrompt, userPrompt, 'RebuttalAgent', 600);
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

// ============================================================================
// AGENT 6: SPEAKER DETECTION AGENT
// Analyzes transcript to determine who is speaking (closer vs prospect)
// Uses conversation context to classify each new chunk
// ============================================================================
export async function runSpeakerDetectionAgent(newChunk, conversationHistory) {
  // Provide context about what this app is for
  const appContext = `Real estate sales conversation. CLOSER = salesperson asking questions. PROSPECT = seller sharing problems.`;

  // Limit history to last 8000 chars for context
  const maxHistoryChars = 8000;
  const trimmedHistory = conversationHistory.length > maxHistoryChars 
    ? conversationHistory.slice(-maxHistoryChars) 
    : conversationHistory;

  const systemPrompt = `${appContext}

Classify WHO is speaking:

CLOSER: asks questions, presents solutions, professional tone, empathy
PROSPECT: shares problems, personal info, objections, answers questions, emotional

If closer just asked a question, next text is likely prospect answering.

Return ONLY: {"speaker":"closer"} or {"speaker":"prospect"}`;

  const userPrompt = `HISTORY:\n${trimmedHistory}\n\nNEW TEXT: "${newChunk}"`;

  return await callAI(systemPrompt, userPrompt, 'SpeakerDetectionAgent', 50);
}

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

  return await callAI(systemPrompt, userPrompt, 'InsightsAgent', 400);
}

// ============================================================================
// MAIN: Run all agents in parallel
// ============================================================================
export async function runAllAgents(transcript, prospectType, customScriptPrompt = '') {
  console.log(`\n[MultiAgent] Starting parallel analysis...`);
  console.log(`[MultiAgent] Lubometer: 7 pillar agents | Objections: 4 agents | Others: 4 agents`);
  const startTime = Date.now();
  
  // Run all agents in parallel
  // Note: runAllPillarAgents internally runs 7 agents in parallel
  // Note: runObjectionsAgents internally runs 4 agents (1 sequential + 3 parallel)
  const [
    pillarsResult,
    hotButtonsResult,
    objectionsResult,
    diagnosticResult,
    truthIndexResult,
    insightsResult
  ] = await Promise.all([
    runAllPillarAgents(transcript),       // 7 pillar agents in parallel
    runHotButtonsAgent(transcript),
    runObjectionsAgents(transcript, customScriptPrompt), // 4 objection agents
    runDiagnosticQuestionsAgent(transcript, prospectType),
    runTruthIndexAgent(transcript),
    runInsightsAgent(transcript, prospectType)
  ]);
  
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
