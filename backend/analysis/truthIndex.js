/**
 * Calculates Truth Index based on CSV logic:
 * 
 * HYBRID APPROACH:
 * - Uses PILLAR SCORES for T1, T2, T3, T5 (numerical thresholds)
 * - Uses AI DETECTION for T4 (Claims Authority + Reveals Need for Approval)
 *   because T4 requires detecting a conversation pattern, not just indicator scores
 * 
 * Rules from CSV:
 * T1: High Pain (P1 ≥ 7) + Low Urgency (P2 ≤ 4) → -15 pts
 * T2: High Desire (≥ 7) + Low Decisiveness (P3 ≤ 4) → -15 pts
 * T3: High Money (P4 ≥ 7) + High Price Sensitivity (P6 raw ≥ 8) → -10 pts
 * T4: Claims Authority + Reveals Need for Approval → -10 pts (AI DETECTED)
 * T5: High Desire (≥ 7) + Low Responsibility (P5 ≤ 5) → -15 pts
 */

export function calculateTruthIndex(pillarScores, transcript, aiTruthIndexResult = null) {
  let score = 45; // Base score
  const signals = [];
  const redFlags = [];
  const penalties = [];

  if (!pillarScores || !pillarScores.pillars) {
    return {
      score: 45,
      signals: [],
      redFlags: [],
      penalties: []
    };
  }

  // Get pillar averages
  const p1 = pillarScores.pillars.P1?.average || 5;
  const p2 = pillarScores.pillars.P2?.average || 5;
  const p3 = pillarScores.pillars.P3?.average || 5;
  const p4 = pillarScores.pillars.P4?.average || 5;
  const p5 = pillarScores.pillars.P5?.average || 5;
  const p6Raw = pillarScores.indicators?.[21] || 5; // Price Sensitivity raw score

  // Get specific indicators for detailed rules
  const desireClarity = pillarScores.indicators?.[3] || 5;
  const desirePriority = pillarScores.indicators?.[4] || 5;
  const maxDesire = Math.max(desireClarity, desirePriority);

  // ========================================
  // POSITIVE SIGNALS (increase score)
  // ========================================
  if (p1 >= 7) {
    signals.push('High pain awareness - prospect recognizes their situation');
    score += 5;
  }
  if (p2 >= 7) {
    signals.push('High urgency - time pressure is real');
    score += 5;
  }
  if (p3 >= 7) {
    signals.push('High decisiveness - ready to make decisions');
    score += 5;
  }
  if (p4 >= 7) {
    signals.push('Available resources - financial capacity present');
    score += 5;
  }
  if (p5 >= 7) {
    signals.push('Takes ownership - responsible for outcomes');
    score += 5;
  }

  // Trust indicators
  const indicator25 = pillarScores.indicators?.[25] || 5; // External Trust
  const indicator26 = pillarScores.indicators?.[26] || 5; // Internal Trust
  
  if (indicator25 >= 7) {
    signals.push('High external trust - trusts the offer');
    score += 3;
  }
  if (indicator26 >= 7) {
    signals.push('High internal trust - trusts themselves');
    score += 3;
  }

  // ========================================
  // INCOHERENCE PENALTIES (from Truth Index CSV)
  // ========================================

  // Track which rules have been applied to avoid duplicates
  const appliedRules = new Set();

  // T1: High Pain + Low Urgency (PILLAR-BASED)
  if (p1 >= 7 && p2 <= 4) {
    penalties.push({
      rule: 'T1',
      description: 'High Pain + Low Urgency',
      penalty: -15,
      details: 'Claims deep pain but no urgency to act',
      source: 'pillar-scores'
    });
    score -= 15;
    redFlags.push('T1: Claims deep pain but shows no urgency to act');
    appliedRules.add('T1');
  }

  // T2: High Desire + Low Decisiveness (PILLAR-BASED)
  if (maxDesire >= 7 && p3 <= 4) {
    penalties.push({
      rule: 'T2',
      description: 'High Desire + Low Decisiveness',
      penalty: -15,
      details: 'Wants change but avoids decision',
      source: 'pillar-scores'
    });
    score -= 15;
    redFlags.push('T2: Expresses strong desire but avoids making decisions');
    appliedRules.add('T2');
  }

  // T3: High Money Access + High Price Sensitivity (PILLAR-BASED)
  if (p4 >= 7 && p6Raw >= 8) {
    penalties.push({
      rule: 'T3',
      description: 'High Money Access + High Price Sensitivity',
      penalty: -10,
      details: 'Can afford it, but still resists price',
      source: 'pillar-scores'
    });
    score -= 10;
    redFlags.push('T3: Has money but still negotiating price hard');
    appliedRules.add('T3');
  }

  // T5: High Desire + Low Responsibility (PILLAR-BASED)
  if (maxDesire >= 7 && p5 <= 5) {
    penalties.push({
      rule: 'T5',
      description: 'High Desire + Low Responsibility',
      penalty: -15,
      details: 'Craves result, but doesn\'t own the change',
      source: 'pillar-scores'
    });
    score -= 15;
    redFlags.push('T5: Wants results but doesn\'t take responsibility');
    appliedRules.add('T5');
  }

  // ========================================
  // AI-DETECTED RULES (especially T4)
  // ========================================
  if (aiTruthIndexResult && aiTruthIndexResult.detectedRules) {
    for (const detection of aiTruthIndexResult.detectedRules) {
      const ruleId = detection.ruleId;
      
      // Skip if already applied via pillar scores (avoid double penalty)
      if (appliedRules.has(ruleId)) {
        continue;
  }

      // Apply AI-detected rules
      let penaltyAmount = 0;
      let description = '';
      
      switch (ruleId) {
        case 'T1':
          penaltyAmount = -15;
          description = 'High Pain + Low Urgency';
          break;
        case 'T2':
          penaltyAmount = -15;
          description = 'High Desire + Low Decisiveness';
          break;
        case 'T3':
          penaltyAmount = -10;
          description = 'High Money + High Price Sensitivity';
          break;
        case 'T4':
          // T4 is ONLY detected by AI (can't detect from pillar scores)
          penaltyAmount = -10;
          description = 'Claims Authority + Reveals Need for Approval';
          break;
        case 'T5':
          penaltyAmount = -15;
          description = 'High Desire + Low Responsibility';
          break;
      }

      if (penaltyAmount !== 0 && detection.confidence >= 0.7) {
        penalties.push({
          rule: ruleId,
          description: description,
          penalty: penaltyAmount,
          details: detection.evidence || 'Detected from conversation',
          source: 'ai-detected',
          confidence: detection.confidence
        });
        score += penaltyAmount; // penaltyAmount is negative
        redFlags.push(`${ruleId}: ${description} - "${detection.evidence || 'AI detected'}"`);
        appliedRules.add(ruleId);
      }
    }

    // Add AI coherence signals
    if (aiTruthIndexResult.coherenceSignals) {
      signals.push(...aiTruthIndexResult.coherenceSignals);
    }
  }

  // ========================================
  // ADDITIONAL CHECK: T4 from pillar indicators (backup)
  // If AI didn't detect T4, check indicators as fallback
  // ========================================
  if (!appliedRules.has('T4')) {
    const decisionAuthority = pillarScores.indicators?.[9] || 5;
    const selfPermission = pillarScores.indicators?.[12] || 5;
    
    // If they claim high authority but have low self-permission, might indicate T4
    if (decisionAuthority >= 8 && selfPermission <= 3) {
    penalties.push({
        rule: 'T4',
        description: 'Claims Authority + Low Self-Permission',
        penalty: -10,
        details: 'Possible contradiction in decision ownership',
        source: 'pillar-fallback'
    });
      score -= 10;
      redFlags.push('T4: Claims decision authority but shows signs of needing approval');
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Store penalties in pillarScores for lubometer calculation
  const totalPenalties = penalties.reduce((sum, p) => sum + Math.abs(p.penalty), 0);
  pillarScores.truthIndexPenalties = totalPenalties;

  return {
    score: Math.round(score),
    signals: signals.length > 0 ? signals : ['No strong truth signals detected yet'],
    redFlags: redFlags.length > 0 ? redFlags : [],
    penalties
  };
}
