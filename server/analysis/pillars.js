/**
 * Analyzes the 7 Pillars and 27 Indicators based on AI analysis
 * NO keyword fallbacks - AI ONLY
 */

const PILLAR_WEIGHTS = {
  P1: 1.5, // Perceived Spread (Pain & Desire Gap)
  P2: 1.0, // Urgency
  P3: 1.0, // Decisiveness
  P4: 1.5, // Available Money
  P5: 1.0, // Responsibility & Ownership
  P6: 1.0, // Price Sensitivity (Reverse Scored)
  P7: 1.0  // Trust
};

const INDICATOR_TO_PILLAR = {
  1: 'P1', 2: 'P1', 3: 'P1', 4: 'P1', // P1: Perceived Spread
  5: 'P2', 6: 'P2', 7: 'P2', 8: 'P2', // P2: Urgency
  9: 'P3', 10: 'P3', 11: 'P3', 12: 'P3', // P3: Decisiveness
  13: 'P4', 14: 'P4', 15: 'P4', 16: 'P4', // P4: Available Money
  17: 'P5', 18: 'P5', 19: 'P5', 20: 'P5', // P5: Responsibility & Ownership
  21: 'P6', 22: 'P6', 23: 'P6', // P6: Price Sensitivity
  24: 'P7', 25: 'P7', 26: 'P7', 27: 'P7' // P7: Trust
};

const INDICATOR_NAMES = {
  1: 'Pain Intensity',
  2: 'Pain Awareness',
  3: 'Desire Clarity',
  4: 'Desire Priority',
  5: 'Time Pressure',
  6: 'Cost of Delay',
  7: 'Internal Timing',
  8: 'Environmental Availability',
  9: 'Decision Authority',
  10: 'Decision Style',
  11: 'Commitment to Decide',
  12: 'Self-Permission',
  13: 'Resource Access',
  14: 'Resource Fluidity',
  15: 'Investment Mindset',
  16: 'Resourcefulness',
  17: 'Problem Recognition',
  18: 'Solution Ownership',
  19: 'Locus of Control',
  20: 'Desire vs Action Integrity',
  21: 'Emotional Response to Spending',
  22: 'Negotiation Reflex',
  23: 'Structural Rigidity',
  24: 'ROI Ownership',
  25: 'External Trust',
  26: 'Internal Trust',
  27: 'Risk Tolerance'
};

/**
 * Analyzes the 7 Pillars and 27 Indicators
 * AI ONLY - no keyword fallbacks
 */
export async function analyzePillars(transcript, prospectType, aiAnalysis = null) {
  const indicators = {};

  // Get AI indicator signals - REQUIRED
  const aiIndicatorSignals = aiAnalysis?.indicatorSignals || {};

  console.log(`[Pillars] AI provided ${Object.keys(aiIndicatorSignals).length} indicator scores`);

  // Process all 27 indicators - AI scores ONLY
  for (let i = 1; i <= 27; i++) {
    const aiScore = aiIndicatorSignals[i] || aiIndicatorSignals[String(i)];

    if (aiScore !== undefined && aiScore !== null) {
      const score = typeof aiScore === 'string' ? parseFloat(aiScore) : aiScore;
      if (!isNaN(score) && score >= 1 && score <= 10) {
        indicators[i] = score;
        console.log(`[Pillars] Indicator ${i} (${INDICATOR_NAMES[i]}): ${score} (from AI)`);
      } else {
        // Invalid AI score - skip this indicator (don't use neutral 5)
        console.log(`[Pillars] Indicator ${i} (${INDICATOR_NAMES[i]}): skipped (invalid AI score: ${aiScore})`);
      }
    } else {
      // No AI score - skip this indicator (don't use neutral 5 to avoid diluting averages)
      console.log(`[Pillars] Indicator ${i} (${INDICATOR_NAMES[i]}): skipped (no AI score)`);
    }
  }

  // Calculate pillar scores
  const pillars = {
    P1: { indicators: [1, 2, 3, 4], scores: [], average: 0, weight: PILLAR_WEIGHTS.P1 },
    P2: { indicators: [5, 6, 7, 8], scores: [], average: 0, weight: PILLAR_WEIGHTS.P2 },
    P3: { indicators: [9, 10, 11, 12], scores: [], average: 0, weight: PILLAR_WEIGHTS.P3 },
    P4: { indicators: [13, 14, 15, 16], scores: [], average: 0, weight: PILLAR_WEIGHTS.P4 },
    P5: { indicators: [17, 18, 19, 20], scores: [], average: 0, weight: PILLAR_WEIGHTS.P5 },
    P6: { indicators: [21, 22, 23], scores: [], average: 0, weight: PILLAR_WEIGHTS.P6 },
    P7: { indicators: [24, 25, 26, 27], scores: [], average: 0, weight: PILLAR_WEIGHTS.P7 }
  };

  // Populate pillar scores - only include indicators that have AI scores
  for (const [pillarKey, pillar] of Object.entries(pillars)) {
    for (const indicatorId of pillar.indicators) {
      // Only include indicators that have AI scores (not skipped)
      if (indicators[indicatorId] !== undefined) {
        pillar.scores.push(indicators[indicatorId]);
      }
    }
    // Calculate average only from indicators that were scored
    if (pillar.scores.length > 0) {
      pillar.average = pillar.scores.reduce((a, b) => a + b, 0) / pillar.scores.length;
    } else {
      // No indicators scored for this pillar - use neutral 5
      pillar.average = 5;
      console.log(`[Pillars] WARNING: No AI scores for ${pillarKey}, using default 5`);
    }
  }

  // Log pillar averages
  console.log(`[Pillars] Pillar Averages:`);
  for (const [key, pillar] of Object.entries(pillars)) {
    console.log(`  ${key}: ${pillar.average.toFixed(2)} (weight: ${pillar.weight}x)`);
  }

  return {
    indicators,
    pillars,
    truthIndexPenalties: 0 // Calculated separately in truthIndex.js
  };
}

export { PILLAR_WEIGHTS, INDICATOR_TO_PILLAR };
