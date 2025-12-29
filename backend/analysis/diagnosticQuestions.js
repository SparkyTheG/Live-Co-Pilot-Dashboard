/**
 * Detects which diagnostic questions have been asked in the conversation
 * Uses AI analysis to match questions being asked to the diagnostic questions list
 */

// Diagnostic questions for each prospect type (matching frontend)
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

export function detectAskedDiagnosticQuestions(transcript, prospectType, aiAnalysis = null) {
  const questions = DIAGNOSTIC_QUESTIONS[prospectType] || DIAGNOSTIC_QUESTIONS['foreclosure'];
  const totalQuestions = questions.length;
  
  if (!transcript || transcript.trim().length === 0) {
    return {
      asked: [],
      total: totalQuestions,
      completion: 0
    };
  }
  
  // ONLY use AI-detected questions - no fallback pattern matching
  // AI is the authority on what questions were asked
  if (aiAnalysis && aiAnalysis.askedQuestions && Array.isArray(aiAnalysis.askedQuestions)) {
    // Filter to valid indices only (0 to totalQuestions-1)
    const validIndices = aiAnalysis.askedQuestions
      .filter((idx) => typeof idx === 'number' && idx >= 0 && idx < totalQuestions)
      .sort((a, b) => a - b);
    
    console.log(`[DiagnosticQuestions] AI detected ${validIndices.length} questions: [${validIndices.join(', ')}]`);
    
    return {
      asked: validIndices,
      total: totalQuestions,
      completion: Math.round((validIndices.length / totalQuestions) * 100)
    };
  }

  // No AI detection available - return empty (don't guess with pattern matching)
  console.log(`[DiagnosticQuestions] No AI detection, returning empty`);
  return {
    asked: [],
    total: totalQuestions,
    completion: 0
  };
}

