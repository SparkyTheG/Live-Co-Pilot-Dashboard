/**
 * Multi-Agent AI System for Real-Time Sales Analysis
 * 
 * Each section has its own specialized AI agent that runs in parallel:
 * 1. Pillars Agent - Scores 27 indicators for Lubometer calculation
 * 2. Hot Buttons Agent - Extracts emotional triggers with quotes
 * 3. Objections System (4 sub-agents):
 *    3a. Objection Detection Agent - Detects objections from transcript
 *    3b. Fear Analysis Agent - Generates "What They're Really Afraid Of" for each objection
 *    3c. Whisper/Reframe Agent - Generates "Whisper / Reframe" for each objection
 *    3d. Rebuttal Script Agent - Generates rebuttal scripts using custom prompt context
 * 4. Diagnostic Questions Agent - Tracks which questions were asked
 * 5. Truth Index Agent - Analyzes coherence signals
 * 6. Insights Agent - Generates overall analysis summary
 * 
 * Lubometer is calculated from Pillars scores (not AI - it's math)
 */

import OpenAI from 'openai';

// OpenAI configuration - using GPT-4o-mini for all agents
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2
});

// Model configuration - GPT-4o-mini for all agents (fast and cost-effective)
const MODEL = 'gpt-4o-mini';

// All agents use the same model
const MODELS = {
  PILLARS: MODEL,
  HOT_BUTTONS: MODEL,
  // Objections sub-agents
  OBJECTION_DETECTION: MODEL,
  OBJECTION_FEAR: MODEL,
  OBJECTION_WHISPER: MODEL,
  OBJECTION_REBUTTAL: MODEL,
  // Other agents
  DIAGNOSTIC: MODEL,
  TRUTH_INDEX: MODEL,
  INSIGHTS: MODEL
};

/**
 * Helper function to call AI with error handling
 */
