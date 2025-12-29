/**
 * Detects objections from conversation using ONLY AI analysis
 * All keyword/pattern matching removed - AI only
 */

export function detectObjections(transcript, prospectType, aiAnalysis = null) {
  const detected = [];
  
  // ONLY use AI analysis - no pattern matching, no keyword matching
  if (!aiAnalysis || aiAnalysis.error) {
    console.log(`[Objections] No AI analysis available, returning empty array`);
    return [];
  }
  
  console.log(`[Objections] Processing AI analysis:`, {
    hasObjectionsArray: !!aiAnalysis.objections,
    objectionsArray: aiAnalysis.objections,
    aiAnalysisKeys: Object.keys(aiAnalysis)
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'objections.js:16',message:'detectObjections entry',data:{hasAiAnalysis:!!aiAnalysis,aiAnalysisKeys:aiAnalysis?Object.keys(aiAnalysis):null,objectionsArray:aiAnalysis?.objections},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Check if AI detected objections in its analysis
  if (aiAnalysis.objections && Array.isArray(aiAnalysis.objections)) {
    console.log(`[Objections] Using objections array from AI (${aiAnalysis.objections.length} items)`);
    // AI returned explicit objections
    for (const aiObj of aiAnalysis.objections) {
      const objectionData = {
        objectionText: aiObj.objectionText || aiObj.objection || 'Objection detected',
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
  
  console.log(`[Objections] Final result: ${sorted.length} objections detected`);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'objections.js:36',message:'detectObjections exit',data:{sortedLength:sorted.length,sorted:sorted},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  return sorted;
}

// Rebuttal generation removed - AI provides rebuttalScript in objections

