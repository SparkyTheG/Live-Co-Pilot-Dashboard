/**
 * Extracts Hot Buttons (all 27 indicators) from conversation
 * ONLY the indicator NAME comes from CSV - everything else is AI-generated
 */

/**
 * Validates quotes match the transcript (logs warnings if not found)
 * The AI should provide exact quotes, so this mainly validates and logs issues
 */
function validateAndFixQuote(quote, transcript) {
  if (!quote || !transcript) return quote;
  
  const trimmedQuote = quote.trim();
  if (!trimmedQuote) return quote;
  
  // Normalize both for comparison (lowercase, single spaces)
  const normalizedQuote = trimmedQuote.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Check if quote exists in transcript (exact match, case-insensitive)
  if (normalizedTranscript.includes(normalizedQuote)) {
    // Quote exists - return original (preserving original case)
    console.log(`[HotButtons] ✓ Quote validated in transcript: "${trimmedQuote.substring(0, 60)}..."`);
    return trimmedQuote;
  }
  
  // Quote not found exactly - try to find a close match by checking if key words exist
  const quoteWords = normalizedQuote.split(/\s+/).filter(w => w.length > 2); // Only meaningful words (3+ chars)
  if (quoteWords.length === 0) {
    console.warn(`[HotButtons] ⚠ Quote has no meaningful words: "${trimmedQuote.substring(0, 60)}..."`);
    return trimmedQuote; // Return original anyway
  }
  
  // Count how many quote words appear in transcript
  const wordsInTranscript = normalizedTranscript.split(/\s+/);
  const matchedWords = quoteWords.filter(qw => 
    wordsInTranscript.some(tw => tw.includes(qw) || qw.includes(tw))
  );
  
  const matchRatio = matchedWords.length / quoteWords.length;
  
  if (matchRatio >= 0.8) {
    // Most words match - likely just spacing/punctuation differences
    console.log(`[HotButtons] ✓ Quote validated (${Math.round(matchRatio * 100)}% word match): "${trimmedQuote.substring(0, 60)}..."`);
    return trimmedQuote;
  } else {
    // Significant mismatch - log warning but still return original
    console.warn(`[HotButtons] ⚠ Quote may not match transcript (${Math.round(matchRatio * 100)}% word match): "${trimmedQuote.substring(0, 60)}..."`);
    console.warn(`[HotButtons]   Looking for words: ${quoteWords.slice(0, 5).join(', ')}...`);
    console.warn(`[HotButtons]   Transcript preview: "${transcript.substring(0, 200)}..."`);
    return trimmedQuote; // Return original - let it through, but logged for debugging
  }
}

// Hot Button definitions - ONLY used for mapping ID to Name
const INDICATOR_NAMES = {
  1: 'Pain Awareness',
  2: 'Desire Clarity',
  3: 'Desire Priority',
  4: 'Duration of Dissatisfaction',
  5: 'Time Pressure',
  6: 'Cost of Delay',
  7: 'Internal Timing Activation',
  8: 'Environmental Availability',
  9: 'Decision-Making Authority',
  10: 'Decision-Making Style',
  11: 'Commitment to Decide',
  12: 'Self-Permission to Choose',
  13: 'Resource Access',
  14: 'Resource Fluidity',
  15: 'Investment Mindset',
  16: 'Resourcefulness',
  17: 'Problem Recognition',
  18: 'Solution Ownership',
  19: 'Locus of Control',
  20: 'Integrity: Desire vs Action',
  21: 'Emotional Response to Spending',
  22: 'Negotiation Reflex',
  23: 'Structural Rigidity',
  24: 'ROI Ownership Framing',
  25: 'External Trust',
  26: 'Internal Trust',
  27: 'Risk Tolerance'
};

// Which indicators are considered "hot buttons" (emotional triggers)
const HOT_BUTTON_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 11, 12, 15, 16, 17, 18, 19, 20, 24, 25, 26, 27]);

/**
 * Extract all hot buttons from conversation based on AI analysis
 * ONLY indicator name from CSV - quote, prompt, score ALL from AI
 */