async function callAI(model, systemPrompt, userPrompt, agentName) {
  const startTime = Date.now();
  
  try {
    console.log(`[${agentName}] Calling ${model}...`);
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.0,
      max_tokens: 1500
    });
    
    let content = response.choices[0].message.content;
    
    // Clean up markdown code blocks
    if (content.includes('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (content.includes('```')) {
      content = content.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(content);
    console.log(`[${agentName}] Completed in ${Date.now() - startTime}ms`);
    return parsed;
    
  } catch (error) {
    console.error(`[${agentName}] Error: ${error.message}`);
    return { error: error.message };
  }
}

// ============================================================================
// AGENT 1: PILLARS AGENT - Scores 27 indicators for Lubometer calculation
// ============================================================================
export async function runPillarsAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales conversation analyst. Score the 27 indicators (1-10) based on what the PROSPECT says.

=== LUBOMETER FORMULA (How your scores are used) ===

Step 1: Raw Score (Per Indicator) - You provide scores 1-10 for each indicator
Step 2: Average Per Pillar - Indicator scores are averaged within each pillar
Step 3: Reverse Score P6 - Price Sensitivity is reversed (11 - Raw Score)
Step 4: Weighted Pillar Score:
  - P1 (Pain & Desire) × 1.5 ← MOST IMPORTANT
  - P2 (Urgency) × 1.0
  - P3 (Decisiveness) × 1.0
  - P4 (Money) × 1.5 ← MOST IMPORTANT
  - P5 (Responsibility) × 1.0
  - P6 (Price Sensitivity) × 1.0 (after reverse)
  - P7 (Trust) × 1.0
Step 5: Total Score = Sum of weighted pillars (max = 90)
Step 6: Apply Truth Index Penalties for incoherence
Step 7: Final Lubometer Score = Total - Penalties

READINESS ZONES:
  70-90 → ✅ GREEN: High Buy Probability - Push to close
  50-69 → ⚠️ YELLOW: Moderate - Needs coaching
  30-49 → 🧊 RED: Risk or resistance - Slow down
  <30 → ❌ NO-GO: Do not close

CLOSE BLOCKER RULES:
  Rule 1: P1 ≤ 6 AND P2 ≤ 5 → ❌ Not enough pain or urgency
  Rule 2: P6 raw ≥ 7 AND P4 ≤ 5 → ❌ High price sensitivity + low money

TRUTH INDEX PENALTIES (deducted from score):
  - High Pain (P1 ≥ 7) + Low Urgency (P2 ≤ 4) → -15 points
  - High Desire + Low Decisiveness (P3 ≤ 4) → -15 points
  - High Money (P4 ≥ 7) + High Price Sensitivity (P6 ≥ 8) → -10 points
  - Claims Authority + Reveals Need for Approval → -10 points
  - High Desire + Low Responsibility (P5 ≤ 5) → -15 points

=== THE 7 PILLARS AND 27 INDICATORS ===

PILLAR 1: Perceived Spread (Pain & Desire Gap) - WEIGHT 1.5x
  1. Pain Intensity: How severe is their pain? (1=minor, 10=overwhelming)
  2. Pain Awareness: Do they understand root cause? (1=unclear, 10=deep understanding)
  3. Desire Clarity: How specific is their desired outcome? (1=vague, 10=vivid vision)
  4. Desire Priority: How important is solving this? (1=not urgent, 10=top priority)

PILLAR 2: Urgency - WEIGHT 1.0x
  5. Time Pressure: Real deadlines? (1=no deadline, 10=imminent deadline)
  6. Cost of Delay: What do they lose each month? (1=nothing, 10=major losses)
  7. Internal Timing: "Can't do this anymore" moment? (1=no shift, 10=strong activation)
  8. Environmental Availability: Do they have bandwidth? (1=overwhelmed, 10=available)

PILLAR 3: Decisiveness - WEIGHT 1.0x
  9. Decision Authority: Are they the final decision maker? (1=needs approval, 10=full authority)
  10. Decision Style: How do they decide? (1=very slow, 10=fast intuitive)
  11. Commitment to Decide: Ready to commit today? (1=wants to wait, 10=ready now)
  12. Self-Permission: Can they give themselves permission? (1=overthinks, 10=trusts self)

PILLAR 4: Available Money - WEIGHT 1.5x
  13. Resource Access: Do they have funds available? (1=no funds, 10=readily available)
  14. Resource Fluidity: Can they move/reallocate funds? (1=tied up, 10=flexible)
  15. Investment Mindset: See it as investment vs cost? (1=cost mindset, 10=investment mindset)
  16. Resourcefulness: History of finding money when committed? (1=never, 10=always figures it out)

PILLAR 5: Responsibility & Ownership - WEIGHT 1.0x
  17. Problem Recognition: Acknowledge their role? (1=blames others, 10=owns it)
  18. Solution Ownership: Taking responsibility to change? (1=waiting for rescue, 10=it's on me)
  19. Locus of Control: Believe they control outcomes? (1=external factors, 10=I control it)
  20. Integrity: Desire vs Action: Alignment between wants and actions? (1=no alignment, 10=strong alignment)

PILLAR 6: Price Sensitivity (REVERSE SCORED) - WEIGHT 1.0x
  21. Emotional Response to Spending: Anxiety about investment? (1=not anxious, 10=very anxious)
  22. Negotiation Reflex: Always negotiating? (1=accepts price, 10=always negotiates)
  23. Structural Rigidity: Needs control over terms? (1=flexible, 10=rigid)
  NOTE: For P6, LOW scores (1-3) are GOOD (low sensitivity), HIGH scores (7-10) are BAD

PILLAR 7: Trust - WEIGHT 1.0x
  24. ROI Ownership: Understands ROI depends on their action? (1=expects guarantee, 10=owns ROI)
  25. External Trust: Trust in provider/offer? (1=skeptical, 10=trusts)
  26. Internal Trust: Trust in own follow-through? (1=doubts self, 10=trusts self)
  27. Risk Tolerance: Willing to take calculated risks? (1=plays safe, 10=takes risks)

=== SCORING RULES ===
- Score generously (7-9) when signals are clearly present
- P1 and P4 have 1.5x weight - score these carefully as they impact lubometer most
- For P6 (Price Sensitivity): LOW scores are GOOD (they're not price sensitive)
- Focus on PROSPECT statements, not salesperson
- Score indicators you can clearly identify from the conversation

Return ONLY valid JSON:
{
  "indicatorSignals": { "1": 8, "5": 9, "13": 7, ... }
}`;

  const userPrompt = `Analyze this conversation and score the 27 indicators for the Lubometer.
Your scores directly determine the prospect's readiness zone (Green/Yellow/Red/No-Go).

Transcript:
"${transcript}"

Return JSON with indicatorSignals. Score generously for clear signals.`;

  return await callAI(MODELS.PILLARS, systemPrompt, userPrompt, 'PillarsAgent');
}

// ============================================================================
// AGENT 2: HOT BUTTONS AGENT - Extracts emotional triggers with quotes
// ============================================================================
export async function runHotButtonsAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales conversation analyst detecting "hot buttons" - emotional triggers from prospects.

ALL 27 INDICATORS CAN BE HOT BUTTONS:
P1 - Pain & Desire:
  1. Pain Awareness - fear, worry, stress, concern, frustrated
  2. Desire Clarity - want, need, looking for, hope to
  3. Desire Priority - most important, top priority, main goal
  4. Duration - been dealing with, for months/years, ongoing
P2 - Urgency:
  5. Time Pressure - deadline, auction, days left, running out
  6. Cost of Delay - losing money, costing me, wasting
  7. Internal Timing - realized, woke up, decided, had enough
  8. Environmental - market, economy, situation changed
P3 - Decisiveness:
  9. Decision Authority - I decide, my choice, up to me
  10. Decision Style - think about it, need time, research
  11. Commitment - ready, let's do it, want to move forward
  12. Self-Permission - deserve this, worth it, allowed to
P4 - Money:
  13. Resource Access - have funds, can get money, financing
  14. Resource Fluidity - flexible, can move money, liquid
  15. Investment Mindset - worth it, good investment, ROI
  16. Resourcefulness - figure it out, find a way, make it work
P5 - Responsibility:
  17. Problem Recognition - know I have a problem, see the issue
  18. Solution Ownership - need to fix this, my responsibility
  19. Locus of Control - I control this, it's on me
  20. Desire vs Action - can't keep saying, need to act
P6 - Price Sensitivity:
  21. Emotional Spending - worried about cost, feels expensive
  22. Negotiation - price too high, need discount, can you lower
  23. Structural Rigidity - budget set, can't go higher
P7 - Trust:
  24. ROI Ownership - if I do this, it will work
  25. External Trust - trust you, believe in this
  26. Internal Trust - I can do this, believe in myself
  27. Risk Tolerance - worth the risk, tired of playing safe

DETECT GENEROUSLY - even short phrases count!
Examples of valid hot buttons from short speech:
- "worried" → Pain Awareness (1)
- "need help" → Desire Clarity (2)
- "deadline" → Time Pressure (5)
- "expensive" → Emotional Spending (21)
- "can't afford" → Resource Access (13)
- "scared" → Pain Awareness (1)

QUOTE RULES:
- Use words that appear in the transcript
- Short quotes (3-20 words) are fine
- Capture the emotional content

Return ONLY valid JSON:
{
  "hotButtonDetails": [
    {
      "id": 1,
      "quote": "I'm worried about",
      "contextualPrompt": "What specifically worries you most?",
      "score": 7
    }
  ]
}`;

  const userPrompt = `Detect ALL emotional triggers in this transcript. Be generous - short phrases count!

Transcript:
"${transcript}"

Return JSON with hotButtonDetails array. Each hot button needs:
- id (indicator number 1-27)
- quote (words from transcript, even short phrases)
- contextualPrompt (follow-up question)
- score (intensity 1-10)

Even single emotional words like "worried", "scared", "need", "can't" should trigger detection.`;

  return await callAI(MODELS.HOT_BUTTONS, systemPrompt, userPrompt, 'HotButtonsAgent');
}

// ============================================================================
// OBJECTIONS SYSTEM: 4 Specialized Agents
// ============================================================================

/**
 * AGENT 3a: OBJECTION DETECTION AGENT
 * Detects objections from the transcript
 */
export async function runObjectionDetectionAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales conversation analyst. Your ONLY job is to detect objections, concerns, and hesitations from the prospect.

DETECT ANY OF THESE PATTERNS (even single words count!):
- PRICE: expensive, cost, afford, money, budget, price, pay, worth
- TRUST: sure, trust, believe, guarantee, proof, skeptical, really
- TIMING: think, wait, later, soon, time, rush, fast, ready
- AUTHORITY: spouse, partner, wife, husband, boss, ask, consult
- VALUE: worth, work, benefit, help, sure, certain, actually
- FEAR: scared, worried, afraid, nervous, concerned, what if
- HESITATION: maybe, perhaps, not sure, don't know, hesitant, but

DETECT GENEROUSLY:
- Even short statements count: "it's expensive" or "I'm worried" or "need to think"
- Partial objections count: "but..." or "I don't know if..."
- Implied objections count: tone of uncertainty or concern

Return ONLY the objection text and probability. Other details will be generated by specialized agents.

Return ONLY valid JSON:
{
  "detectedObjections": [
    {
      "objectionText": "I need to think about it",
      "probability": 0.85
    },
    {
      "objectionText": "it's expensive",
      "probability": 0.75
    }
  ]
}`;

  const userPrompt = `Detect ALL objections, concerns, and hesitations from the prospect in this transcript.
Be generous - even single words or implied hesitations count!

Transcript:
"${transcript}"

Return JSON with detectedObjections array. Each needs objectionText and probability (0.65-0.95).`;

  return await callAI(MODELS.OBJECTION_DETECTION, systemPrompt, userPrompt, 'ObjectionDetectionAgent');
}

