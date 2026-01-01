/**
 * Multi-Agent AI System for Real-Time Sales Analysis
 * 
 * Each section has its own specialized AI agent that runs in parallel:
 * 1. Pillars Agent - Scores 27 indicators for Lubometer calculation
 * 2. Hot Buttons Agent - Extracts emotional triggers with quotes
 * 3. Objections Agent - Detects objections and generates rebuttals
 * 4. Diagnostic Questions Agent - Tracks which questions were asked
 * 5. Truth Index Agent - Analyzes coherence signals
 * 6. Insights Agent - Generates overall analysis summary
 * 
 * Lubometer is calculated from Pillars scores (not AI - it's math)
 */

import OpenAI from 'openai';

// Use OpenRouter for AI models
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
  timeout: 30000,
  maxRetries: 2,
  defaultHeaders: process.env.OPENROUTER_API_KEY ? {
    'HTTP-Referer': 'http://localhost:3001',
    'X-Title': 'Zero-Stress Sales CoPilot'
  } : {}
});

// Model configurations for different agents
// Using faster models for simpler tasks, more capable for complex tasks
const MODELS = {
  // Complex analysis requiring understanding of context
  PILLARS: process.env.OPENROUTER_API_KEY 
    ? 'anthropic/claude-sonnet-4-20250514' 
    : 'gpt-4o-mini',
  
  // Hot buttons need good quote extraction
  HOT_BUTTONS: process.env.OPENROUTER_API_KEY 
    ? 'anthropic/claude-sonnet-4-20250514' 
    : 'gpt-4o-mini',
  
  // Objections need empathetic understanding
  OBJECTIONS: process.env.OPENROUTER_API_KEY 
    ? 'anthropic/claude-sonnet-4-20250514' 
    : 'gpt-4o-mini',
  
  // Simple detection task
  DIAGNOSTIC: process.env.OPENROUTER_API_KEY 
    ? 'anthropic/claude-sonnet-4-20250514' 
    : 'gpt-4o-mini',
  
  // Analysis task
  TRUTH_INDEX: process.env.OPENROUTER_API_KEY 
    ? 'anthropic/claude-sonnet-4-20250514' 
    : 'gpt-4o-mini',
  
  // Summary task
  INSIGHTS: process.env.OPENROUTER_API_KEY 
    ? 'anthropic/claude-sonnet-4-20250514' 
    : 'gpt-4o-mini'
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
// AGENT 1: PILLARS AGENT - Scores 27 indicators
// ============================================================================
export async function runPillarsAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales conversation analyst. Score the 27 indicators (1-10) based on what the PROSPECT says.

SCORING CONTEXT - THE 7 PILLARS AND 27 INDICATORS:

PILLAR 1: Perceived Spread (Pain & Desire Gap) - MOST IMPORTANT
  1. Pain Intensity: How severe is their pain? (1=minor, 10=overwhelming)
  2. Pain Awareness: Do they understand root cause? (1=unclear, 10=deep understanding)
  3. Desire Clarity: How specific is their desired outcome? (1=vague, 10=vivid vision)
  4. Desire Priority: How important is solving this? (1=not urgent, 10=top priority)

PILLAR 2: Urgency
  5. Time Pressure: Real deadlines? (1=no deadline, 10=imminent deadline)
  6. Cost of Delay: What do they lose each month? (1=nothing, 10=major losses)
  7. Internal Timing: "Can't do this anymore" moment? (1=no shift, 10=strong activation)
  8. Environmental Availability: Do they have bandwidth? (1=overwhelmed, 10=available)

PILLAR 3: Decisiveness
  9. Decision Authority: Are they the final decision maker? (1=needs approval, 10=full authority)
  10. Decision Style: How do they decide? (1=very slow, 10=fast intuitive)
  11. Commitment to Decide: Ready to commit today? (1=wants to wait, 10=ready now)
  12. Self-Permission: Can they give themselves permission? (1=overthinks, 10=trusts self)

PILLAR 4: Available Money - MOST IMPORTANT
  13. Resource Access: Do they have funds available? (1=no funds, 10=readily available)
  14. Resource Fluidity: Can they move/reallocate funds? (1=tied up, 10=flexible)
  15. Investment Mindset: See it as investment vs cost? (1=cost mindset, 10=investment mindset)
  16. Resourcefulness: History of finding money when committed? (1=never, 10=always figures it out)

PILLAR 5: Responsibility & Ownership
  17. Problem Recognition: Acknowledge their role? (1=blames others, 10=owns it)
  18. Solution Ownership: Taking responsibility to change? (1=waiting for rescue, 10=it's on me)
  19. Locus of Control: Believe they control outcomes? (1=external factors, 10=I control it)
  20. Integrity: Desire vs Action: Alignment between wants and actions? (1=no alignment, 10=strong alignment)

PILLAR 6: Price Sensitivity (REVERSE SCORED - low is good)
  21. Emotional Response to Spending: Anxiety about investment? (1=not anxious, 10=very anxious)
  22. Negotiation Reflex: Always negotiating? (1=accepts price, 10=always negotiates)
  23. Structural Rigidity: Needs control over terms? (1=flexible, 10=rigid)

PILLAR 7: Trust
  24. ROI Ownership: Understands ROI depends on their action? (1=expects guarantee, 10=owns ROI)
  25. External Trust: Trust in provider/offer? (1=skeptical, 10=trusts)
  26. Internal Trust: Trust in own follow-through? (1=doubts self, 10=trusts self)
  27. Risk Tolerance: Willing to take calculated risks? (1=plays safe, 10=takes risks)

SCORING RULES:
- ONLY score indicators that are CLEARLY present in the transcript
- Score generously (7-9) when signals are clear
- Skip indicators you can't confidently score (don't guess)
- Focus on PROSPECT statements, not salesperson

Return ONLY valid JSON:
{
  "indicatorSignals": { "1": 8, "5": 9, "13": 7, ... }
}`;

  const userPrompt = `Analyze this conversation and score the 27 indicators.
ONLY score indicators where you can clearly identify the signal.

Transcript:
"${transcript}"

Return JSON with indicatorSignals only.`;

  return await callAI(MODELS.PILLARS, systemPrompt, userPrompt, 'PillarsAgent');
}

// ============================================================================
// AGENT 2: HOT BUTTONS AGENT - Extracts emotional triggers with quotes
// ============================================================================
export async function runHotButtonsAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales conversation analyst specializing in detecting "hot buttons" - emotional triggers that indicate prospect motivation.

HOT BUTTON INDICATORS (only these can be hot buttons):
1. Pain Awareness - "I'm done", "exhausted", "can't take it anymore"
2. Desire Clarity - "I want", "I need", "looking for"
3. Desire Priority - "Top priority", "most important thing"
5. Time Pressure - "auction in X days", "deadline coming"
6. Cost of Delay - "losing money every month", "costing me"
7. Internal Timing - "woke up and realized", "something changed"
11. Commitment to Decide - "ready to move forward", "let's do this"
12. Self-Permission - "I deserve this", "I'm worth it"
15. Investment Mindset - "worth it if it works", "good investment"
16. Resourcefulness - "I'll figure it out", "always find a way"
17. Problem Recognition - "I know I've been avoiding this"
18. Solution Ownership - "It's on me to fix this"
19. Locus of Control - "I control this", "up to me"
20. Desire vs Action - "Can't keep saying I want it but doing nothing"
24. ROI Ownership - "If I follow through, this will work"
25. External Trust - "I trust you", "believe in your offer"
26. Internal Trust - "I can do this", "I won't let myself down"
27. Risk Tolerance - "Worth the risk", "played it safe too long"

YOUR TASK:
1. Find emotional statements from the PROSPECT
2. Extract the EXACT VERBATIM quote from the transcript
3. Generate a custom follow-up question for each

CRITICAL RULES FOR QUOTES:
- Copy the EXACT words from the transcript - character for character
- DO NOT paraphrase, summarize, or change words
- DO NOT use descriptions like "The prospect expressed..."
- Keep quotes short (10-30 words) but exact

Return ONLY valid JSON:
{
  "hotButtonDetails": [
    {
      "id": 1,
      "quote": "I'm absolutely terrified of losing my home",
      "contextualPrompt": "That fear of losing your home - what would it mean if we could stop that?"
    }
  ]
}`;

  const userPrompt = `Find hot buttons in this conversation. Extract EXACT quotes from the prospect.

Transcript:
"${transcript}"

Return JSON with hotButtonDetails array. Each must have id, quote (EXACT from transcript), and contextualPrompt (custom follow-up question).`;

  return await callAI(MODELS.HOT_BUTTONS, systemPrompt, userPrompt, 'HotButtonsAgent');
}