export function extractHotButtons(transcript, prospectType, aiAnalysis = null, pillarScores = null) {
  const detectedHotButtons = [];
  
  // ONLY use AI analysis - no fallbacks
  if (!aiAnalysis || aiAnalysis.error) {
    console.log(`[HotButtons] No AI analysis available, returning empty array`);
    return [];
  }
  
  console.log(`[HotButtons] Processing AI analysis:`, {
    hasHotButtonDetails: !!aiAnalysis.hotButtonDetails,
    hotButtonDetailsLength: aiAnalysis.hotButtonDetails?.length,
    hasIndicatorSignals: !!aiAnalysis.indicatorSignals,
    indicatorSignalsKeys: aiAnalysis.indicatorSignals ? Object.keys(aiAnalysis.indicatorSignals) : []
  });
  
  // Process hotButtonDetails from AI (this is the primary source)
  if (aiAnalysis.hotButtonDetails && Array.isArray(aiAnalysis.hotButtonDetails) && aiAnalysis.hotButtonDetails.length > 0) {
    console.log(`[HotButtons] Using hotButtonDetails from AI (${aiAnalysis.hotButtonDetails.length} items)`);
    
    for (const detail of aiAnalysis.hotButtonDetails) {
      const indicatorId = typeof detail.id === 'string' ? parseInt(detail.id, 10) : detail.id;
      if (isNaN(indicatorId) || indicatorId < 1 || indicatorId > 27) {
        console.log(`[HotButtons] Skipping invalid indicator ID: ${detail.id}`);
        continue;
      }
      
      // Only include if it's a hot button indicator
      if (!HOT_BUTTON_IDS.has(indicatorId)) {
        console.log(`[HotButtons] Skipping non-hot-button indicator: ${indicatorId}`);
        continue;
      }
      
      // Get score from AI's indicatorSignals
      const indicatorScoreRaw = aiAnalysis.indicatorSignals?.[indicatorId] || 
                                aiAnalysis.indicatorSignals?.[String(indicatorId)];
      
      // Skip if no score or score too low
      if (!indicatorScoreRaw) {
        console.log(`[HotButtons] Skipping indicator ${indicatorId} - no score in indicatorSignals`);
        continue;
      }
      
      const indicatorScore = typeof indicatorScoreRaw === 'string' ? parseFloat(indicatorScoreRaw) : indicatorScoreRaw;
      
      if (isNaN(indicatorScore) || indicatorScore < 6) {
        console.log(`[HotButtons] Skipping indicator ${indicatorId} - score too low: ${indicatorScore}`);
        continue;
      }
      
      // Get indicator name from CSV (ONLY thing from CSV)
      const indicatorName = INDICATOR_NAMES[indicatorId] || `Indicator ${indicatorId}`;
      
      // EVERYTHING else comes from AI - NO FALLBACKS to CSV
      let quote = (detail.quote || '').trim();  // Empty if AI didn't provide
      const prompt = detail.contextualPrompt || '';  // Empty if AI didn't provide
      
      // Skip if AI didn't provide a quote (means AI didn't actually detect this)
      if (!quote || quote.length === 0) {
        console.log(`[HotButtons] Skipping indicator ${indicatorId} - AI provided no quote`);
        continue;
      }
      
      // Validate and fix quote to match transcript exactly
      quote = validateAndFixQuote(quote, transcript);
      
      // Skip if quote is still empty after validation
      if (!quote || quote.trim().length === 0) {
        console.log(`[HotButtons] Skipping indicator ${indicatorId} - quote validation failed`);
        continue;
      }
      
      detectedHotButtons.push({
        id: indicatorId,
        name: indicatorName,  // ONLY from CSV
        quote: quote,         // AI-generated
        score: indicatorScore, // AI-generated
        prompt: prompt        // AI-generated
      });
      
      console.log(`[HotButtons] Added: ${indicatorName} (ID: ${indicatorId}, Score: ${indicatorScore})`);
      console.log(`[HotButtons]   Quote: "${quote.substring(0, 60)}..."`);
      console.log(`[HotButtons]   Prompt: "${prompt.substring(0, 60)}..."`);
    }
  } else {
    console.log(`[HotButtons] No hotButtonDetails from AI - returning empty (AI must provide hot buttons)`);
    // Don't fall back to indicatorSignals alone - we need the AI to provide quotes
  }
  
  // Sort by score (highest first)
  detectedHotButtons.sort((a, b) => b.score - a.score);
  
  console.log(`[HotButtons] Final result: ${detectedHotButtons.length} hot buttons extracted`);
  
  return detectedHotButtons;
}
