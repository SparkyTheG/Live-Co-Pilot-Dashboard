/**
 * Detects objections from conversation using ONLY AI analysis
 * All keyword/pattern matching removed - AI only
 */

/**
 * Check if two objection texts are similar (for deduplication)
 * Returns true if strings share >50% of their words
 */
function areSimilarObjections(text1, text2) {
  if (!text1 || !text2) return false;
  
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words1 = normalize(text1).split(/\s+/).filter(w => w.length > 2);
  const words2 = normalize(text2).split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Count overlapping words
  const overlap = [...set1].filter(w => set2.has(w)).length;
  const minSize = Math.min(set1.size, set2.size);
  
  // If >50% words overlap, consider them similar
  return minSize > 0 && (overlap / minSize) > 0.5;
}

export function detectObjections(transcript, prospectType, aiAnalysis = null) {
  const detected = [];
  const seenObjections = []; // Track for deduplication
  
  // ONLY use AI analysis - no pattern matching, no keyword matching
  if (!aiAnalysis || aiAnalysis.error) {
    console.log(`[Objections] No AI analysis available, returning empty array`);
    return [];
  }
  
  console.log(`[Objections] Processing AI analysis:`, {
    hasObjectionsArray: !!aiAnalysis.objections,
    objectionsCount: aiAnalysis.objections?.length,
    aiAnalysisKeys: Object.keys(aiAnalysis)
  });
  
  // Check if AI detected objections in its analysis
  if (aiAnalysis.objections && Array.isArray(aiAnalysis.objections)) {
    console.log(`[Objections] Using objections array from AI (${aiAnalysis.objections.length} items)`);
    
    for (const aiObj of aiAnalysis.objections) {
      const objectionText = aiObj.objectionText || aiObj.objection || '';
      
      // Skip empty objections
      if (!objectionText || objectionText.trim().length === 0) {
        console.log(`[Objections] Skipping empty objection`);
        continue;
      }
      
      // DEDUPLICATION: Skip if we already have a similar objection
      if (seenObjections.some(seen => areSimilarObjections(seen, objectionText))) {
        console.log(`[Objections] Skipping duplicate objection: "${objectionText.substring(0, 40)}..."`);
        continue;
      }
      
      // Track for deduplication
      seenObjections.push(objectionText);
      
      const objectionData = {
        objectionText: objectionText,
        fear: aiObj.fear || 'Unknown fear',
        whisper: aiObj.whisper || aiObj.response || 'Address concern',
        probability: aiObj.probability || 0.7,
        rebuttalScript: aiObj.rebuttalScript || aiObj.whisper || 'Address this concern directly'
      };
      detected.push(objectionData);
      console.log(`[Objections] Added objection: "${objectionData.objectionText}" (probability: ${objectionData.probability})`);
    }
  } else {
    console.log(`[Objections] No objections array found in AI analysis`);
  }

  // Sort by probability (highest first) and limit to top 5
  const sorted = detected
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
  
  console.log(`[Objections] Final result: ${sorted.length} objections (after deduplication)`);
  
  return sorted;
}

// Rebuttal generation removed - AI provides rebuttalScript in objections

