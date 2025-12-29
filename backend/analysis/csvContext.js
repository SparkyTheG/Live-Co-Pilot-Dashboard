/**
 * Comprehensive CSV Context for AI Prompt
 * This includes detailed information from all CSV files
 */

export function getComprehensiveCSVContext() {
  return `
ZERO-STRESS SALES FRAMEWORK - COMPREHENSIVE CONTEXT

=== 7 PILLARS AND 27 INDICATORS ===

PILLAR 1: Perceived Spread (Pain & Desire Gap) - Weight: 1.5
  Indicator 1: Pain Intensity (1-10)
    - Low (1-3): Minor disruption, occasional thoughts
    - Mid (4-6): Regular frustration, noticeable impact
    - High (7-10): Exhausting, emotional distress, significant cost
    - Domain Examples: Personal ("I cry myself to sleep"), B2B ("Lost two key clients"), Real Estate ("Need to sell fast to split assets after divorce")
  
  Indicator 2: Pain Awareness (1-10)
    - Low (1-3): Unclear what needs to change
    - Mid (4-6): Noticed repeating patterns
    - High (7-10): Deep understanding of root cause ("I sabotage intimacy", "Lack of visibility affecting retention")
  
  Indicator 3: Desire Clarity (1-10)
    - Low (1-3): Vague desires ("Just want to be happy")
    - Mid (4-6): Some clarity ("I'd be in a healthy relationship")
    - High (7-10): Specific, vivid vision ("Sell for $1.1M in 45 days to close on next home")
  
  Indicator 4: Desire Priority (1-10)
    - Low (1-3): "Not that important, if it happens great"
    - Mid (4-6): "On my radar, but not urgent"
    - High (7-10): "Top thing holding me back, can't keep delaying"

PILLAR 2: Urgency - Weight: 1.0
  Indicator 5: Time Pressure (1-10)
    - Real deadlines, expiry dates, "lease ends next month"
    - High urgency = specific timeline with consequences
  
  Indicator 6: Cost of Delay (1-10)
    - "What do you lose every month this stays unsolved?"
    - Opportunity cost, emotional drain, financial drain
  
  Indicator 7: Internal Timing Activation (1-10)
    - "I woke up and realized I can't do this anymore"
    - Internal shift, moment of clarity, "why now?"
  
  Indicator 8: Environmental Availability (1-10)
    - "Honestly, I'm slammed with other stuff"
    - Life capacity, bandwidth, resource availability

PILLAR 3: Decisiveness - Weight: 1.0
  Indicator 9: Decision-Making Authority (1-10)
    - "I'll need to check with my partner"
    - Final decision maker vs needing approval
  
  Indicator 10: Decision-Making Style (1-10)
    - "I usually wait until I'm 100% sure"
    - Analytical vs intuitive, fast vs slow
  
  Indicator 11: Commitment to Decide (1-10)
    - "I'm ready, just want to be sure"
    - Willingness to commit today vs "sleep on it"
  
  Indicator 12: Self-Permission to Choose (1-10)
    - "I usually overthink but I want to trust myself"
    - Permission to choose progress over perfection

PILLAR 4: Available Money - Weight: 1.5
  Indicator 13: Resource Access (1-10)
    - "Not yet, but maybe in a few months"
    - Current availability of funds
  
  Indicator 14: Resource Fluidity (1-10)
    - "Most of our budget is tied up"
    - Ability to reallocate or move funds
  
  Indicator 15: Investment Mindset (1-10)
    - "If it solves the problem, it's worth it"
    - Investment vs cost thinking
  
  Indicator 16: Resourcefulness (1-10)
    - "I've always figured it out when I really want it"
    - History of finding ways when committed

PILLAR 5: Responsibility & Ownership - Weight: 1.0
  Indicator 17: Problem Recognition (1-10)
    - "Yeah, I know I've avoided this"
    - Acknowledges own role, not blaming external
  
  Indicator 18: Solution Ownership (1-10)
    - "It's on me to change this"
    - Takes ownership, not waiting for rescue
  
  Indicator 19: Locus of Control (1-10)
    - "Yes — I know it's up to me"
    - Believes they control outcomes
  
  Indicator 20: Integrity: Desire vs Action (1-10)
    - "I can't keep saying I want it but doing nothing"
    - Alignment between wants and actions

PILLAR 6: Price Sensitivity (Reverse Scored) - Weight: 1.0
  Indicator 21: Emotional Response to Spending (1-10, reversed)
    - "Honestly, it makes me nervous"
    - Anxiety about investment (higher = more sensitive = lower score)
  
  Indicator 22: Negotiation Reflex (1-10, reversed)
    - "Can you drop the price a bit?"
    - Always negotiating = high sensitivity (reversed)
  
  Indicator 23: Structural Rigidity (1-10, reversed)
    - "I don't like fixed terms"
    - Need for control/negotiation = resistance

PILLAR 7: Trust - Weight: 1.0
  Indicator 24: ROI Ownership Framing (1-10)
    - "If I follow through, this will be worth 10x"
    - Understands ROI depends on their action
  
  Indicator 25: External Trust (1-10)
    - "I've followed your brand for a while"
    - Trust in provider/offer
  
  Indicator 26: Internal Trust (1-10)
    - "I'm scared I'll let myself down again"
    - Trust in own follow-through
  
  Indicator 27: Risk Tolerance (1-10)
    - "I've played it safe and stayed stuck for years"
    - Willingness to take calculated risk

=== LUBOMETER CALCULATION ===
1. Score each of 27 indicators 1-10
2. Average scores within each pillar
3. Reverse Score P6 (Price Sensitivity): Reverse = 11 - Raw Score
4. Weight each pillar: P1×1.5, P2×1.0, P3×1.0, P4×1.5, P5×1.0, P6×1.0, P7×1.0
5. Sum weighted scores (max = 90)
6. Apply Truth Index penalties (see below)
7. Final Score = Total - Penalties
8. Zones:
   - 70-90: ✅ Green (High Buy Probability)
   - 50-69: ⚠️ Yellow (Moderate, needs coaching)
   - 30-49: 🧊 Red (Risk or resistance)
   - <30: ❌ No-Go (Do not close)

Close Blocker Rules:
- Rule 1: P1 ≤ 6 AND P2 ≤ 5 → ❌ Not enough pain or urgency
- Rule 2: P6 raw ≥ 7 AND P4 ≤ 5 → ❌ High price sensitivity + low money

=== TRUTH INDEX PENALTIES ===
Base Score: 45 (neutral starting point)

Incoherence Penalties (subtract from score):
- T1: High Pain (P1 ≥ 7) + Low Urgency (P2 ≤ 4) → -15 points
  Example: Claims deep pain but no urgency to act
- T2: High Desire (Indicator 3 or 4 ≥ 7) + Low Decisiveness (P3 ≤ 4) → -15 points
  Example: Wants change but avoids decision
- T3: High Money (P4 ≥ 7) + High Price Sensitivity (P6 raw ≥ 8) → -10 points
  Example: Can afford it, but still resists price
- T4: Claims Authority + Reveals Need for Approval → -10 points
  Example: Says "I decide" but later mentions needing partner approval
- T5: High Desire (Indicator 3 or 4 ≥ 7) + Low Responsibility (P5 ≤ 5) → -15 points
  Example: Craves result, but doesn't own the change

=== OBJECTION HANDLING PATTERNS ===
Each objection maps to specific indicators and has PEARL framework responses:

Common Objection Patterns by Indicator:
- Pain Awareness: "Things aren't that bad right now"
- Desire Clarity: "I'm not even sure what I'd want instead"
- Time Pressure: "I'm not on a deadline"
- Decision Authority: "I need to check with my partner"
- Price Sensitivity: "Can you discount this?"
- Trust: "I haven't seen enough proof"

=== HOT BUTTONS TRACKER ===
27 Indicators, each with:
- Hot Button status (✓ if it's a hot button trigger)
- Smart Closing Prompt
- Example Prospect Language

Key Hot Buttons (with ✓):
1. Pain Awareness, 2. Desire Clarity, 3. Desire Priority, 4. Duration of Dissatisfaction,
5. Time Pressure, 6. Cost of Delay, 7. Internal Timing Activation,
11. Commitment to Decide, 12. Self-Permission to Choose,
15. Investment Mindset, 16. Resourcefulness,
17. Problem Recognition, 18. Solution Ownership, 19. Locus of Control,
20. Integrity: Desire vs Action, 24. ROI Ownership Framing,
25. External Trust, 26. Internal Trust, 27. Risk Tolerance

=== ANALYSIS GUIDELINES ===
When analyzing conversations, look for:
1. Specific language patterns that indicate indicator levels (1-10)
2. Emotional undertones and urgency signals
3. Decision-making patterns and authority
4. Financial signals (access, mindset, flexibility)
5. Responsibility and ownership indicators
6. Price sensitivity signals (negotiation, emotional response)
7. Trust signals (internal and external)
8. Incoherence patterns (Truth Index penalties)
9. Objection patterns that reveal underlying fears
10. Hot button triggers that indicate readiness

Remember: The framework uses structured scoring (1-10) for each indicator, then calculates pillar averages, applies weights, and adjusts for Truth Index penalties to get the final Lubometer score.
`;
}