/**
 * AGENT 3b: FEAR ANALYSIS AGENT
 * Generates "What They're Really Afraid Of" for each detected objection
 */
export async function runFearAnalysisAgent(transcript, detectedObjections) {
  if (!detectedObjections || detectedObjections.length === 0) {
    return { fears: [] };
  }

  const objectionsList = detectedObjections.map((obj, idx) => 
    `${idx + 1}. "${obj.objectionText}"`
  ).join('\n');

  const systemPrompt = `You are a sales psychology expert. Your job is to identify the UNDERLYING FEAR behind each objection.

People don't object because of what they say - they object because of what they FEAR.
Look beyond the surface objection to the emotional root cause.

COMMON FEAR PATTERNS:
- "It's expensive" → Fear of making a bad financial decision, fear of being fooled
- "Need to think" → Fear of making the wrong choice, fear of commitment
- "Not sure it will work" → Fear of failure, fear of wasting time/money
- "Need to ask spouse" → Fear of conflict at home, fear of not being in control
- "What if it doesn't work" → Fear of being stuck, fear of regret
- "I've tried before" → Fear of repeating past failures, fear of disappointment

Analyze the transcript context to understand WHY they might have this fear.

Return ONLY valid JSON:
{
  "fears": [
    {
      "objectionIndex": 0,
      "fear": "Fear of making a financial mistake and regretting it"
    }
  ]
}`;

  const userPrompt = `For each objection below, identify what the prospect is REALLY afraid of.
Use the transcript context to understand their specific situation and fears.

OBJECTIONS TO ANALYZE:
${objectionsList}

TRANSCRIPT CONTEXT:
"${transcript}"

Return JSON with fears array. Each entry needs objectionIndex (0-based) and fear (the underlying emotional fear).`;

  return await callAI(MODELS.OBJECTION_FEAR, systemPrompt, userPrompt, 'FearAnalysisAgent');
}

