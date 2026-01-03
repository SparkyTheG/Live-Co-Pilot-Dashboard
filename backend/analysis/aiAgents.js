/**
 * Multi-Agent AI System for Real-Time Sales Analysis
 * 
 * OPTIMIZED: Each agent has minimal, focused prompts for speed and efficiency.
 * Each agent ONLY analyzes information relevant to its specific output.
 * 
 * Agents:
 * 1. Pillars Agent → indicatorSignals (scores 1-10 for 27 indicators)
 * 2. Hot Buttons Agent → hotButtonDetails (emotional triggers with quotes)
 * 3. Objections System (4 sub-agents):
 *    3a. Detection → objectionText + probability
 *    3b. Fear → underlying fear per objection
 *    3c. Whisper → quick insight per objection
 *    3d. Rebuttal → script per objection
 * 4. Diagnostic Agent → askedQuestions (indices)
 * 5. Truth Index Agent → coherenceSignals, incoherenceFlags, overallCoherence
 * 6. Insights Agent → summary, keyMotivators, concerns, recommendation, closingReadiness
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
// AGENT 1: PILLARS AGENT
// Output: indicatorSignals (27 indicator scores for Lubometer)
// ============================================================================
export async function runPillarsAgent(transcript) {
  const systemPrompt = `Score 27 sales readiness indicators (1-10) from PROSPECT statements only.

INDICATORS:
P1 Pain/Desire (1.5x weight): 1.PainIntensity 2.PainAwareness 3.DesireClarity 4.DesirePriority
P2 Urgency: 5.TimePressure 6.CostOfDelay 7.InternalTiming 8.Availability
P3 Decisiveness: 9.Authority 10.DecisionStyle 11.Commitment 12.SelfPermission
P4 Money (1.5x weight): 13.ResourceAccess 14.ResourceFluidity 15.InvestmentMindset 16.Resourcefulness
P5 Responsibility: 17.ProblemRecognition 18.SolutionOwnership 19.LocusOfControl 20.DesireVsAction
P6 PriceSensitivity (REVERSE): 21.EmotionalSpending 22.Negotiation 23.Rigidity (LOW=good)
P7 Trust: 24.ROIOwnership 25.ExternalTrust 26.InternalTrust 27.RiskTolerance

Score 1=absent, 5=moderate, 10=very strong. Score generously for clear signals.
Return ONLY: {"indicatorSignals":{"1":7,"2":8,...}}`;

  const userPrompt = `Score indicators from prospect statements:\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'PillarsAgent', 600);
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
// Output: coherenceSignals, incoherenceFlags, overallCoherence
// ============================================================================
export async function runTruthIndexAgent(transcript) {
  const systemPrompt = `Detect if prospect's statements ALIGN or CONTRADICT each other.

CONTRADICTIONS (red flags):
- High pain + no urgency to act
- Wants change + avoids decisions  
- Has money + resists price
- Claims authority + needs spouse approval
- Wants results + blames external factors

ALIGNMENT (positive):
- Pain matches urgency
- Desire matches decisiveness
- Takes ownership

Return: {"coherenceSignals":["Pain aligned with urgency"],"incoherenceFlags":["Claims authority but needs approval"],"overallCoherence":"high|medium|low"}`;

  const userPrompt = `Check coherence:\n"${transcript}"`;

  return await callAI(systemPrompt, userPrompt, 'TruthIndexAgent', 400);
}

// ============================================================================
// AGENT 6: INSIGHTS AGENT
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
  const startTime = Date.now();
  
  // Run all agents in parallel
  const [
    pillarsResult,
    hotButtonsResult,
    objectionsResult,
    diagnosticResult,
    truthIndexResult,
    insightsResult
  ] = await Promise.all([
    runPillarsAgent(transcript),
    runHotButtonsAgent(transcript),
    runObjectionsAgents(transcript, customScriptPrompt),
    runDiagnosticQuestionsAgent(transcript, prospectType),
    runTruthIndexAgent(transcript),
    runInsightsAgent(transcript, prospectType)
  ]);
  
  console.log(`[MultiAgent] All done in ${Date.now() - startTime}ms`);
  
  return {
    indicatorSignals: pillarsResult.indicatorSignals || {},
    hotButtonDetails: hotButtonsResult.hotButtonDetails || [],
    objections: objectionsResult.objections || [],
    askedQuestions: diagnosticResult.askedQuestions || [],
    coherenceSignals: truthIndexResult.coherenceSignals || [],
    incoherenceFlags: truthIndexResult.incoherenceFlags || [],
    overallCoherence: truthIndexResult.overallCoherence || 'medium',
    insights: insightsResult.summary || '',
    keyMotivators: insightsResult.keyMotivators || [],
    concerns: insightsResult.concerns || [],
    recommendation: insightsResult.recommendation || '',
    closingReadiness: insightsResult.closingReadiness || 'not_ready',
    agentErrors: {
      pillars: pillarsResult.error || null,
      hotButtons: hotButtonsResult.error || null,
      objections: objectionsResult.error || null,
      diagnostic: diagnosticResult.error || null,
      truthIndex: truthIndexResult.error || null,
      insights: insightsResult.error || null
    }
  };
}
