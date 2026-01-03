/**
 * Calculates Lubometer score based on CSV formula:
 * 1. Raw Score (Per Indicator): 1–10 for each of the 27 indicators
 * 2. Average Per Pillar: Average the indicator scores within each pillar
 * 3. Reverse Score: Price Sensitivity (P6) = 11 - Raw Score
 * 4. Weighted Pillar Score: Multiply each pillar by its weight
 * 5. Total Score Before Penalties: Sum of all 7 weighted pillar scores (max = 90)
 * 6. Truth Index Penalties: Subtract penalty points for incoherence
 * 7. Final Lubometer Score: Total Score – Penalties
 */

// Default weights - matching frontend Admin Panel defaults for consistency
// Note: Total weights = 9.0, so max score = 90 when all pillars score 10
const DEFAULT_PILLAR_WEIGHTS = {
  P1: 1.5, // Perceived Spread (Pain & Desire)
  P2: 1.0, // Urgency
  P3: 1.0, // Decisiveness
  P4: 1.5, // Available Money
  P5: 1.0, // Responsibility & Ownership
  P6: 1.5, // Price Sensitivity (Reverse Scored)
  P7: 1.5  // Trust
};

/**
 * Calculate Lubometer score
 * @param {Object} pillarScores - Pillar scores from AI analysis
 * @param {Array|null} customWeights - Custom pillar weights from Admin Panel [{id: 'P1', weight: 1.5}, ...]
 */