/**
 * AGENT 3c: WHISPER/REFRAME AGENT
 * Generates "Whisper / Reframe" for each detected objection
 */
export async function runWhisperReframeAgent(transcript, detectedObjections) {
  if (!detectedObjections || detectedObjections.length === 0) {
    return { whispers: [] };
  }

  const objectionsList = detectedObjections.map((obj, idx) => 
    `${idx + 1}. "${obj.objectionText}"`
  ).join('\n');

  const systemPrompt = `You are a sales coach providing "whisper" insights - quick mental reframes for the salesperson.

A WHISPER is a short, actionable insight that helps the salesperson understand what the prospect needs.
It's NOT a script - it's an internal thought to guide their approach.

GOOD WHISPERS:
- "They need to see immediate value, not long-term benefits"
- "They're protecting themselves from past disappointments"
- "They need permission to invest in themselves"
- "They're looking for certainty before committing"
- "They need to feel in control of the decision"

WHISPER GUIDELINES:
- Start with "They need..." or "They're looking for..." or "They want..."
- Keep it under 15 words
- Focus on what the prospect NEEDS, not what the salesperson should SAY
- Be empathetic, not manipulative

Return ONLY valid JSON:
{
  "whispers": [
    {
      "objectionIndex": 0,
      "whisper": "They need to see personal relevance before committing"
    }
  ]
}`;

  const userPrompt = `For each objection below, provide a short "whisper" insight for the salesperson.
Use the transcript context to make the whisper specific to this prospect's situation.

OBJECTIONS TO ANALYZE:
${objectionsList}

TRANSCRIPT CONTEXT:
"${transcript}"

Return JSON with whispers array. Each entry needs objectionIndex (0-based) and whisper (short insight under 15 words).`;

  return await callAI(MODELS.OBJECTION_WHISPER, systemPrompt, userPrompt, 'WhisperReframeAgent');
}

