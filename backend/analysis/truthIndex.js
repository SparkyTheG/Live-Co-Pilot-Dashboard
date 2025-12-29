/**
 * Calculates Truth Index based on CSV logic:
 * - Base score starts at 45
 * - Increases based on positive signals (from AI pillar scores)
 * - Decreases based on incoherence penalties
 * NO keyword patterns - AI ONLY
 */

export function calculateTruthIndex(pillarScores, transcript) {
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

  const p1 = pillarScores.pillars.P1?.average || 5;
  const p2 = pillarScores.pillars.P2?.average || 5;
  const p3 = pillarScores.pillars.P3?.average || 5;
  const p4 = pillarScores.pillars.P4?.average || 5;
  const p5 = pillarScores.pillars.P5?.average || 5;
  const p6Raw = pillarScores.indicators?.[21] || 5; // Price Sensitivity raw score

  // Positive signals (increase score) - based on AI pillar scores
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

  // Additional positive signals based on specific indicators
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

  // Incoherence Penalties (from Truth Index CSV) - based on AI pillar scores

  // T1: High Pain + Low Urgency
  if (p1 >= 7 && p2 <= 4) {
    const penalty = -15;
    penalties.push({
      rule: 'T1',
      description: 'High Pain + Low Urgency',
      penalty: penalty,
      details: 'Claims deep pain but no urgency to act'
    });
    score += penalty;
    redFlags.push('Claims deep pain but shows no urgency to act - potential inconsistency');
  }

  // T2: High Desire + Low Decisiveness
  const desireClarity = pillarScores.indicators?.[3] || 5;
  const desirePriority = pillarScores.indicators?.[4] || 5;
  const maxDesire = Math.max(desireClarity, desirePriority);
  if (maxDesire >= 7 && p3 <= 4) {
    const penalty = -15;
    penalties.push({
      rule: 'T2',
      description: 'High Desire + Low Decisiveness',
      penalty: penalty,
      details: 'Wants change but avoids decision'
    });
    score += penalty;
    redFlags.push('Expresses strong desire but avoids making decisions - commitment issue');
  }

  // T3: High Money Access + High Price Sensitivity
  if (p4 >= 7 && p6Raw >= 8) {
    const penalty = -10;
    penalties.push({
      rule: 'T3',
      description: 'High Money Access + High Price Sensitivity',
      penalty: penalty,
      details: 'Can afford it, but still resists price'
    });
    score += penalty;
    redFlags.push('Has money but still negotiating price - value misalignment');
  }

  // T4: Claims Authority + Low Self-Permission (contradiction)
  const decisionAuthority = pillarScores.indicators?.[9] || 5;
  const selfPermission = pillarScores.indicators?.[12] || 5;
  if (decisionAuthority >= 7 && selfPermission <= 4) {
    const penalty = -10;
    penalties.push({
      rule: 'T4',
      description: 'Claims Authority + Low Self-Permission',
      penalty: penalty,
      details: 'Self-contradiction in who owns the decision'
    });
    score += penalty;
    redFlags.push('Claims decision authority but lacks self-permission - authority contradiction');
  }

  // T5: High Desire + Low Responsibility
  if (maxDesire >= 7 && p5 <= 5) {
    const penalty = -15;
    penalties.push({
      rule: 'T5',
      description: 'High Desire + Low Responsibility',
      penalty: penalty,
      details: 'Craves result, but doesn\'t own the change'
    });
    score += penalty;
    redFlags.push('Wants results but doesn\'t take responsibility - ownership issue');
  }

  // T6: High Commitment + Low Locus of Control
  const commitment = pillarScores.indicators?.[11] || 5;
  const locusOfControl = pillarScores.indicators?.[19] || 5;
  if (commitment >= 7 && locusOfControl <= 4) {
    const penalty = -10;
    penalties.push({
      rule: 'T6',
      description: 'High Commitment + Low Locus of Control',
      penalty: penalty,
      details: 'Says ready but blames external factors'
    });
    score += penalty;
    redFlags.push('Claims commitment but blames external factors - control contradiction');
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Store penalties in pillarScores for lubometer calculation
  const totalPenalties = penalties.reduce((sum, p) => sum + Math.abs(p.penalty), 0);
  pillarScores.truthIndexPenalties = totalPenalties;

  return {
    score: Math.round(score),
    signals: signals.length > 0 ? signals : ['No strong truth signals detected yet'],
    redFlags: redFlags.length > 0 ? redFlags : ['No major red flags detected'],
    penalties
  };
}
