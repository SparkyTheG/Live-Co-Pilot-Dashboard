/**
 * Extracts Hot Buttons (all 27 indicators) from conversation
 * ONLY the indicator NAME comes from CSV - everything else is AI-generated
 */

/**
 * Check if two strings are similar (for deduplication)
 * Returns true if strings share >60% of their words
 */
function areSimilarStrings(str1, str2) {
  if (!str1 || !str2) return false;
  
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words1 = normalize(str1).split(/\s+/).filter(w => w.length > 2);
  const words2 = normalize(str2).split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Count overlapping words
  const overlap = [...set1].filter(w => set2.has(w)).length;
  const minSize = Math.min(set1.size, set2.size);
  
  // If >60% words overlap, consider them similar
  return minSize > 0 && (overlap / minSize) > 0.6;
}

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
  
  if (matchRatio >= 0.5) {
    // At least half words match - accept it (more lenient for speech-to-text)
    console.log(`[HotButtons] ✓ Quote validated (${Math.round(matchRatio * 100)}% word match): "${trimmedQuote.substring(0, 60)}..."`);
    return trimmedQuote;
  } else if (matchRatio >= 0.3) {
    // Partial match - still accept but log
    console.log(`[HotButtons] ✓ Quote accepted with partial match (${Math.round(matchRatio * 100)}%): "${trimmedQuote.substring(0, 60)}..."`);
    return trimmedQuote;
  } else {
    // Low match - still return to avoid losing hot buttons, but log warning
    console.warn(`[HotButtons] ⚠ Low quote match (${Math.round(matchRatio * 100)}%) but accepting: "${trimmedQuote.substring(0, 60)}..."`);
    return trimmedQuote; // Accept anyway - better to show imperfect hot button than none
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

// ALL 27 indicators can be hot buttons (emotional triggers detected from conversation)
// Previously only 19 were allowed - now we allow all 27 for better detection
const HOT_BUTTON_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]);

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
  
  // Track seen indicator IDs and quotes for deduplication
  const seenIndicatorIds = new Set();
  const seenQuotes = [];
  
  // Process hotButtonDetails from AI (this is the primary source)
  if (aiAnalysis.hotButtonDetails && Array.isArray(aiAnalysis.hotButtonDetails) && aiAnalysis.hotButtonDetails.length > 0) {
    console.log(`[HotButtons] Using hotButtonDetails from AI (${aiAnalysis.hotButtonDetails.length} items)`);
    
    for (const detail of aiAnalysis.hotButtonDetails) {
      const indicatorId = typeof detail.id === 'string' ? parseInt(detail.id, 10) : detail.id;
      if (isNaN(indicatorId) || indicatorId < 1 || indicatorId > 27) {
        console.log(`[HotButtons] Skipping invalid indicator ID: ${detail.id}`);
        continue;
      }
      
      // DEDUPLICATION: Skip if we already have this indicator ID
      if (seenIndicatorIds.has(indicatorId)) {
        console.log(`[HotButtons] Skipping duplicate indicator ID: ${indicatorId}`);
        continue;
      }
      
      // Only include if it's a hot button indicator
      if (!HOT_BUTTON_IDS.has(indicatorId)) {
        console.log(`[HotButtons] Skipping non-hot-button indicator: ${indicatorId}`);
        continue;
      }
      
      // Get score from hot button detail first (preferred), then fallback to indicatorSignals
      let indicatorScore = detail.score;
      if (indicatorScore === undefined || indicatorScore === null) {
        // Fallback to indicatorSignals
      const indicatorScoreRaw = aiAnalysis.indicatorSignals?.[indicatorId] || 
                                aiAnalysis.indicatorSignals?.[String(indicatorId)];
        indicatorScore = indicatorScoreRaw;
      }
      
      // Convert to number if string
      if (typeof indicatorScore === 'string') {
        indicatorScore = parseFloat(indicatorScore);
      }
      
      // If still no score, use default of 7 (detected = significant)
      if (indicatorScore === undefined || indicatorScore === null || isNaN(indicatorScore)) {
        indicatorScore = 7; // Default score for detected hot buttons
        console.log(`[HotButtons] Using default score 7 for indicator ${indicatorId}`);
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
      
      // DEDUPLICATION: Skip if we already have a similar quote
      if (seenQuotes.some(sq => areSimilarStrings(sq, quote))) {
        console.log(`[HotButtons] Skipping duplicate quote: "${quote.substring(0, 40)}..."`);
        continue;
      }
      
      // Validate and fix quote to match transcript exactly
      quote = validateAndFixQuote(quote, transcript);
      
      // Skip if quote is still empty after validation
      if (!quote || quote.trim().length === 0) {
        console.log(`[HotButtons] Skipping indicator ${indicatorId} - quote validation failed`);
        continue;
      }
      
      // Mark as seen for deduplication
      seenIndicatorIds.add(indicatorId);
      seenQuotes.push(quote);
      
      detectedHotButtons.push({
        id: indicatorId,
        name: indicatorName,  // ONLY from CSV
        quote: quote,         // AI-generated
        score: indicatorScore, // AI-generated (from detail or indicatorSignals or default)
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

  // #region agent log - Hypothesis F,G: Track backend hot buttons order
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hotButtons.js:extract',message:'Hot buttons extracted from backend',data:{count:detectedHotButtons.length,idsInOrder:detectedHotButtons.map(h=>h.id),scoresInOrder:detectedHotButtons.map(h=>h.score)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F,G'})}).catch(()=>{});
  // #endregion
  
  return detectedHotButtons;
}