/**
 * AGENT 3d: REBUTTAL SCRIPT AGENT
 * Generates rebuttal scripts for each detected objection
 * Uses customScriptPrompt for personalization
 */
export async function runRebuttalScriptAgent(transcript, detectedObjections, customScriptPrompt = '') {
  if (!detectedObjections || detectedObjections.length === 0) {
    return { rebuttals: [] };
  }

  const objectionsList = detectedObjections.map((obj, idx) => 
    `${idx + 1}. "${obj.objectionText}"`
  ).join('\n');

  // Build custom context if provided
  const customContext = customScriptPrompt && customScriptPrompt.trim().length > 0
    ? `\nCUSTOM CONTEXT FROM USER: "${customScriptPrompt}"\nIncorporate this context naturally into your rebuttals.`
    : '';

  const systemPrompt = `You are a sales script expert. Generate natural, empathetic rebuttal scripts for objections.

REBUTTAL GUIDELINES:
- Start with empathy: "I understand..." or "That's a valid concern..." or "It's natural to..."
- Acknowledge their concern genuinely
- Reframe the objection positively
- Provide a concrete next step or question
- Keep it to 2-3 sentences max
- Sound natural, not salesy
- Focus on value and outcomes, not pressure
${customContext}

GOOD REBUTTAL EXAMPLES:
- "I understand price is a concern. Let me show you how this pays for itself within 30 days so you can see the real value."
- "It's natural to want to think it over. What specific questions can I answer right now to help you feel confident?"
- "That's a valid point. Many of our clients felt the same way initially, and here's what changed their mind..."

Return ONLY valid JSON:
{
  "rebuttals": [
    {
      "objectionIndex": 0,
      "rebuttalScript": "I understand you want to think about it. What specific concerns can I address right now to help you feel more confident?"
    }
  ]
}`;

  const userPrompt = `For each objection below, generate a natural, empathetic rebuttal script.
Use the transcript context to make the rebuttal specific and relevant.

OBJECTIONS TO ADDRESS:
${objectionsList}

TRANSCRIPT CONTEXT:
"${transcript}"

Return JSON with rebuttals array. Each entry needs objectionIndex (0-based) and rebuttalScript (2-3 sentences).`;

  return await callAI(MODELS.OBJECTION_REBUTTAL, systemPrompt, userPrompt, 'RebuttalScriptAgent');
}

/**
 * COMBINED OBJECTIONS FUNCTION
 * Runs all 4 objection agents: Detection first, then Fear/Whisper/Rebuttal in parallel
 */