export function calculateLubometer(pillarScores, customWeights = null) {
  // Convert custom weights array to object, or use defaults
  let PILLAR_WEIGHTS = { ...DEFAULT_PILLAR_WEIGHTS };
  
  if (customWeights && Array.isArray(customWeights) && customWeights.length > 0) {
    console.log(`[Lubometer] Using custom weights from Admin Panel:`, customWeights);
    customWeights.forEach(cw => {
      if (cw.id && typeof cw.weight === 'number') {
        PILLAR_WEIGHTS[cw.id] = cw.weight;
      }
    });
  } else {
    console.log(`[Lubometer] Using default weights:`, DEFAULT_PILLAR_WEIGHTS);
  }
  if (!pillarScores || !pillarScores.pillars) {
    return {
      score: 0,
      level: 'low',
      interpretation: 'Insufficient data for analysis',
      action: 'Continue conversation to gather more information'
    };
  }

  // Step 1-2: Already done in pillars.js (averages calculated)
  
  // Step 3: Reverse score P6 (Price Sensitivity)
  const p6Raw = pillarScores.pillars.P6?.average || 5;
  const p6Reversed = 11 - p6Raw;
  
  // Step 4: Calculate weighted pillar scores
  const weightedScores = {
    P1: (pillarScores.pillars.P1?.average || 5) * PILLAR_WEIGHTS.P1,
    P2: (pillarScores.pillars.P2?.average || 5) * PILLAR_WEIGHTS.P2,
    P3: (pillarScores.pillars.P3?.average || 5) * PILLAR_WEIGHTS.P3,
    P4: (pillarScores.pillars.P4?.average || 5) * PILLAR_WEIGHTS.P4,
    P5: (pillarScores.pillars.P5?.average || 5) * PILLAR_WEIGHTS.P5,
    P6: p6Reversed * PILLAR_WEIGHTS.P6, // Use reversed score
    P7: (pillarScores.pillars.P7?.average || 5) * PILLAR_WEIGHTS.P7
  };

  // Log pillar details for debugging
  console.log(`[Lubometer] Pillar averages:`, {
    P1: pillarScores.pillars.P1?.average?.toFixed(2),
    P2: pillarScores.pillars.P2?.average?.toFixed(2),
    P3: pillarScores.pillars.P3?.average?.toFixed(2),
    P4: pillarScores.pillars.P4?.average?.toFixed(2),
    P5: pillarScores.pillars.P5?.average?.toFixed(2),
    P6_raw: p6Raw.toFixed(2),
    P6_reversed: p6Reversed.toFixed(2),
    P7: pillarScores.pillars.P7?.average?.toFixed(2)
  });
  console.log(`[Lubometer] Weighted scores:`, {
    P1: weightedScores.P1.toFixed(2),
    P2: weightedScores.P2.toFixed(2),
    P3: weightedScores.P3.toFixed(2),
    P4: weightedScores.P4.toFixed(2),
    P5: weightedScores.P5.toFixed(2),
    P6: weightedScores.P6.toFixed(2),
    P7: weightedScores.P7.toFixed(2)
  });

  // Step 5: Total score before penalties
  // Max score depends on the sum of weights (e.g., default weights sum to 9.0, so max = 90)
  const totalBeforePenalties = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
  const maxScore = Object.values(PILLAR_WEIGHTS).reduce((sum, w) => sum + w, 0) * 10;
  console.log(`[Lubometer] Total before penalties: ${totalBeforePenalties.toFixed(2)} (max: ${maxScore})`);

  // Step 6: Apply Truth Index penalties (calculated separately, passed in)
  // Penalties are applied in truthIndex.js and subtracted here
  const penalties = pillarScores.truthIndexPenalties || 0;
  console.log(`[Lubometer] Truth Index penalties: ${penalties}`);
  
  // Step 7: Final Lubometer Score
  const finalScore = Math.max(0, Math.min(maxScore, totalBeforePenalties - penalties));
  console.log(`[Lubometer] Final score: ${finalScore.toFixed(2)} (${totalBeforePenalties.toFixed(2)} - ${penalties})`);

  // #region agent log - Hypothesis D: Track lubometer calculation
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lubometer.js:calculate',message:'Lubometer calculated',data:{finalScore:Math.round(finalScore),maxScore,totalBeforePenalties:Math.round(totalBeforePenalties),penalties,pillarScoresNull:!pillarScores||!pillarScores.pillars},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Step 8: Determine Readiness Zone
  let level, interpretation, action;
  
  if (finalScore >= 70) {
    level = 'high';
    interpretation = 'High buy probability - prospect is ready and coherent';
    action = 'Push to close';
  } else if (finalScore >= 50) {
    level = 'medium';
    interpretation = 'Moderate readiness - needs coaching and clarification';
    action = 'Address remaining concerns, trial close, build urgency';
  } else if (finalScore >= 30) {
    level = 'low';
    interpretation = 'Low coherence or hidden risks - slow down';
    action = 'Isolate objections, give homework materials to explore, set another meeting';
  } else {
    level = 'no-go';
    interpretation = 'System breakdown or major contradictions - do not close';
    action = 'Do not close - repair trust and consistency first';
  }

  // Apply Close Blocker Rules
  const p1Score = pillarScores.pillars.P1?.average || 5;
  const p2Score = pillarScores.pillars.P2?.average || 5;
  const p4Score = pillarScores.pillars.P4?.average || 5;
  const p6RawScore = p6Raw;

  // Close Blocker Rule 1: P1 ≤ 6 AND P2 ≤ 5 → Not enough pain or urgency
  if (p1Score <= 6 && p2Score <= 5) {
    level = 'no-go';
    interpretation = 'Not enough pain or urgency to proceed';
    action = 'Do not close - build pain and urgency first';
  }

  // Close Blocker Rule 2: P6 raw ≥ 7 AND P4 ≤ 5 → High price sensitivity + low money
  if (p6RawScore >= 7 && p4Score <= 5) {
    level = 'no-go';
    interpretation = 'High price sensitivity with low money access - cannot justify investment';
    action = 'Do not close - address financial constraints first';
  }

  return {
    score: Math.round(finalScore),
    maxScore: Math.round(maxScore),
    level,
    interpretation,
    action,
    weightedScores,
    pillarScores: {
      P1: pillarScores.pillars.P1?.average || 5,
      P2: pillarScores.pillars.P2?.average || 5,
      P3: pillarScores.pillars.P3?.average || 5,
      P4: pillarScores.pillars.P4?.average || 5,
      P5: pillarScores.pillars.P5?.average || 5,
      P6: p6Raw,
      P6_reversed: p6Reversed,
      P7: pillarScores.pillars.P7?.average || 5
    },
    weightsUsed: PILLAR_WEIGHTS,
    totalBeforePenalties: Math.round(totalBeforePenalties),
    penalties
  };
}