// ============================================================================
// AGENT 3: OBJECTIONS AGENT - Detects objections and generates rebuttals
// ============================================================================
export async function runObjectionsAgent(transcript, prospectType) {
  const systemPrompt = `You are a sales conversation analyst specializing in detecting objections, hesitations, and concerns from prospects.

OBJECTION PATTERNS TO LOOK FOR:
- Price concerns: "too expensive", "can't afford", "need discount"
- Trust concerns: "sounds too good", "how do I know", "prove it"
- Timing concerns: "need to think", "too fast", "not ready"
- Authority concerns: "need to ask spouse", "partner decides"
- Value concerns: "not sure it's worth it", "what if it doesn't work"
- Fear concerns: "scared", "worried", "what if"

FOR EACH OBJECTION PROVIDE:
1. objectionText: The exact concern they raised (from transcript)
2. fear: The underlying emotional fear driving this objection
3. whisper: A 1-sentence insight about what they really need
4. rebuttalScript: A 2-3 sentence response to address the concern
5. probability: How confident you are (0.65-0.95)

Return ONLY valid JSON:
{
  "objections": [
    {
      "objectionText": "I need to think about it",
      "fear": "Fear of making the wrong decision",
      "whisper": "They need permission to trust their gut",
      "rebuttalScript": "I understand wanting to be sure. Most of my clients felt the same way. What specifically would you need to feel confident moving forward today?",
      "probability": 0.85
    }
  ]
}`;

  const userPrompt = `Detect objections, hesitations, and concerns from the PROSPECT in this conversation.

Transcript:
"${transcript}"

Return JSON with objections array. Include ALL hesitations, even subtle ones.`;

  return await callAI(MODELS.OBJECTIONS, systemPrompt, userPrompt, 'ObjectionsAgent');
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
export async function runAllAgents(transcript, prospectType) {
  console.log(`\n[MultiAgent] Starting parallel analysis with 6 AI agents...`);
  const startTime = Date.now();
  
  // Run all 6 agents in parallel
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
    runObjectionsAgent(transcript, prospectType),
    runDiagnosticQuestionsAgent(transcript, prospectType),
    runTruthIndexAgent(transcript, prospectType),
    runInsightsAgent(transcript, prospectType)
  ]);
  
  console.log(`[MultiAgent] All agents completed in ${Date.now() - startTime}ms`);
  
  // Combine results
  return {
    // From Pillars Agent
    indicatorSignals: pillarsResult.indicatorSignals || {},
    
    // From Hot Buttons Agent
    hotButtonDetails: hotButtonsResult.hotButtonDetails || [],
    
    // From Objections Agent
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