export async function runObjectionsAgents(transcript, prospectType, customScriptPrompt = '') {
  console.log(`[ObjectionsSystem] Starting 4-agent objections analysis...`);
  const startTime = Date.now();

  // Step 1: Detect objections first
  const detectionResult = await runObjectionDetectionAgent(transcript, prospectType);
  
  if (detectionResult.error || !detectionResult.detectedObjections || detectionResult.detectedObjections.length === 0) {
    console.log(`[ObjectionsSystem] No objections detected or error occurred`);
    return { objections: [] };
  }

  const detectedObjections = detectionResult.detectedObjections;
  console.log(`[ObjectionsSystem] Detected ${detectedObjections.length} objections, running Fear/Whisper/Rebuttal agents in parallel...`);

  // Step 2: Run Fear, Whisper, and Rebuttal agents in PARALLEL
  const [fearResult, whisperResult, rebuttalResult] = await Promise.all([
    runFearAnalysisAgent(transcript, detectedObjections),
    runWhisperReframeAgent(transcript, detectedObjections),
    runRebuttalScriptAgent(transcript, detectedObjections, customScriptPrompt)
  ]);

  // Step 3: Combine results into final objections array
  const objections = detectedObjections.map((obj, idx) => {
    // Find matching fear, whisper, rebuttal by index
    const fearItem = (fearResult.fears || []).find(f => f.objectionIndex === idx);
    const whisperItem = (whisperResult.whispers || []).find(w => w.objectionIndex === idx);
    const rebuttalItem = (rebuttalResult.rebuttals || []).find(r => r.objectionIndex === idx);

    return {
      objectionText: obj.objectionText,
      probability: obj.probability,
      fear: fearItem?.fear || 'Unable to analyze underlying fear',
      whisper: whisperItem?.whisper || 'Consider their perspective',
      rebuttalScript: rebuttalItem?.rebuttalScript || 'Address their concern with empathy and provide clear value.'
    };
  });

  console.log(`[ObjectionsSystem] Completed in ${Date.now() - startTime}ms with ${objections.length} objections`);
  
  return { objections };
}

// ============================================================================
// AGENT 4: DIAGNOSTIC QUESTIONS AGENT - Tracks which questions were asked
// ============================================================================
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

export async function runDiagnosticQuestionsAgent(transcript, prospectType) {
  const questions = DIAGNOSTIC_QUESTIONS[prospectType] || DIAGNOSTIC_QUESTIONS['foreclosure'];
  const questionsList = questions.map((q, idx) => `${idx}. ${q}`).join('\n');
  
  const systemPrompt = `You are analyzing a sales conversation to detect which diagnostic questions the SALESPERSON has asked.

DIAGNOSTIC QUESTIONS FOR ${prospectType}:
${questionsList}

RULES:
- ONLY detect questions asked BY THE SALESPERSON (not the prospect)
- Match SEMANTICALLY - exact wording doesn't need to match, but meaning must match
- Return array of indices (0-based) for questions that were asked
- If a question was asked in different words but same meaning, include it

Return ONLY valid JSON:
{
  "askedQuestions": [0, 2, 5]
}`;

  const userPrompt = `Which diagnostic questions did the SALESPERSON ask in this conversation?

Transcript:
"${transcript}"

Return JSON with askedQuestions array of indices.`;

  return await callAI(MODELS.DIAGNOSTIC, systemPrompt, userPrompt, 'DiagnosticAgent');
}

// ============================================================================
// AGENT 5: TRUTH INDEX AGENT - Analyzes coherence and contradictions
// ============================================================================
export async function runTruthIndexAgent(transcript, prospectType) {
  const systemPrompt = `You are analyzing a sales conversation for COHERENCE - detecting if the prospect's statements align or contradict each other.

INCOHERENCE PATTERNS TO DETECT:

T1: High Pain + Low Urgency
- Claims deep pain ("this is killing me") but shows no urgency to act
- Red flag: emotional words but no action orientation

T2: High Desire + Low Decisiveness  
- Wants change badly but avoids making decisions
- Red flag: "I want this so much" + "I need to think about it more"

T3: High Money + High Price Sensitivity
- Has money available but still resists price
- Red flag: "I have the money" + "can you lower the price"

T4: Claims Authority + Needs Approval
- Says they decide but reveals needing partner approval
- Red flag: "I'm the decision maker" + "I'll need to ask my wife"

T5: High Desire + Low Responsibility
- Wants results but doesn't take ownership
- Red flag: "I want this outcome" + blames external factors

T6: High Commitment + External Blame
- Claims ready to commit but blames external factors
- Red flag: "I'm ready" + "if only X would change"

POSITIVE COHERENCE SIGNALS:
- Pain + Urgency aligned
- Desire + Decisiveness aligned
- Money + Investment mindset aligned
- Authority + Action aligned
- Takes ownership

Return ONLY valid JSON:
{
  "coherenceSignals": ["High pain awareness with matching urgency"],
  "incoherenceFlags": ["Claims authority but mentions needing approval"],
  "overallCoherence": "high" | "medium" | "low"
}`;

  const userPrompt = `Analyze this conversation for coherence - do the prospect's statements align or contradict?

Transcript:
"${transcript}"

Return JSON with coherenceSignals, incoherenceFlags, and overallCoherence.`;

  return await callAI(MODELS.TRUTH_INDEX, systemPrompt, userPrompt, 'TruthIndexAgent');
}

// ============================================================================
// AGENT 6: INSIGHTS AGENT - Generates overall analysis summary
// ============================================================================
export async function runInsightsAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales coach analyzing a conversation to provide actionable insights.

Generate:
1. summary: Brief overview of the prospect's situation (1-2 sentences)
2. keyMotivators: What's driving them (2-3 bullet points)
3. concerns: What's holding them back (2-3 bullet points)
4. recommendation: What the salesperson should do next (1 sentence)
5. closingReadiness: "ready", "almost", "not_ready"

Return ONLY valid JSON:
{
  "summary": "Prospect is a motivated seller facing foreclosure with 2 weeks until auction.",
  "keyMotivators": ["Imminent auction deadline", "Family stability concerns", "Financial relief"],
  "concerns": ["Price expectations", "Trust in process"],
  "recommendation": "Address trust concerns then present offer with urgency focus.",
  "closingReadiness": "almost"
}`;

  const userPrompt = `Provide sales insights for this ${prospectType} conversation.

Transcript:
"${transcript}"

Return JSON with summary, keyMotivators, concerns, recommendation, and closingReadiness.`;

  return await callAI(MODELS.INSIGHTS, systemPrompt, userPrompt, 'InsightsAgent');
}

// ============================================================================
// MAIN FUNCTION: Run all agents in parallel
// ============================================================================
export async function runAllAgents(transcript, prospectType, customScriptPrompt = '') {
  console.log(`\n[MultiAgent] Starting parallel analysis with specialized AI agents...`);
  const startTime = Date.now();
  
  // Run all agents in parallel
  // Note: Objections now uses 4 sub-agents internally
  const [
    pillarsResult,
    hotButtonsResult,
    objectionsResult,
    diagnosticResult,
    truthIndexResult,
    insightsResult
  ] = await Promise.all([
    runPillarsAgent(transcript, prospectType),
    runHotButtonsAgent(transcript, prospectType),
    runObjectionsAgents(transcript, prospectType, customScriptPrompt), // 4 agents internally
    runDiagnosticQuestionsAgent(transcript, prospectType),
    runTruthIndexAgent(transcript, prospectType),
    runInsightsAgent(transcript, prospectType)
  ]);
  
  console.log(`[MultiAgent] All agents completed in ${Date.now() - startTime}ms`);
  console.log(`[MultiAgent] Agent breakdown:`);
  console.log(`  - Pillars: ${Object.keys(pillarsResult.indicatorSignals || {}).length} indicators`);
  console.log(`  - Hot Buttons: ${(hotButtonsResult.hotButtonDetails || []).length} detected`);
  console.log(`  - Objections (4-agent system): ${(objectionsResult.objections || []).length} with fear/whisper/rebuttal`);
  console.log(`  - Diagnostic: ${(diagnosticResult.askedQuestions || []).length} questions asked`);
  console.log(`  - Truth Index: ${truthIndexResult.overallCoherence || 'unknown'} coherence`);
  console.log(`  - Insights: ${insightsResult.closingReadiness || 'unknown'} readiness`);
  
  // Combine results
  return {
    // From Pillars Agent
    indicatorSignals: pillarsResult.indicatorSignals || {},
    
    // From Hot Buttons Agent
    hotButtonDetails: hotButtonsResult.hotButtonDetails || [],
    
    // From Objections System (4 agents: Detection + Fear + Whisper + Rebuttal)
    objections: objectionsResult.objections || [],
    
    // From Diagnostic Questions Agent
    askedQuestions: diagnosticResult.askedQuestions || [],
    
    // From Truth Index Agent
    coherenceSignals: truthIndexResult.coherenceSignals || [],
    incoherenceFlags: truthIndexResult.incoherenceFlags || [],
    overallCoherence: truthIndexResult.overallCoherence || 'medium',
    
    // From Insights Agent
    insights: insightsResult.summary || '',
    keyMotivators: insightsResult.keyMotivators || [],
    concerns: insightsResult.concerns || [],
    recommendation: insightsResult.recommendation || '',
    closingReadiness: insightsResult.closingReadiness || 'not_ready',
    
    // Metadata
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
