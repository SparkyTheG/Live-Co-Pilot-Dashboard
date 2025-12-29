export type ProspectType =
  | 'owner-occupied'
  | 'tired-landlord'
  | 'distressed-landlord'
  | 'foreclosure'
  | 'probate-inherited'
  | 'subject-to'
  | 'creative-savvy';

export interface DiscoveryPhase {
  title: string;
  goal: string;
  questions: string[];
  qualificationSignals: string[];
  warningSigns: string[];
}

export interface PressurePattern {
  time: string[];
  financial: string[];
  emotional: string[];
  authority: string[];
}

export interface PropertyLoanReality {
  occupancy: string[];
  condition: string[];
  loanPresence: string[];
  paymentStatus: string[];
  viability: string[];
}

export interface PainMotivation {
  corePain: string[];
  deepeningQuestions: string[];
  emotionalSignals: string[];
  guidance: string;
}

export interface FailedSolution {
  attempted: string[];
  whyFailed: string[];
  remainingHope: string;
}

export interface DesiredOutcome {
  successMeans: string[];
  tradeOffs: string[];
  wantOffPlate: string[];
}

export interface OpennessToCreative {
  bridgeQuestions: string[];
  lowOpennessGuidance: string;
}

export interface Objection {
  common: string;
  protecting: string;
  risk: string;
  controlQuestion: string;
}

export interface ComplianceSignal {
  signal: string;
  meaning: string;
}

export interface RedFlag {
  flag: string;
  impact: string;
}

export interface DecisionStyle {
  name: string;
  needs: string[];
  avoids: string[];
}

export interface FalseBelief {
  belief: string;
  innerDialogue: string;
}

export interface DealStructure {
  name: string;
  bestFit: string;
  primaryLever: string;
  whenNotToUse: string;
}

export interface DealComparison {
  structure: string;
  speed: string;
  bankApproval: string;
  creditImpact: string;
  sellerPayments: string;
  flexibility: string;
  bestUseCase: string;
}

export interface IncentiveProtection {
  category: string;
  items: string[];
}

export interface Transformation {
  from: string[];
  to: string[];
}

export interface ProspectTypeData {
  coreQuestions: {
    whyNow: string;
    pressure: string;
    outcome: string;
    failedSolutions: string;
    openness: string;
  };
  discoveryPhases: DiscoveryPhase[];
  pressurePatterns: PressurePattern;
  propertyLoanReality: PropertyLoanReality;
  painMotivation: PainMotivation;
  failedSolutions: FailedSolution;
  desiredOutcome: DesiredOutcome;
  opennessToCreative: OpennessToCreative;
  likelyObjections: Objection[];
  complianceSignals: ComplianceSignal[];
  redFlags: RedFlag[];
  decisionStyles: DecisionStyle[];
  falseBeliefsAndStories: FalseBelief[];
  dealStructures: DealStructure[];
  transformation: Transformation;
}

export const prospectTypeLabels: Record<ProspectType, string> = {
  'owner-occupied': 'Owner-Occupied Prospect',
  'tired-landlord': 'Tired Landlord Prospect',
  'distressed-landlord': 'Distressed Landlord Prospect',
  'foreclosure': 'Foreclosure Prospect',
  'probate-inherited': 'Probate / Inherited Prospect',
  'subject-to': 'Subject-To Prospect',
  'creative-savvy': 'Creative-Finance-Savvy Prospect',
};

export const dealComparisons: DealComparison[] = [
  {
    structure: 'Cash',
    speed: 'Fast (7-14 days)',
    bankApproval: 'Not required',
    creditImpact: 'None',
    sellerPayments: 'None - lump sum',
    flexibility: 'Low',
    bestUseCase: 'Urgent exit, equity position',
  },
  {
    structure: 'Subject-To',
    speed: 'Fast (14-21 days)',
    bankApproval: 'Not required',
    creditImpact: 'Loan stays on credit',
    sellerPayments: 'We make mortgage',
    flexibility: 'High',
    bestUseCase: 'Relief + equity preservation',
  },
  {
    structure: 'Seller Finance',
    speed: 'Moderate (21-30 days)',
    bankApproval: 'Not required',
    creditImpact: 'Loan paid off',
    sellerPayments: 'Monthly installments',
    flexibility: 'Very High',
    bestUseCase: 'Income stream desired',
  },
  {
    structure: 'Hybrid',
    speed: 'Moderate (21-45 days)',
    bankApproval: 'Sometimes',
    creditImpact: 'Varies by structure',
    sellerPayments: 'Mixed',
    flexibility: 'Maximum',
    bestUseCase: 'Complex situations',
  },
];

export const incentivesProtections: IncentiveProtection[] = [
  {
    category: 'Servicing & Monitoring',
    items: [
      'Professional loan servicing',
      'Payment tracking dashboard',
      'Automated payment processing',
      'Monthly statements',
    ],
  },
  {
    category: 'Insurance & Protection',
    items: [
      'Property insurance maintained',
      'Title insurance protection',
      'Liability coverage',
      'Default protection clauses',
    ],
  },
  {
    category: 'Written Protections',
    items: [
      'Attorney-drafted agreements',
      'Recorded documents',
      'Performance guarantees',
      'Default remedies defined',
    ],
  },
  {
    category: 'Seller Incentives',
    items: [
      'Immediate relief from payments',
      'Credit protection options',
      'Equity preservation strategies',
      'Tax advantage consultation',
    ],
  },
];

export const commonCloserMistakes = [
  {
    mistake: 'Explaining too early',
    why: 'Presenting structure before understanding pain removes leverage and creates confusion',
    instead: 'Complete discovery fully - earn the right to present solutions',
  },
  {
    mistake: 'Leading with strategy',
    why: 'Prospects care about relief, not mechanisms. Strategy-first creates skepticism',
    instead: 'Lead with outcome transformation, explain structure only when asked',
  },
  {
    mistake: 'Selling terms instead of relief',
    why: 'Terms are abstract. Relief is visceral. Wrong focus = low conversion',
    instead: 'Anchor to their pain point and desired outcome, terms are delivery vehicle',
  },
  {
    mistake: 'Presenting Subject-To prematurely',
    why: 'Without proper framing, Subject-To sounds risky or too good to be true',
    instead: 'Build trust, demonstrate understanding, frame as proven solution',
  },
];

export const prospectData: Record<ProspectType, ProspectTypeData> = {
  'owner-occupied': {
    coreQuestions: {
      whyNow: 'Life change (divorce, job loss, relocation), can no longer afford or maintain',
      pressure: 'Payment stress, maintenance burden, emotional attachment to failed dream',
      outcome: 'Clean exit, preserve credit, avoid foreclosure stigma',
      failedSolutions: 'Tried listing, no qualified buyers, price too high for condition',
      openness: 'Medium - scared of creative options, needs education and reassurance',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Establish timeline, decision authority, and why they\'re talking now',
        questions: [
          'How long have you lived in the property?',
          'What\'s changed that has you considering selling now?',
          'Who else is involved in this decision?',
          'What\'s your ideal timeline?',
          'Have you spoken with anyone else about options?',
        ],
        qualificationSignals: [
          'Clear trigger event mentioned',
          'Sense of urgency without panic',
          'Decision authority present',
          'Realistic timeline expectations',
        ],
        warningSigns: [
          'Vague reasons for selling',
          'Unrealistic price expectations',
          'Multiple decision makers not present',
          'No clear timeline or urgency',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand property condition, loan structure, equity position, payment status',
        questions: [
          'Tell me about the current mortgage - what\'s the balance?',
          'What\'s your monthly payment including taxes and insurance?',
          'Are you current on payments? If behind, how many months?',
          'What condition is the property in? Any deferred maintenance?',
          'What do you think it\'s worth in current condition?',
        ],
        qualificationSignals: [
          'Knows loan balance and payment',
          'Honest about payment status',
          'Realistic about property condition',
          'Open about equity position',
        ],
        warningSigns: [
          'Doesn\'t know basic loan info',
          'Hiding payment status',
          'Wildly inflated value opinion',
          'Unwilling to discuss condition issues',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Uncover emotional and financial pain driving the decision',
        questions: [
          'What happens if you can\'t sell in your timeline?',
          'What\'s the hardest part about your current situation?',
          'How is this affecting you and your family?',
          'What keeps you up at night about this property?',
          'On a scale of 1-10, how motivated are you to solve this?',
        ],
        qualificationSignals: [
          'Articulates clear pain points',
          'Emotional involvement visible',
          'Consequences understood',
          'High motivation score (7+)',
        ],
        warningSigns: [
          'Casual or detached demeanor',
          'No clear pain articulated',
          'Low motivation score',
          'Testing market, not serious',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'Discover what they\'ve tried and why it failed',
        questions: [
          'Have you listed with an agent? What happened?',
          'Have you tried selling yourself? Any offers?',
          'Have you talked to any investors or cash buyers?',
          'What made those solutions not work for you?',
          'What would need to be different for a solution to work?',
        ],
        qualificationSignals: [
          'Has genuinely tried traditional options',
          'Understands why they failed',
          'Open to new approaches',
          'Learns from experience',
        ],
        warningSigns: [
          'Haven\'t tried anything yet',
          'Blaming others for failures',
          'Closed to alternatives',
          'Expecting same results with new approach',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Define what success looks like and acceptable trade-offs',
        questions: [
          'What does the ideal outcome look like for you?',
          'What\'s more important: speed, price, or certainty?',
          'What would you be willing to trade off to get what you need most?',
          'What needs to happen for you to feel good about moving forward?',
          'What\'s your plan once this property is handled?',
        ],
        qualificationSignals: [
          'Clear outcome definition',
          'Willing to make trade-offs',
          'Prioritizes needs over wants',
          'Has thought through next steps',
        ],
        warningSigns: [
          'Wants everything (speed + max price)',
          'Unwilling to compromise',
          'No clear vision of success',
          'No plan for next step',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Test willingness to consider non-traditional approaches',
        questions: [
          'Would you be open to solutions beyond traditional listing?',
          'Have you heard of creative financing in real estate?',
          'What concerns would you have about a non-traditional sale?',
          'If I could solve your main problem, would structure matter?',
          'Are you more interested in the outcome or the method?',
        ],
        qualificationSignals: [
          'Open-minded to new approaches',
          'Outcome-focused over method',
          'Willing to learn',
          'Trust is buildable',
        ],
        warningSigns: [
          'Rigid in thinking',
          'Skeptical of everything',
          'Can\'t articulate concerns',
          'Trust issues apparent',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Introduce concept if appropriate, gauge reaction',
        questions: [
          'Have you heard of someone taking over your payments?',
          'What if there was a way to get relief without hurting your credit?',
          'Would you be interested in a solution that works with your existing loan?',
          'What questions would you have about that approach?',
        ],
        qualificationSignals: [
          'Curious, asks clarifying questions',
          'Sees potential benefit',
          'Willing to explore further',
          'Doesn\'t shut down immediately',
        ],
        warningSigns: [
          'Immediate rejection',
          'Sounds too good to be true',
          'Can\'t get past initial reaction',
          'Wants to talk to spouse/attorney first',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Relocation date is fixed',
        'Divorce decree has deadline',
        'Can\'t afford much longer',
        'Foreclosure timeline started',
      ],
      financial: [
        'Bleeding cash monthly',
        'Behind on payments',
        'Savings depleted',
        'Can\'t qualify for next place with current debt',
      ],
      emotional: [
        'Failed dream home',
        'Embarrassment about situation',
        'Stress affecting family',
        'Ready to move on emotionally',
      ],
      authority: [
        'Both spouses must agree',
        'Bank approval if short sale',
        'May need family input',
        'Attorney review expected',
      ],
    },
    propertyLoanReality: {
      occupancy: ['Currently living in property', 'Recently moved out', 'About to move out'],
      condition: [
        'Deferred maintenance visible',
        'Needs cosmetic updates',
        'Major repairs needed',
        'Move-in ready but dated',
      ],
      loanPresence: [
        'Conventional mortgage',
        'FHA loan',
        'Small equity position',
        'Underwater or break-even',
      ],
      paymentStatus: ['Current but struggling', '1-2 months behind', 'Forbearance ending'],
      viability: [
        'Good Subject-To candidate',
        'Loan balance vs value ratio works',
        'Payment is manageable',
      ],
    },
    painMotivation: {
      corePain: [
        'Payment is crushing us financially',
        'This house represents a failed chapter we need to close',
        'The stress is affecting our marriage/health',
        'We\'re trapped and can\'t move forward',
      ],
      deepeningQuestions: [
        'What does staying in this situation cost you beyond money?',
        'How long can you keep going like this?',
        'What would relief look like for you?',
        'What\'s the cost of waiting?',
      ],
      emotionalSignals: [
        'Voice cracks when discussing situation',
        'Relief when discussing possible solution',
        'Visible stress or exhaustion',
        'Urgency in tone',
      ],
      guidance:
        'Owner-occupied prospects are emotionally invested. Slow down, show empathy, build trust. This is their home, not just a property.',
    },
    failedSolutions: {
      attempted: [
        'Listed with agent - no qualified buyers',
        'FSBO - couldn\'t generate interest',
        'Loan modification - denied',
        'Talked to family - can\'t help',
      ],
      whyFailed: [
        'Price too high for condition',
        'No equity for traditional sale',
        'Buyers can\'t get financing',
        'Timeline too aggressive',
      ],
      remainingHope: 'Low - they\'ve exhausted obvious options, need creative solution',
    },
    desiredOutcome: {
      successMeans: [
        'Payment obligation gone',
        'Credit protected or minimally impacted',
        'Can move on with life',
        'Some equity preserved if possible',
      ],
      tradeOffs: [
        'Will trade maximum price for speed and certainty',
        'Will consider creative terms for relief',
        'Willing to walk away with little to nothing',
      ],
      wantOffPlate: [
        'Monthly payment burden',
        'Maintenance responsibility',
        'Emotional stress',
        'Barrier to next chapter',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'If I could solve your main problem, would how we do it matter?',
        'Are you more interested in the destination or the journey?',
        'Would you be willing to explore options you haven\'t heard of?',
        'What would make you comfortable with a non-traditional approach?',
      ],
      lowOpennessGuidance:
        'Return to pain and failed options. Contrast where they are vs where they want to be. Creative solutions become attractive when traditional options are exhausted.',
    },
    likelyObjections: [
      {
        common: 'I need to talk to my spouse first',
        protecting: 'Authority, relationship harmony, avoiding sole decision responsibility',
        risk: 'Fear of making wrong decision alone',
        controlQuestion:
          'Of course - what concerns do you think they\'ll have that we should address now?',
      },
      {
        common: 'This sounds too good to be true',
        protecting: 'Self from being taken advantage of',
        risk: 'Scam awareness, learned skepticism',
        controlQuestion: 'I understand - what specifically concerns you? Let\'s address that.',
      },
      {
        common: 'What about my credit?',
        protecting: 'Financial future, ability to borrow again',
        risk: 'Long-term impact of decision',
        controlQuestion:
          'Great question - how would this compare to foreclosure or short sale for you?',
      },
      {
        common: 'I need to think about it',
        protecting: 'Need for control, fear of pressure',
        risk: 'Making decision too quickly',
        controlQuestion:
          'Absolutely - what specifically do you need to think through? Let\'s talk it through now.',
      },
    ],
    complianceSignals: [
      {
        signal: 'Says yes but won\'t provide loan statement',
        meaning: 'Not truly committed, possibly hiding information',
      },
      {
        signal: 'Agrees to everything without questions',
        meaning: 'Hasn\'t processed information, may ghost later',
      },
      {
        signal: 'Excited about relief but vague on next steps',
        meaning: 'Emotional reaction, not logical commitment',
      },
      {
        signal: 'Wants to move forward but spouse not involved',
        meaning: 'Authority issue will emerge later',
      },
    ],
    redFlags: [
      {
        flag: 'Can\'t provide basic loan information',
        impact: 'Deal will stall at due diligence',
      },
      {
        flag: 'Wildly unrealistic price expectations',
        impact: 'Not grounded in reality, will be difficult to close',
      },
      {
        flag: 'Blames everyone else for situation',
        impact: 'Victim mentality, high maintenance, likely to back out',
      },
      {
        flag: 'No clear timeline or deadline',
        impact: 'Low urgency means low follow-through probability',
      },
    ],
    decisionStyles: [
      {
        name: 'Analytical',
        needs: ['Data and comparisons', 'Time to research', 'Written information', 'Proof points'],
        avoids: ['Pressure tactics', 'Emotional appeals', 'Rush decisions'],
      },
      {
        name: 'Emotional',
        needs: ['Empathy and understanding', 'Relief focus', 'Trust building', 'Vision of outcome'],
        avoids: ['Heavy data', 'Complex explanations', 'Rushing'],
      },
      {
        name: 'Authority-dependent',
        needs: [
          'Spouse/family involvement',
          'Expert validation',
          'Group consensus',
          'Social proof',
        ],
        avoids: ['Solo decisions', 'Pressure without buy-in'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'Listing fallback fantasy',
        innerDialogue:
          'If I just wait a little longer, a retail buyer will pay full price even with this condition...',
      },
      {
        belief: 'Refinance rescue hope',
        innerDialogue:
          'Maybe my credit will improve and I can refinance out of this... (despite no plan)',
      },
      {
        belief: 'Credit paralysis',
        innerDialogue:
          'If my credit is ruined I can never recover... (not comparing to foreclosure impact)',
      },
      {
        belief: 'Liability fear',
        innerDialogue:
          'If my name stays on loan, I\'m at risk... (doesn\'t understand protections)',
      },
      {
        belief: 'Regret avoidance',
        innerDialogue:
          'What if I sell and then the market goes up? I\'ll feel like an idiot...',
      },
    ],
    dealStructures: [
      {
        name: 'Subject-To',
        bestFit: 'Primary recommendation for owner-occupied with little/no equity',
        primaryLever: 'Immediate payment relief + credit protection',
        whenNotToUse: 'Significant equity position where cash makes more sense',
      },
      {
        name: 'Cash',
        bestFit: 'If they have equity and need clean break',
        primaryLever: 'Speed and simplicity',
        whenNotToUse: 'No equity, need to preserve credit score',
      },
      {
        name: 'Seller Finance',
        bestFit: 'Rare for owner-occupied, only if equity + want income',
        primaryLever: 'Monthly income stream',
        whenNotToUse: 'They need full exit, not ongoing involvement',
      },
    ],
    transformation: {
      from: [
        'Drowning in payments they can\'t afford',
        'Trapped in failed dream home',
        'Fear of foreclosure and credit damage',
        'Unable to move forward with life',
      ],
      to: [
        'Payment obligation removed',
        'Credit protected or minimally impacted',
        'Emotional relief and closure',
        'Free to start next chapter',
      ],
    },
  },
  'tired-landlord': {
    coreQuestions: {
      whyNow: 'Tenant issues, maintenance fatigue, poor returns, life stage change',
      pressure: 'Time burden, stress from management, returns not worth effort',
      outcome: 'Exit rental business, convert to passive income, or full liquidation',
      failedSolutions: 'Tried better tenants, property manager, still burned out',
      openness: 'High - exhausted with active management, very open to creative exit',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Understand rental history, management approach, decision to exit',
        questions: [
          'How long have you owned this rental?',
          'What made you decide to get out of the landlord business?',
          'Is this your only rental or do you have others?',
          'Are you self-managing or using a property manager?',
          'What\'s your timeline for exiting?',
        ],
        qualificationSignals: [
          'Clear frustration with landlording',
          'Decision is firm, not casual',
          'Understands business realities',
          'Ready to transition',
        ],
        warningSigns: [
          'Just had one bad tenant',
          'Knee-jerk reaction',
          'Unrealistic expectations of easy exit',
          'No thought to tax implications',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand occupancy, loan structure, cash flow, equity position',
        questions: [
          'Is it currently rented? For how much?',
          'What\'s your mortgage payment, taxes, insurance?',
          'What\'s the loan balance and equity position?',
          'How much cash flow are you actually netting monthly?',
          'Any deferred maintenance or upcoming capital needs?',
        ],
        qualificationSignals: [
          'Knows numbers cold',
          'Realistic about cash flow',
          'Aware of maintenance needs',
          'Professional approach',
        ],
        warningSigns: [
          'Doesn\'t know basic numbers',
          'Inflates cash flow',
          'Ignores deferred maintenance',
          'Emotional not business approach',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Uncover frustration level and true motivation',
        questions: [
          'What\'s the worst part about being a landlord?',
          'How is this rental affecting your life and time?',
          'What would you rather be doing with this time and capital?',
          'On a scale of 1-10, how done are you with landlording?',
          'What\'s your cost of staying vs exiting?',
        ],
        qualificationSignals: [
          'High frustration score (7+)',
          'Clear time/stress cost articulated',
          'Knows what they\'d rather do',
          'Calculates opportunity cost',
        ],
        warningSigns: [
          'Low frustration, just testing',
          'No clear alternative plan',
          'Can\'t articulate costs',
          'May change mind',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'What they\'ve tried to make landlording work',
        questions: [
          'Have you tried hiring a property manager?',
          'Did you try raising rents or improving tenant quality?',
          'Have you listed it for sale? What happened?',
          'What made those solutions not work?',
          'What would need to be true for you to keep it?',
        ],
        qualificationSignals: [
          'Has genuinely tried to make it work',
          'Understands the problem is the model, not execution',
          'Nothing will make them want to keep it',
          'Past point of no return',
        ],
        warningSigns: [
          'Hasn\'t tried obvious solutions',
          'Quick to give up',
          'Blaming without ownership',
          'May regret selling',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Define exit success and acceptable terms',
        questions: [
          'What does your ideal exit look like?',
          'Would you prefer a lump sum or ongoing passive income?',
          'How important is tax strategy in your exit?',
          'What trade-offs would you make for the right solution?',
          'What happens to your finances once this is handled?',
        ],
        qualificationSignals: [
          'Has thought through options',
          'Understands tax implications',
          'Flexible on structure',
          'Clear on priorities',
        ],
        warningSigns: [
          'Wants maximum of everything',
          'No tax planning',
          'Rigid requirements',
          'No financial plan post-exit',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Test flexibility on deal structure',
        questions: [
          'Would you be open to seller financing for the right terms?',
          'What about keeping the loan in place but handing off management?',
          'If you could be 100% passive but still earn, would that interest you?',
          'What concerns would you have about creative structures?',
        ],
        qualificationSignals: [
          'Outcome focused, structure flexible',
          'Understands creative benefits',
          'Willing to explore options',
          'Sophisticated thinking',
        ],
        warningSigns: [
          'Only wants cash',
          'Can\'t see past traditional',
          'Risk-averse to new approaches',
          'Trust issues with structures',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Present hands-off exit option',
        questions: [
          'What if you could exit all management but preserve equity growth?',
          'Would a solution where we take over everything interest you?',
          'How would you feel about a structure that\'s tax-advantaged?',
          'What questions do you have about that approach?',
        ],
        qualificationSignals: [
          'Interested in learning more',
          'Asks smart questions',
          'Sees potential fit',
          'Open to creative exit',
        ],
        warningSigns: [
          'Needs to liquidate now',
          'Doesn\'t trust the concept',
          'Wants traditional only',
          'Can\'t get comfortable',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Tired of being on call',
        'Want time back for other priorities',
        'Life stage change (retirement, new business)',
        'Managing from distance is exhausting',
      ],
      financial: [
        'Returns don\'t justify effort',
        'Capital could be deployed better',
        'Upcoming capital expenditures looming',
        'Negative cash flow periods',
      ],
      emotional: [
        'Burned out on tenant issues',
        'Stress affecting quality of life',
        'Ready to simplify finances',
        'Resentment toward property',
      ],
      authority: [
        'Spouse wants them done with rentals',
        'CPA advising exit strategy',
        'Decision is their own',
        'May consult attorney on structure',
      ],
    },
    propertyLoanReality: {
      occupancy: ['Currently rented', 'Between tenants', 'Problem tenant in place'],
      condition: [
        'Deferred maintenance accumulating',
        'Functional but tired',
        'Needs updates to command higher rent',
        'Tenant-grade condition',
      ],
      loanPresence: [
        'Investment loan in place',
        'Some equity built',
        'Cash flowing but barely',
        'Rate and payment are acceptable',
      ],
      paymentStatus: ['Current on payments', 'Managed to stay current'],
      viability: [
        'Excellent Subject-To candidate',
        'Good Seller Finance candidate',
        'Equity position supports multiple structures',
      ],
    },
    painMotivation: {
      corePain: [
        'Every midnight call is another reminder I hate this',
        'My time is worth more than these returns',
        'This was supposed to be passive income - it\'s anything but',
        'I\'m ready to simplify my life',
      ],
      deepeningQuestions: [
        'What could you do with your time if this was handled?',
        'How much is your time and peace of mind worth?',
        'What\'s the cost of staying in this another year?',
        'What would fully passive look like for you?',
      ],
      emotionalSignals: [
        'Exhaustion in voice',
        'Relief when discussing exit',
        'Immediate openness to solutions',
        'No nostalgia for property',
      ],
      guidance:
        'Tired landlords are sophisticated but burned out. Speak to ROI of their time, not just money. Focus on life improvement, not just financial outcome.',
    },
    failedSolutions: {
      attempted: [
        'Hired property manager - still too involved',
        'Improved tenant screening - still issues',
        'Raised rents - still not worth it',
        'Put on market - price vs condition gap',
      ],
      whyFailed: [
        'Problem is landlording itself, not execution',
        'Property manager adds cost without solving stress',
        'Market timing not right for retail sale',
        'Condition requires investment they won\'t make',
      ],
      remainingHope: 'None - they\'re done, need exit solution that works',
    },
    desiredOutcome: {
      successMeans: [
        'Hands completely off the property',
        'Either lump sum or truly passive income',
        'Time back for other priorities',
        'Tax-efficient exit if possible',
      ],
      tradeOffs: [
        'Will trade max price for no-hassle exit',
        'Open to seller financing for right terms',
        'Will accept below retail for speed and certainty',
        'Values simplicity over optimization',
      ],
      wantOffPlate: [
        'Tenant management and calls',
        'Maintenance and repairs',
        'Active oversight',
        'Mental burden of ownership',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'If you could be 100% hands-off but still benefit, would that work?',
        'What if the exit could be structured for tax advantage?',
        'Would ongoing income with zero work appeal to you?',
        'Are you open to exploring options beyond retail sale?',
      ],
      lowOpennessGuidance:
        'Rare with tired landlords - they\'re usually highly open. If resistance, may need cash immediately or have trust issues. Explore why.',
    },
    likelyObjections: [
      {
        common: 'What about capital gains taxes?',
        protecting: 'Wealth preservation, tax efficiency',
        risk: 'Large tax hit on sale',
        controlQuestion:
          'Great question - would you be interested in structures that defer or reduce that?',
      },
      {
        common: 'How do I know you\'ll actually make the payments?',
        protecting: 'Credit score, loan responsibility',
        risk: 'Default risk if Subject-To',
        controlQuestion:
          'Smart concern - let me show you how this is structured and protected...',
      },
      {
        common: 'Can I really be completely hands-off?',
        protecting: 'Fear of ongoing involvement',
        risk: 'Still getting pulled back in',
        controlQuestion:
          'Yes - let me be specific about what hands-off means in our structure...',
      },
      {
        common: 'Why would I do this vs selling retail?',
        protecting: 'Leaving money on table',
        risk: 'Making suboptimal financial decision',
        controlQuestion:
          'Let\'s compare - retail means repairs, agent fees, time, and uncertainty. What\'s that worth?',
      },
    ],
    complianceSignals: [
      {
        signal: 'Agrees but won\'t provide financials',
        meaning: 'Numbers may not support their stated position',
      },
      {
        signal: 'Excited about passive income but no tax planning',
        meaning: 'Hasn\'t thought through implications',
      },
      {
        signal: 'Ready to move forward without due diligence questions',
        meaning: 'May have regret later, need to slow them down',
      },
    ],
    redFlags: [
      {
        flag: 'Doesn\'t know property cash flow numbers',
        impact: 'Not a serious business operator, may be problems',
      },
      {
        flag: 'Multiple properties but selling only one',
        impact: 'May be problem property, investigate why',
      },
      {
        flag: 'Wants to sell but won\'t drop retail price expectations',
        impact: 'Not grounded in reality, deal won\'t close',
      },
    ],
    decisionStyles: [
      {
        name: 'Analytical Investor',
        needs: ['ROI calculations', 'Tax implications', 'Comparison analysis', 'Documentation'],
        avoids: ['Emotional appeals', 'Rushed decisions', 'Incomplete data'],
      },
      {
        name: 'Life-Stage Simplifier',
        needs: ['Simplicity focus', 'Life improvement angle', 'Peace of mind', 'Clear exit'],
        avoids: ['Complex structures', 'Ongoing oversight', 'Delays'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'Market timing fantasy',
        innerDialogue:
          'If I just wait for the market to peak, I\'ll get retail price... (ignoring cost of waiting)',
      },
      {
        belief: 'Next tenant will be perfect',
        innerDialogue:
          'Maybe the next tenant will be low-maintenance... (ignoring pattern)',
      },
      {
        belief: 'Tax paralysis',
        innerDialogue:
          'The capital gains will kill me, so I\'m stuck... (doesn\'t know options)',
      },
      {
        belief: 'Sunk cost fallacy',
        innerDialogue:
          'I\'ve put so much into this, I can\'t exit now... (ignoring opportunity cost)',
      },
    ],
    dealStructures: [
      {
        name: 'Seller Finance',
        bestFit: 'Primary recommendation for tired landlord with equity',
        primaryLever: 'Passive income stream + tax deferral + hands-off',
        whenNotToUse: 'Need immediate liquidity, unwilling to carry note',
      },
      {
        name: 'Subject-To',
        bestFit: 'If minimal equity but want immediate exit',
        primaryLever: 'Complete relief from management with equity preservation',
        whenNotToUse: 'Substantial equity that should be monetized',
      },
      {
        name: 'Cash',
        bestFit: 'If they need full liquidity now',
        primaryLever: 'Clean break, lump sum',
        whenNotToUse: 'Tax hit too large, would benefit from structure',
      },
    ],
    transformation: {
      from: [
        'Constant tenant calls and maintenance fires',
        'Active management burden for poor returns',
        'Stress and time drain',
        'Capital tied up inefficiently',
      ],
      to: [
        'Completely hands-off',
        'Passive income or lump sum',
        'Time back for priorities',
        'Simplified financial life',
      ],
    },
  },
  'distressed-landlord': {
    coreQuestions: {
      whyNow: 'Major tenant issue, significant vacancy, can\'t cover payments, distress escalating',
      pressure: 'Severe financial bleeding, foreclosure threat, can\'t fill vacancy',
      outcome: 'Stop the bleeding immediately, avoid foreclosure, preserve credit if possible',
      failedSolutions: 'Tried finding tenants, using savings, family loans, now out of options',
      openness: 'Very High - desperate for relief, will consider any viable solution',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Understand urgency level, decision authority, foreclosure timeline',
        questions: [
          'What happened that put you in this situation?',
          'How many payments have you missed?',
          'Have you received foreclosure notice?',
          'What\'s your absolute deadline to solve this?',
          'Who needs to be involved in this decision?',
        ],
        qualificationSignals: [
          'Clear about situation severity',
          'Foreclosure timeline is real',
          'Decision authority present',
          'Genuine urgency',
        ],
        warningSigns: [
          'Downplaying severity',
          'Magical thinking about fix',
          'Authority unclear',
          'No real deadline',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand loan status, equity position, vacancy, payments behind',
        questions: [
          'What\'s your total loan balance?',
          'How many payments behind are you?',
          'Is the property vacant or occupied?',
          'What\'s it worth and what do you owe?',
          'What are total monthly costs including taxes and insurance?',
        ],
        qualificationSignals: [
          'Honest about arrears',
          'Knows loan details',
          'Realistic about value',
          'Understands deficit',
        ],
        warningSigns: [
          'Hiding true arrears',
          'Wildly inflated value',
          'Doesn\'t know loan status',
          'In denial about situation',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Understand depth of distress and commitment to solution',
        questions: [
          'What happens if this goes to foreclosure?',
          'How is this situation affecting you personally?',
          'What are you willing to do to avoid foreclosure?',
          'What\'s worse: foreclosure or walking away with nothing?',
          'On a scale of 1-10, how urgently do you need to solve this?',
        ],
        qualificationSignals: [
          'Understands foreclosure consequences',
          'High distress visible',
          'Willing to make hard choices',
          'Urgency 9-10',
        ],
        warningSigns: [
          'Doesn\'t grasp severity',
          'Still hoping for miracle',
          'Won\'t make hard choices',
          'Low urgency despite claims',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'What they\'ve tried and exhausted',
        questions: [
          'Have you tried loan modification or forbearance?',
          'Did you try to sell or rent it out? What happened?',
          'Have you borrowed from family or depleted savings?',
          'What made those not work?',
          'What options do you see at this point?',
        ],
        qualificationSignals: [
          'Has exhausted obvious options',
          'Understands why they failed',
          'Sees limited remaining options',
          'Ready for creative solution',
        ],
        warningSigns: [
          'Haven\'t tried basics',
          'Giving up too easily',
          'Still has resources to tap',
          'Not truly at end of rope',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Define minimum acceptable outcome',
        questions: [
          'What does success look like at this point?',
          'Would avoiding foreclosure alone be a win?',
          'Are you expecting to walk away with money?',
          'What would you trade to stop this bleeding?',
          'What needs to happen for you to move forward immediately?',
        ],
        qualificationSignals: [
          'Realistic expectations',
          'Relief-focused not profit-focused',
          'Willing to trade equity for solution',
          'Clear on priorities',
        ],
        warningSigns: [
          'Unrealistic expectations given situation',
          'Still expecting profit',
          'Unwilling to accept reality',
          'Confused on priorities',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Confirm willingness to move forward with solution',
        questions: [
          'If I can stop the foreclosure and protect your credit, would structure matter?',
          'Are you ready to make a decision today if the solution works?',
          'What would hold you back from moving forward?',
          'Do you understand you may walk away with nothing but avoiding foreclosure?',
        ],
        qualificationSignals: [
          'Outcome trumps method',
          'Ready to decide now',
          'No unrealistic blockers',
          'Accepts reality',
        ],
        warningSigns: [
          'Still shopping around',
          'Can\'t commit today',
          'Holding out for better deal',
          'Hasn\'t accepted situation',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Present foreclosure rescue option',
        questions: [
          'What if we could stop the foreclosure and take over payments?',
          'Would a solution that saves your credit work for you?',
          'Are you comfortable with us bringing the loan current?',
          'What questions do you have about that?',
        ],
        qualificationSignals: [
          'Relief and interest visible',
          'Asks how it works',
          'Ready to proceed',
          'Grateful for option',
        ],
        warningSigns: [
          'Skeptical despite situation',
          'Can\'t get comfortable',
          'Still wants other options',
          'May ghost after interest',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Foreclosure auction date set',
        'Days or weeks until foreclosure',
        'Bank acceleration letter received',
        'No time for traditional sale',
      ],
      financial: [
        'Hemorrhaging monthly',
        'Multiple payments behind',
        'Savings exhausted',
        'No ability to bring current',
      ],
      emotional: [
        'Panic and desperation',
        'Shame and embarrassment',
        'Sleep disruption',
        'Relationship strain',
      ],
      authority: [
        'Foreclosure forces decision',
        'No bank approval needed',
        'Decision is theirs alone',
        'May consult attorney',
      ],
    },
    propertyLoanReality: {
      occupancy: ['Vacant and bleeding', 'Problem tenant', 'Can\'t get tenant', 'Between tenants'],
      condition: [
        'Maintenance neglected',
        'Needs work to rent',
        'Functional but declining',
        'Can\'t invest in repairs',
      ],
      loanPresence: [
        'Underwater or break-even',
        'Multiple months behind',
        'Foreclosure initiated',
        'No equity available',
      ],
      paymentStatus: ['3+ months behind', 'Foreclosure process started', 'Bank acceleration'],
      viability: [
        'Perfect Subject-To candidate',
        'Need to cure arrears',
        'Time-critical situation',
      ],
    },
    painMotivation: {
      corePain: [
        'I\'m losing sleep every night worrying about foreclosure',
        'This is destroying my credit and my life',
        'Every month I sink deeper and there\'s no way out',
        'I\'ll do anything to stop this nightmare',
      ],
      deepeningQuestions: [
        'What does foreclosure mean for your future?',
        'How much longer can you keep fighting this?',
        'What would relief feel like right now?',
        'What are you willing to accept to stop the bleeding?',
      ],
      emotionalSignals: [
        'Visible panic or desperation',
        'Emotional volatility',
        'Immediate relief at potential solution',
        'Grateful not defensive',
      ],
      guidance:
        'Distressed landlords are in crisis. Show empathy but move with urgency. They need a lifeline, not a sales pitch. Be direct, be helpful, be fast.',
    },
    failedSolutions: {
      attempted: [
        'Tried loan modification - denied',
        'Tried to find tenant - no luck or problem tenants',
        'Depleted savings trying to cover',
        'Borrowed from family - still not enough',
        'Tried to sell - no time or no equity',
      ],
      whyFailed: [
        'Arrears too deep for modification',
        'Vacancy or bad tenant destroyed cash flow',
        'Not enough resources to wait out solutions',
        'No equity for traditional sale',
        'Time ran out',
      ],
      remainingHope: 'None - this is last option before foreclosure',
    },
    desiredOutcome: {
      successMeans: [
        'Foreclosure stopped',
        'Credit protected from further damage',
        'Monthly bleeding stops',
        'Can move on with life',
      ],
      tradeOffs: [
        'Will walk away with nothing',
        'Will trade all equity for relief',
        'Will accept any structure that works',
        'Speed and certainty are everything',
      ],
      wantOffPlate: [
        'Foreclosure threat',
        'Payment responsibility',
        'Property burden',
        'Emotional nightmare',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'If I can stop the foreclosure, does how we do it matter?',
        'Are you ready to move forward immediately?',
        'What would prevent you from saying yes to a solution today?',
        'Do you understand this may mean walking away with nothing but avoiding foreclosure?',
      ],
      lowOpennessGuidance:
        'Rare in true distress. If present, they may not fully grasp situation severity or may have unrealistic rescue fantasy. Re-establish reality.',
    },
    likelyObjections: [
      {
        common: 'I need to get something out of this',
        protecting: 'Ego, avoiding feeling of total loss',
        risk: 'Walking away with nothing feels like failure',
        controlQuestion:
          'I understand - what\'s more important: getting nothing and avoiding foreclosure, or foreclosure?',
      },
      {
        common: 'What if I can figure something else out?',
        protecting: 'Hope that miracle will happen',
        risk: 'Fear of making wrong choice',
        controlQuestion:
          'What specifically would that be, and how long do you have to make it happen?',
      },
      {
        common: 'This feels like I\'m being taken advantage of',
        protecting: 'Self-respect in desperate situation',
        risk: 'Being exploited when vulnerable',
        controlQuestion:
          'I understand - let\'s be clear about what you\'re getting: foreclosure stopped, credit protected. Is that worth it?',
      },
      {
        common: 'My name stays on the loan?',
        protecting: 'Future liability concern',
        risk: 'Ongoing responsibility',
        controlQuestion:
          'Yes - and we bring it current and keep it current. What\'s the alternative if we don\'t move forward?',
      },
    ],
    complianceSignals: [
      {
        signal: 'Says yes but won\'t provide loan info immediately',
        meaning: 'May be shopping multiple solutions, urgency not real',
      },
      {
        signal: 'Agrees but wants to wait a few days',
        meaning: 'Hasn\'t accepted reality or urgency, may lose to foreclosure',
      },
      {
        signal: 'Relief but won\'t commit to next step',
        meaning: 'Emotional response without logical commitment',
      },
    ],
    redFlags: [
      {
        flag: 'Claims distress but won\'t share foreclosure letter',
        impact: 'Urgency may not be real, timeline unclear',
      },
      {
        flag: 'Multiple properties in distress',
        impact: 'Pattern of poor management, may have other issues',
      },
      {
        flag: 'Still expecting equity payout',
        impact: 'Not grounded in reality, deal will stall',
      },
      {
        flag: 'Blames everyone but themselves',
        impact: 'Victim mentality, difficult to work with',
      },
    ],
    decisionStyles: [
      {
        name: 'Crisis Decision Maker',
        needs: ['Fast action', 'Clear solution', 'Immediate relief', 'Simple process'],
        avoids: ['Delays', 'Complexity', 'Long explanations', 'More problems'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'Miracle rescue fantasy',
        innerDialogue: 'Maybe a perfect tenant will appear and I can catch up... (unrealistic)',
      },
      {
        belief: 'Loan modification hope',
        innerDialogue:
          'If I just call the bank one more time... (already denied, time\'s up)',
      },
      {
        belief: 'Market will save me',
        innerDialogue:
          'If I can just hold on, property value will go up... (meanwhile drowning)',
      },
      {
        belief: 'Someone owes me',
        innerDialogue:
          'This isn\'t fair, someone should help me... (avoiding responsibility)',
      },
    ],
    dealStructures: [
      {
        name: 'Subject-To',
        bestFit: 'Only viable option for distressed landlord',
        primaryLever: 'Foreclosure rescue + arrears cured + credit protected',
        whenNotToUse: 'If they have actual equity and time (rare in distress)',
      },
      {
        name: 'Cash',
        bestFit: 'Only if they have equity after arrears cured',
        primaryLever: 'Fast closing',
        whenNotToUse: 'Underwater or no equity after arrears',
      },
    ],
    transformation: {
      from: [
        'Days/weeks from foreclosure',
        'Hemorrhaging money monthly',
        'Credit being destroyed',
        'Panic and desperation',
      ],
      to: [
        'Foreclosure stopped',
        'Payments current and managed',
        'Credit protected going forward',
        'Emotional relief and fresh start',
      ],
    },
  },
  'foreclosure': {
    coreQuestions: {
      whyNow: 'Foreclosure initiated, sale date set or imminent, legal action started',
      pressure: 'Extreme time pressure, legal consequences, credit destruction',
      outcome: 'Stop foreclosure immediately, save credit if possible, avoid deficiency judgment',
      failedSolutions: 'Tried everything, time ran out, no options left',
      openness: 'Maximum - facing legal action, needs solution immediately',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Establish exact foreclosure timeline and legal status',
        questions: [
          'When is the foreclosure sale date?',
          'Have you received foreclosure lawsuit papers?',
          'How many months behind are you on payments?',
          'Have you consulted with an attorney?',
          'Do you have the foreclosure notice? Can you send it?',
        ],
        qualificationSignals: [
          'Has foreclosure documents',
          'Knows exact sale date',
          'Clear about timeline',
          'Ready to act immediately',
        ],
        warningSigns: [
          'Vague on foreclosure status',
          'No documentation',
          'Claims foreclosure but timeline unclear',
          'May not be in actual foreclosure',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand loan balance, arrears, equity position, property status',
        questions: [
          'What\'s the total amount needed to bring loan current?',
          'What\'s the property worth vs what you owe?',
          'Is the property occupied or vacant?',
          'What\'s the condition?',
          'Have you received a payoff quote from the bank?',
        ],
        qualificationSignals: [
          'Has payoff or arrears figure',
          'Realistic about value',
          'Honest about condition',
          'Documents available',
        ],
        warningSigns: [
          'No idea of arrears amount',
          'Won\'t contact bank for info',
          'Wildly inflated value',
          'Can\'t provide documentation',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Understand consequences they\'re facing and commitment level',
        questions: [
          'What happens to you if this goes to auction?',
          'Do you understand the credit impact of foreclosure?',
          'What about deficiency judgment risk?',
          'What are you willing to do to stop this?',
          'Is there ANY other option you have?',
        ],
        qualificationSignals: [
          'Understands full consequences',
          'Genuine fear and urgency',
          'Will do whatever it takes',
          'No other options available',
        ],
        warningSigns: [
          'Doesn\'t grasp severity',
          'Still has other options',
          'Not actually urgent',
          'May be wasting time',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'Confirm they\'ve exhausted all options',
        questions: [
          'Did you try loan modification? What happened?',
          'Did you try to sell it? Why didn\'t that work?',
          'Have you filed bankruptcy?',
          'Any family able to help?',
          'What prevented those from working?',
        ],
        qualificationSignals: [
          'Tried everything',
          'Understands why options failed',
          'Truly out of options',
          'Time is the constraint',
        ],
        warningSigns: [
          'Haven\'t tried obvious things',
          'Giving up prematurely',
          'Bankruptcy still possible',
          'Not actually at end',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Set realistic expectations',
        questions: [
          'At this point, is stopping foreclosure the win?',
          'Do you understand you\'re walking away with nothing?',
          'Are you clear this is about avoiding foreclosure, not getting paid?',
          'What do you need to feel okay about moving forward?',
          'Can you make a decision today?',
        ],
        qualificationSignals: [
          'Realistic expectations',
          'Accepts reality',
          'Relief-focused',
          'Ready to decide now',
        ],
        warningSigns: [
          'Still expects money out',
          'Unrealistic given situation',
          'Can\'t commit today',
          'Hasn\'t accepted reality',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Confirm readiness to proceed immediately',
        questions: [
          'If we can stop the foreclosure, are you ready to sign today?',
          'Do you understand we need to move in days, not weeks?',
          'What would prevent you from moving forward immediately?',
          'Are you the only decision maker or do others need to agree?',
        ],
        qualificationSignals: [
          'Ready to sign immediately',
          'Understands urgency',
          'No blockers',
          'Sole decision maker',
        ],
        warningSigns: [
          'Needs time to think',
          'Other decision makers',
          'Shopping around',
          'Urgency not matching situation',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Present foreclosure rescue',
        questions: [
          'We can stop the foreclosure by bringing the loan current and taking over payments',
          'You\'ll deed us the property and we handle everything from here',
          'Your credit is protected from foreclosure and you walk away clean',
          'Are you ready to move forward?',
        ],
        qualificationSignals: [
          'Immediate relief and agreement',
          'Asks about next steps',
          'Ready to provide documents',
          'Grateful for solution',
        ],
        warningSigns: [
          'Skeptical despite situation',
          'Won\'t commit',
          'Wants to explore other options',
          'May not follow through',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Sale date is set',
        'Days until auction',
        'Legal deadline imminent',
        'Zero time for alternatives',
      ],
      financial: [
        'Massive arrears accumulated',
        'No ability to cure',
        'Deficiency judgment risk',
        'Credit being annihilated',
      ],
      emotional: [
        'Extreme stress and panic',
        'Public embarrassment',
        'Family affected',
        'Desperation visible',
      ],
      authority: [
        'Court action forces decision',
        'Bank has control',
        'Need solution immediately',
        'No negotiation leverage',
      ],
    },
    propertyLoanReality: {
      occupancy: ['May be occupied or vacant', 'Possibly abandoned', 'Condition declining'],
      condition: [
        'Often neglected',
        'Maintenance deferred',
        'May need significant work',
        'Declining due to vacancy',
      ],
      loanPresence: [
        'Deeply underwater or no equity',
        'Massive arrears',
        'Foreclosure costs added',
        'Attorney fees included',
      ],
      paymentStatus: [
        '6+ months behind',
        'Acceleration letter received',
        'Legal action filed',
        'Sale scheduled',
      ],
      viability: ['Subject-To only if math works', 'Must cure large arrears', 'Time-critical'],
    },
    painMotivation: {
      corePain: [
        'The auction is scheduled - I\'m about to lose everything',
        'My credit will be destroyed for 7 years',
        'I could face a deficiency judgment for years',
        'This is a public humiliation and legal nightmare',
      ],
      deepeningQuestions: [
        'What happens to you when the property sells at auction?',
        'Do you understand what foreclosure means for the next 7 years?',
        'What would stopping this be worth to you?',
        'Is there any other option you have right now?',
      ],
      emotionalSignals: [
        'Panic or resignation',
        'Desperate energy',
        'Immediate relief at any solution',
        'May cry or show extreme emotion',
      ],
      guidance:
        'Foreclosure prospects are in legal crisis. Be empathetic but extremely direct. Time is everything. No sales pitch needed - they need rescue.',
    },
    failedSolutions: {
      attempted: [
        'Loan modification - denied or too late',
        'Tried to sell - no time or no equity',
        'Bankruptcy considered but won\'t help',
        'Borrowed from everyone possible',
        'Applied for assistance programs - denied',
      ],
      whyFailed: [
        'Too deep in arrears',
        'No equity for sale',
        'Time ran out',
        'No resources left',
        'System couldn\'t help fast enough',
      ],
      remainingHope: 'Zero - foreclosure is happening unless intervention now',
    },
    desiredOutcome: {
      successMeans: [
        'Foreclosure stopped',
        'Avoiding public sale',
        'Credit protected from foreclosure',
        'No deficiency judgment',
      ],
      tradeOffs: [
        'Will give up property for nothing',
        'Any solution that stops foreclosure',
        'Speed is only priority',
        'Walking away clean is the win',
      ],
      wantOffPlate: [
        'Legal action',
        'Public foreclosure sale',
        'Deficiency judgment risk',
        'Credit annihilation',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'We can stop this foreclosure - are you ready to move now?',
        'Does it matter how we do it, as long as foreclosure is stopped?',
        'Can you make a decision today?',
        'What would prevent you from signing immediately?',
      ],
      lowOpennessGuidance:
        'Should not exist in real foreclosure. If present, foreclosure may not be real or they don\'t understand severity. Verify situation immediately.',
    },
    likelyObjections: [
      {
        common: 'I should get something out of this',
        protecting: 'Ego and sense of fairness',
        risk: 'Feeling exploited',
        controlQuestion:
          'I understand - but what\'s the alternative if we don\'t stop the foreclosure?',
      },
      {
        common: 'Can I just file bankruptcy?',
        protecting: 'Hope for different solution',
        risk: 'More legal action',
        controlQuestion:
          'Have you talked to bankruptcy attorney? How long would that take and what would it cost?',
      },
      {
        common: 'What if the bank works with me?',
        protecting: 'Hope for miracle',
        risk: 'False hope',
        controlQuestion:
          'When\'s the sale date? How much time do you have for the bank to change their mind?',
      },
      {
        common: 'This feels like I\'m giving up',
        protecting: 'Self-image and ego',
        risk: 'Feeling of failure',
        controlQuestion:
          'What\'s giving up: stopping foreclosure now, or letting it go to auction?',
      },
    ],
    complianceSignals: [
      {
        signal: 'Says yes but won\'t send foreclosure documents',
        meaning: 'May not be in actual foreclosure or timeline not real',
      },
      {
        signal: 'Agrees but wants to wait',
        meaning: 'Doesn\'t understand urgency or not serious',
      },
      {
        signal: 'Won\'t provide attorney or bank contact',
        meaning: 'Hiding something or not legitimate',
      },
    ],
    redFlags: [
      {
        flag: 'Claims foreclosure but has no documents',
        impact: 'Situation may not be real',
      },
      {
        flag: 'Vague on sale date or amount owed',
        impact: 'Not actually in foreclosure',
      },
      {
        flag: 'Still expects to get paid',
        impact: 'Not grounded in reality',
      },
      {
        flag: 'Won\'t commit immediately despite urgency',
        impact: 'Timeline doesn\'t match behavior - verify situation',
      },
    ],
    decisionStyles: [
      {
        name: 'Crisis Mode',
        needs: ['Immediate action', 'Clear direction', 'Fast resolution', 'Someone to trust'],
        avoids: ['Delays', 'Complexity', 'More uncertainty', 'Additional problems'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'Bank will work with me at last minute',
        innerDialogue:
          'They won\'t really foreclose, they\'ll negotiate... (denial, time\'s up)',
      },
      {
        belief: 'Someone will rescue me',
        innerDialogue:
          'A family member or miracle will appear... (avoiding reality)',
      },
      {
        belief: 'Bankruptcy will solve this',
        innerDialogue:
          'I can just file bankruptcy and stop it... (may be too late, costs money)',
      },
      {
        belief: 'I should get something',
        innerDialogue:
          'I shouldn\'t have to walk away with nothing... (ego overriding reality)',
      },
    ],
    dealStructures: [
      {
        name: 'Subject-To',
        bestFit: 'Only option if math works',
        primaryLever: 'Foreclosure stopped, arrears cured, credit protected',
        whenNotToUse: 'Arrears too large, property value too low, math doesn\'t work',
      },
    ],
    transformation: {
      from: [
        'Days from public foreclosure sale',
        'Legal action and court',
        '7-year credit destruction',
        'Potential deficiency judgment',
      ],
      to: [
        'Foreclosure stopped',
        'Legal action resolved',
        'Credit protected from foreclosure',
        'Clean exit from nightmare',
      ],
    },
  },
  'probate-inherited': {
    coreQuestions: {
      whyNow: 'Inherited property, don\'t want it, need to settle estate, out-of-state burden',
      pressure: 'Estate settlement deadline, family pressure, carrying costs, emotional burden',
      outcome: 'Convert to cash or income, settle estate, minimize hassle and cost',
      failedSolutions: 'Listed but market slow, family can\'t agree, need simple solution',
      openness: 'High - didn\'t choose to own it, open to creative exit strategies',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Understand estate status, decision authority, timeline',
        questions: [
          'How did you come to own this property?',
          'Is the estate fully settled or still in probate?',
          'Who has decision authority? Just you or multiple heirs?',
          'What\'s your timeline for resolving this?',
          'Do you live near the property or out of state?',
        ],
        qualificationSignals: [
          'Clear on estate status',
          'Has decision authority',
          'Timeline is defined',
          'Motivated to resolve',
        ],
        warningSigns: [
          'Still in probate with no timeline',
          'Multiple heirs, no agreement',
          'No clear authority',
          'Vague on timeline',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand property condition, liens, estate debt, value',
        questions: [
          'Is there a mortgage on the property?',
          'What condition is it in?',
          'Has it been vacant? For how long?',
          'What\'s it worth in current condition?',
          'Are there any estate debts or liens?',
        ],
        qualificationSignals: [
          'Knows mortgage status',
          'Realistic about condition',
          'Aware of any liens',
          'Has property access',
        ],
        warningSigns: [
          'No access to property',
          'Doesn\'t know loan status',
          'Hidden liens or issues',
          'Unrealistic value expectations',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Understand burden and motivation to resolve',
        questions: [
          'What\'s the hardest part about dealing with this property?',
          'How much is it costing you monthly to hold?',
          'How is this affecting your life?',
          'What would it mean to have this resolved?',
          'On a scale of 1-10, how motivated are you to solve this?',
        ],
        qualificationSignals: [
          'Clear burden articulated',
          'Aware of carrying costs',
          'High motivation (7+)',
          'Ready to resolve',
        ],
        warningSigns: [
          'No rush to resolve',
          'Sentimental attachment',
          'Family disagreement',
          'Low motivation',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'What they\'ve tried',
        questions: [
          'Have you listed it for sale?',
          'Have any family members wanted to keep it?',
          'Have you talked to investors or cash buyers?',
          'What made those not work?',
          'What would need to be different for a solution to work?',
        ],
        qualificationSignals: [
          'Has tried traditional options',
          'Understands why they didn\'t work',
          'Open to new approach',
          'Learns from experience',
        ],
        warningSigns: [
          'Haven\'t tried anything',
          'Family conflict unresolved',
          'Unrealistic expectations persist',
          'Blaming others',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Define success and acceptable terms',
        questions: [
          'What does success look like for you?',
          'Would you prefer cash now or income over time?',
          'How important is speed vs maximizing value?',
          'What trade-offs would you accept?',
          'What needs to happen for estate to be settled?',
        ],
        qualificationSignals: [
          'Clear outcome vision',
          'Flexible on structure',
          'Willing to trade-off',
          'Understands estate needs',
        ],
        warningSigns: [
          'Wants maximum of everything',
          'Inflexible',
          'No clear vision',
          'Family disagreement',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Test flexibility on structure',
        questions: [
          'Would you be open to seller financing?',
          'What about keeping the mortgage in place with us taking over?',
          'If you could be hands-off but still benefit, would that interest you?',
          'What concerns would you have about creative structures?',
        ],
        qualificationSignals: [
          'Open to learning',
          'Outcome over method',
          'Willing to explore',
          'Trust is buildable',
        ],
        warningSigns: [
          'Only wants cash',
          'Rigid thinking',
          'Skeptical of everything',
          'Trust issues',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Introduce option if mortgage exists',
        questions: [
          'If there\'s a mortgage, we could take it over and you\'re done',
          'Would a solution that\'s hands-off appeal to you?',
          'What if you could walk away without repairs or hassle?',
          'What questions would you have about that?',
        ],
        qualificationSignals: [
          'Interest and curiosity',
          'Sees benefit of hands-off',
          'Asks good questions',
          'Willing to learn more',
        ],
        warningSigns: [
          'Immediate rejection',
          'Can\'t get comfortable',
          'Needs full cash out',
          'Won\'t explore',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Estate settlement deadline',
        'Probate closing timeline',
        'Family pressure to resolve',
        'Want to move on',
      ],
      financial: [
        'Monthly carrying costs',
        'Insurance and taxes',
        'Maintenance burden',
        'Lost opportunity cost',
      ],
      emotional: [
        'Grief and loss processed',
        'Ready to close chapter',
        'Long-distance burden',
        'Family dynamics',
      ],
      authority: [
        'Probate court approval may be needed',
        'Multiple heirs must agree',
        'Executor/administrator has authority',
        'Attorney oversight',
      ],
    },
    propertyLoanReality: {
      occupancy: ['Vacant', 'Family member occupying', 'Tenant in place', 'Abandoned'],
      condition: [
        'Estate condition',
        'Needs cleanout',
        'Deferred maintenance',
        'Dated but functional',
      ],
      loanPresence: [
        'Mortgage may or may not exist',
        'Estate may have paid off',
        'Possible equity position',
        'Clear title after probate',
      ],
      paymentStatus: [
        'Payments current if loan exists',
        'Estate making payments',
        'No loan, clear title',
      ],
      viability: [
        'Good candidate for multiple structures',
        'If loan exists, Subject-To possible',
        'If no loan, Seller Finance ideal',
      ],
    },
    painMotivation: {
      corePain: [
        'I never wanted this property and it\'s become a burden',
        'I\'m paying monthly costs for something I don\'t want',
        'This is holding up the estate settlement',
        'I live out of state and can\'t manage this',
      ],
      deepeningQuestions: [
        'What would having this resolved mean for you?',
        'How much time and money is this costing you?',
        'What would you rather do with this capital?',
        'What\'s the cost of letting this drag on?',
      ],
      emotionalSignals: [
        'Frustration with burden',
        'Relief when discussing solution',
        'Ready to move on',
        'No emotional attachment',
      ],
      guidance:
        'Inherited property owners are burdened but often have flexibility. Focus on ease and convenience over maximum price. They didn\'t choose this asset.',
    },
    failedSolutions: {
      attempted: [
        'Listed with agent - slow market or condition issues',
        'Family considered keeping - decided against',
        'Tried to rent - don\'t want to be landlords',
        'Looked at repairs - too expensive or complicated',
      ],
      whyFailed: [
        'Market too slow',
        'Condition requires investment',
        'Family can\'t manage from distance',
        'Don\'t want ongoing involvement',
      ],
      remainingHope: 'Low - need solution that\'s fast and easy',
    },
    desiredOutcome: {
      successMeans: [
        'Property converted to cash or income',
        'Estate settled',
        'Burden removed',
        'Family can move on',
      ],
      tradeOffs: [
        'Will trade max price for ease',
        'Open to seller financing',
        'Will accept as-is sale',
        'Speed and simplicity valued',
      ],
      wantOffPlate: [
        'Carrying costs',
        'Management burden',
        'Long-distance headache',
        'Estate complication',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'If we could make this completely easy for you, would structure matter?',
        'Would you prefer cash now or income over time?',
        'What if you could walk away without any repairs or hassle?',
        'Are you open to exploring options beyond traditional sale?',
      ],
      lowOpennessGuidance:
        'If low openness, may have family pressure to maximize price or emotional attachment. Explore blockers and address.',
    },
    likelyObjections: [
      {
        common: 'I need to talk to the other heirs',
        protecting: 'Family harmony, shared authority',
        risk: 'Making decision without consensus',
        controlQuestion:
          'Of course - what concerns do you think they\'ll have? Let\'s address them now.',
      },
      {
        common: 'I think it\'s worth more',
        protecting: 'Estate value, family expectations',
        risk: 'Leaving money on table',
        controlQuestion:
          'What\'s it worth after repairs, holding costs, and agent fees? Let\'s run numbers.',
      },
      {
        common: 'I need to close the estate',
        protecting: 'Timeline and settlement',
        risk: 'Deal taking too long',
        controlQuestion:
          'We can close in your timeline - what\'s the deadline?',
      },
      {
        common: 'What about taxes?',
        protecting: 'Tax implications',
        risk: 'Unexpected tax bill',
        controlQuestion:
          'Great question - have you talked to estate attorney about stepped-up basis?',
      },
    ],
    complianceSignals: [
      {
        signal: 'Says yes but other heirs not involved',
        meaning: 'Authority issue will emerge',
      },
      {
        signal: 'Agrees but doesn\'t have estate documents',
        meaning: 'May not have authority or estate not settled',
      },
      {
        signal: 'Excited but vague on probate status',
        meaning: 'Legal issues may prevent closing',
      },
    ],
    redFlags: [
      {
        flag: 'Probate not complete or unclear timeline',
        impact: 'Cannot close until probate settled',
      },
      {
        flag: 'Multiple heirs with disagreement',
        impact: 'Deal will stall in family conflict',
      },
      {
        flag: 'Hidden liens or estate debts',
        impact: 'Title issues will prevent closing',
      },
      {
        flag: 'Strong emotional attachment despite claims',
        impact: 'May back out or have regrets',
      },
    ],
    decisionStyles: [
      {
        name: 'Pragmatic Resolver',
        needs: ['Simple solution', 'Clear process', 'Fair value', 'Fast timeline'],
        avoids: ['Complexity', 'Ongoing involvement', 'Risk'],
      },
      {
        name: 'Family Consensus',
        needs: ['All heirs agree', 'Fair to everyone', 'No regrets', 'Documentation'],
        avoids: ['Conflict', 'Rushed decisions', 'Appearance of unfairness'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'Market will improve',
        innerDialogue:
          'If I wait, I\'ll get more... (ignoring carrying costs)',
      },
      {
        belief: 'Family member will buy it',
        innerDialogue:
          'Someone will want to keep it... (they\'ve already declined)',
      },
      {
        belief: 'Should honor deceased wishes',
        innerDialogue:
          'Mom would want us to keep it... (despite burden)',
      },
      {
        belief: 'Need to maximize for estate',
        innerDialogue:
          'I owe it to the estate to get top dollar... (ignoring costs)',
      },
    ],
    dealStructures: [
      {
        name: 'Seller Finance',
        bestFit: 'If no mortgage, ideal for inherited property',
        primaryLever: 'Income stream + tax advantages + no hassle',
        whenNotToUse: 'They need immediate cash lump sum',
      },
      {
        name: 'Subject-To',
        bestFit: 'If mortgage exists',
        primaryLever: 'Hands-off exit + no repairs needed',
        whenNotToUse: 'No mortgage or they want cash out',
      },
      {
        name: 'Cash',
        bestFit: 'If they need to settle estate with cash',
        primaryLever: 'Fast closing, simple',
        whenNotToUse: 'Tax implications unfavorable',
      },
    ],
    transformation: {
      from: [
        'Unwanted inherited burden',
        'Monthly carrying costs',
        'Long-distance management headache',
        'Estate settlement delayed',
      ],
      to: [
        'Asset converted to cash or income',
        'Estate settled',
        'Burden removed',
        'Family can move forward',
      ],
    },
  },
  'subject-to': {
    coreQuestions: {
      whyNow: 'Heard about Subject-To, researching options, possibly referred',
      pressure: 'Low to moderate - researching options, not in crisis',
      outcome: 'Understand if Subject-To is right solution, make informed decision',
      failedSolutions: 'May not have tried anything yet, exploring proactively',
      openness: 'Medium - interested but wants to understand fully',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Understand how they heard about Subject-To and why interested',
        questions: [
          'How did you hear about Subject-To?',
          'What do you understand about how it works?',
          'What specifically interests you about this option?',
          'What\'s your situation with the property?',
          'What\'s your timeline?',
        ],
        qualificationSignals: [
          'Has basic understanding',
          'Clear reason for interest',
          'Real situation exists',
          'Open to learning',
        ],
        warningSigns: [
          'No real situation, just curious',
          'Misunderstands concept completely',
          'No actual timeline',
          'Tire kicker',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand their actual property and loan situation',
        questions: [
          'Tell me about your property',
          'What\'s the mortgage situation?',
          'Are you current on payments?',
          'What\'s your equity position?',
          'Why are you considering this vs traditional sale?',
        ],
        qualificationSignals: [
          'Has actual property/situation',
          'Knows loan details',
          'Valid reason for considering Subject-To',
          'Makes sense for their situation',
        ],
        warningSigns: [
          'No actual situation yet',
          'Wouldn\'t benefit from Subject-To',
          'Traditional sale makes more sense',
          'Just researching, not serious',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Understand real motivation and pain level',
        questions: [
          'What problem are you trying to solve?',
          'What happens if you don\'t solve it?',
          'Have you explored other options?',
          'What\'s driving your timeline?',
          'How motivated are you on a scale of 1-10?',
        ],
        qualificationSignals: [
          'Clear problem articulated',
          'Real consequences',
          'Has explored alternatives',
          'Moderate to high motivation',
        ],
        warningSigns: [
          'No real problem',
          'Just curious',
          'Low motivation',
          'No urgency',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'What they\'ve tried or considered',
        questions: [
          'Have you tried listing it?',
          'Have you talked to other investors?',
          'What made you look beyond traditional options?',
          'Why does Subject-To seem like the right fit?',
        ],
        qualificationSignals: [
          'Has considered alternatives',
          'Understands why Subject-To fits',
          'Thoughtful comparison',
          'Educated buyer',
        ],
        warningSigns: [
          'Haven\'t considered alternatives',
          'Doesn\'t understand fit',
          'No comparison',
          'First thing they\'ve tried',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Understand what success looks like',
        questions: [
          'What does the ideal outcome look like?',
          'What\'s most important to you?',
          'What trade-offs are you willing to make?',
          'What would make you feel good about moving forward?',
        ],
        qualificationSignals: [
          'Clear outcome vision',
          'Understands trade-offs',
          'Realistic expectations',
          'Decision criteria clear',
        ],
        warningSigns: [
          'Unclear on outcome',
          'Unrealistic expectations',
          'Won\'t trade anything off',
          'No clear decision criteria',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Confirm understanding and comfort level',
        questions: [
          'What concerns do you have about Subject-To?',
          'What would you need to feel comfortable?',
          'What questions do you have?',
          'What would prevent you from moving forward?',
        ],
        qualificationSignals: [
          'Smart questions',
          'Specific concerns',
          'Seeking to understand',
          'Building trust',
        ],
        warningSigns: [
          'Can\'t articulate concerns',
          'Skeptical of everything',
          'Too eager without understanding',
          'Trust issues',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Educate and position properly',
        questions: [
          'Let me explain exactly how this works...',
          'Here are the benefits and considerations...',
          'This is how you\'re protected...',
          'What questions do you have?',
        ],
        qualificationSignals: [
          'Understands explanation',
          'Asks clarifying questions',
          'Sees fit for situation',
          'Ready to move forward',
        ],
        warningSigns: [
          'Can\'t follow explanation',
          'No questions',
          'Doesn\'t see fit',
          'Needs to think about it',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Research timeline, not urgent',
        'Planning ahead',
        'Want to make informed decision',
        'May have soft deadline',
      ],
      financial: [
        'May or may not have financial pressure',
        'Looking for best option',
        'Optimizing outcome',
        'Comparing alternatives',
      ],
      emotional: [
        'Analytical more than emotional',
        'Want to make smart decision',
        'Building confidence in approach',
        'Seeking validation',
      ],
      authority: [
        'Typically own authority',
        'May consult attorney',
        'Want expert validation',
        'Building confidence',
      ],
    },
    propertyLoanReality: {
      occupancy: ['Varies by situation', 'May be owner-occupied', 'May be rental', 'May be vacant'],
      condition: ['Varies', 'May be good or needs work', 'Depends on individual situation'],
      loanPresence: [
        'Has mortgage (requirement for Subject-To)',
        'Asking about loan specifics',
        'Understanding loan implications',
      ],
      paymentStatus: ['May be current', 'May be behind', 'Varies by prospect'],
      viability: [
        'Researching if it\'s right fit',
        'Learning about requirements',
        'Determining viability',
      ],
    },
    painMotivation: {
      corePain: [
        'Want to make educated decision',
        'Need to understand if this is right for situation',
        'Want to avoid mistakes',
        'Looking for best path forward',
      ],
      deepeningQuestions: [
        'What\'s the cost of making the wrong decision?',
        'What would the ideal solution look like?',
        'What\'s important to you beyond the financial outcome?',
        'What would you need to feel confident moving forward?',
      ],
      emotionalSignals: [
        'Thoughtful and analytical',
        'Asks good questions',
        'Seeks to understand',
        'Building trust through education',
      ],
      guidance:
        'Subject-To prospects are researchers. Be educational, not salesy. Build credibility through expertise. Answer questions thoroughly. They\'ll decide when informed.',
    },
    failedSolutions: {
      attempted: [
        'May have explored traditional listing',
        'May have talked to other investors',
        'Researching multiple options',
        'Doing due diligence',
      ],
      whyFailed: [
        'Looking for better fit',
        'Traditional doesn\'t meet needs',
        'Seeking alternative',
        'Subject-To seems to fit',
      ],
      remainingHope: 'Medium - seeking best option through research',
    },
    desiredOutcome: {
      successMeans: [
        'Make informed decision',
        'Choose right solution',
        'Optimize outcome',
        'Feel confident in choice',
      ],
      tradeOffs: [
        'Will trade-off if makes sense',
        'Wants to understand pros/cons',
        'Seeks optimal solution',
        'Values education',
      ],
      wantOffPlate: [
        'Uncertainty',
        'Making wrong choice',
        'Not understanding options',
        'Risk of poor outcome',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'What would make Subject-To the right choice for you?',
        'What concerns do you need addressed?',
        'What would you need to move forward confidently?',
        'How can I help you make the best decision?',
      ],
      lowOpennessGuidance:
        'If low openness, they may not be right fit for Subject-To. Explore if traditional option is better. Be honest about fit.',
    },
    likelyObjections: [
      {
        common: 'What about the due-on-sale clause?',
        protecting: 'Understanding risk',
        risk: 'Loan being called',
        controlQuestion:
          'Great question - let me explain how lenders actually respond and why this rarely happens...',
      },
      {
        common: 'How do I know you\'ll make the payments?',
        protecting: 'Credit and liability',
        risk: 'Default',
        controlQuestion:
          'Smart concern - let me show you exactly how this is structured and monitored...',
      },
      {
        common: 'What about my liability if something happens?',
        protecting: 'Future risk',
        risk: 'Liability exposure',
        controlQuestion:
          'Important question - here\'s how liability is addressed through insurance and structure...',
      },
      {
        common: 'Why would I do this instead of selling traditionally?',
        protecting: 'Optimizing outcome',
        risk: 'Leaving money on table',
        controlQuestion:
          'Let\'s compare both options side by side with real numbers...',
      },
    ],
    complianceSignals: [
      {
        signal: 'Agrees without questions',
        meaning: 'Not actually understanding, may have regrets',
      },
      {
        signal: 'Wants to move fast without due diligence',
        meaning: 'Red flag - slow them down',
      },
      {
        signal: 'Says yes to everything',
        meaning: 'Not thinking critically, may back out',
      },
    ],
    redFlags: [
      {
        flag: 'No real situation, just curious',
        impact: 'Tire kicker, waste of time',
      },
      {
        flag: 'Doesn\'t ask substantive questions',
        impact: 'Not engaged, won\'t follow through',
      },
      {
        flag: 'Subject-To doesn\'t fit their situation',
        impact: 'Wrong solution, be honest',
      },
      {
        flag: 'Too eager without understanding',
        impact: 'Will have regrets and problems later',
      },
    ],
    decisionStyles: [
      {
        name: 'Analytical Researcher',
        needs: [
          'Detailed explanation',
          'Documentation',
          'Comparison data',
          'Expert guidance',
          'Time to process',
        ],
        avoids: ['Pressure', 'Sales tactics', 'Incomplete information', 'Rush'],
      },
      {
        name: 'Validation Seeker',
        needs: ['Expert endorsement', 'Social proof', 'Attorney review', 'Confirmation'],
        avoids: ['Solo decision', 'Unvalidated approach', 'Risk'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'Due-on-sale will be called',
        innerDialogue:
          'Banks always call loans when they find out... (rare in reality)',
      },
      {
        belief: 'Unlimited liability',
        innerDialogue:
          'I\'ll be responsible forever... (not understanding protections)',
      },
      {
        belief: 'Too good to be true',
        innerDialogue:
          'This sounds like a scam... (skepticism without understanding)',
      },
      {
        belief: 'Traditional is safer',
        innerDialogue:
          'I should just list it normally... (not comparing actual pros/cons)',
      },
    ],
    dealStructures: [
      {
        name: 'Subject-To',
        bestFit: 'Primary interest and focus',
        primaryLever: 'Whatever their situation requires',
        whenNotToUse: 'If their situation doesn\'t actually fit Subject-To',
      },
      {
        name: 'Alternative structures',
        bestFit: 'If Subject-To not right fit',
        primaryLever: 'Depends on situation',
        whenNotToUse: 'Be honest about best fit',
      },
    ],
    transformation: {
      from: [
        'Researching options',
        'Uncertain about best path',
        'Need to understand approach',
        'Want to make informed decision',
      ],
      to: [
        'Educated on Subject-To',
        'Clear on pros and cons',
        'Confident in decision',
        'Ready to move forward or choose alternative',
      ],
    },
  },
  'creative-savvy': {
    coreQuestions: {
      whyNow: 'Sophisticated investor, knows creative finance, exploring opportunities',
      pressure: 'Low - opportunity-driven, not problem-driven',
      outcome: 'Optimize deal structure, maximize value, strategic positioning',
      failedSolutions: 'Not applicable - proactive not reactive',
      openness: 'Very High - speaks the language, wants to explore all options',
    },
    discoveryPhases: [
      {
        title: 'Context & Control',
        goal: 'Understand their sophistication level and objectives',
        questions: [
          'What\'s your experience with creative financing?',
          'What deals have you done in the past?',
          'What are you looking to accomplish?',
          'What\'s your investment thesis?',
          'What\'s your timeline and criteria?',
        ],
        qualificationSignals: [
          'Real experience with creative deals',
          'Clear investment thesis',
          'Knows what they want',
          'Professional approach',
        ],
        warningSigns: [
          'Claims expertise but doesn\'t have it',
          'Unrealistic expectations',
          'No clear criteria',
          'Overconfident without knowledge',
        ],
      },
      {
        title: 'Property & Loan Reality',
        goal: 'Understand deal specifics and structure preferences',
        questions: [
          'Tell me about the property',
          'What\'s the loan situation?',
          'What\'s your equity position and goals?',
          'What structure are you thinking?',
          'What\'s your expected ROI?',
        ],
        qualificationSignals: [
          'Knows numbers cold',
          'Has done analysis',
          'Clear on structure options',
          'Realistic expectations',
        ],
        warningSigns: [
          'Vague on numbers',
          'No analysis done',
          'Unrealistic ROI expectations',
          'Overconfident without data',
        ],
      },
      {
        title: 'Pain & Motivation Dig',
        goal: 'Understand strategic objectives',
        questions: [
          'What are you optimizing for?',
          'What\'s your portfolio strategy?',
          'What problem does this solve?',
          'What\'s your exit strategy?',
          'What\'s the opportunity cost of not doing this?',
        ],
        qualificationSignals: [
          'Clear strategy',
          'Portfolio-level thinking',
          'Understands opportunity cost',
          'Has exit plan',
        ],
        warningSigns: [
          'No clear strategy',
          'Deal chasing',
          'No exit plan',
          'Short-term thinking',
        ],
      },
      {
        title: 'Failed Solutions Check',
        goal: 'Understand why creative structure vs traditional',
        questions: [
          'Why creative financing vs traditional?',
          'What advantages do you see?',
          'What risks are you managing for?',
          'How does this fit your strategy?',
        ],
        qualificationSignals: [
          'Clear rationale',
          'Understands advantages',
          'Risk-aware',
          'Strategic fit clear',
        ],
        warningSigns: [
          'No clear reason',
          'Chasing trends',
          'Risk-unaware',
          'No strategic fit',
        ],
      },
      {
        title: 'Desired Outcome Clarity',
        goal: 'Define deal success criteria',
        questions: [
          'What defines a successful deal for you?',
          'What\'s your minimum required return?',
          'What structure optimizes your goals?',
          'What would make you walk away?',
        ],
        qualificationSignals: [
          'Clear success criteria',
          'Knows required returns',
          'Structure optimization clear',
          'Has walk-away conditions',
        ],
        warningSigns: [
          'No clear criteria',
          'Unrealistic returns',
          'Structure unclear',
          'No boundaries',
        ],
      },
      {
        title: 'Openness to Creative Solutions',
        goal: 'Explore structure options and variations',
        questions: [
          'What structures have you considered?',
          'What hybrid options interest you?',
          'What creative solutions fit this situation?',
          'What variations should we explore?',
        ],
        qualificationSignals: [
          'Familiar with options',
          'Interested in variations',
          'Thinks creatively',
          'Sophisticated',
        ],
        warningSigns: [
          'Knows one structure only',
          'Rigid thinking',
          'Not actually sophisticated',
          'Buzzword user',
        ],
      },
      {
        title: 'Subject-To Positioning (High-Level Only)',
        goal: 'Explore if Subject-To fits their strategy',
        questions: [
          'How does Subject-To fit your goals?',
          'What advantages do you see?',
          'What concerns do you have?',
          'How would you structure it?',
        ],
        qualificationSignals: [
          'Understands Subject-To',
          'Sees strategic fit',
          'Smart concerns',
          'Can structure creatively',
        ],
        warningSigns: [
          'Doesn\'t understand Subject-To',
          'No strategic fit',
          'Naive about risks',
          'Can\'t think through structure',
        ],
      },
    ],
    pressurePatterns: {
      time: [
        'Opportunity-driven',
        'Strategic timeline',
        'Portfolio planning',
        'Market timing considerations',
      ],
      financial: [
        'Optimizing returns',
        'Capital deployment',
        'Portfolio diversification',
        'Risk-adjusted returns',
      ],
      emotional: [
        'Strategic not emotional',
        'Professional approach',
        'Opportunity excitement',
        'Portfolio optimization',
      ],
      authority: [
        'Own decision authority',
        'May have partners',
        'Attorney and CPA involved',
        'Professional team',
      ],
    },
    propertyLoanReality: {
      occupancy: ['Varies by deal', 'Strategic consideration', 'Investment analysis'],
      condition: ['Analyzed vs strategy', 'Value-add opportunity assessed', 'Renovation budget clear'],
      loanPresence: [
        'Understands loan structures',
        'Analyzes terms',
        'Considers options',
        'Strategic leverage',
      ],
      paymentStatus: ['Depends on deal', 'Analyzes situation', 'Understands implications'],
      viability: [
        'Assesses all options',
        'Compares structures',
        'Optimizes approach',
        'Strategic fit',
      ],
    },
    painMotivation: {
      corePain: [
        'Want to deploy capital efficiently',
        'Seeking optimal structure',
        'Building strategic portfolio',
        'Maximizing risk-adjusted returns',
      ],
      deepeningQuestions: [
        'What does this deal do for your portfolio?',
        'How does this compare to other opportunities?',
        'What\'s the strategic value beyond ROI?',
        'What would make this a home run for you?',
      ],
      emotionalSignals: [
        'Professional and analytical',
        'Excitement about opportunity',
        'Strategic thinking visible',
        'Confident but questions',
      ],
      guidance:
        'Creative-savvy prospects are sophisticated partners. Speak their language. Focus on structure optimization and strategic value. Be consultative, not salesy.',
    },
    failedSolutions: {
      attempted: ['Not applicable', 'Proactive deal sourcing', 'Strategic opportunity'],
      whyFailed: ['Not applicable', 'Opportunity-driven not problem-driven'],
      remainingHope: 'N/A - opportunity focused',
    },
    desiredOutcome: {
      successMeans: [
        'Optimal deal structure',
        'Strategic portfolio fit',
        'Risk-adjusted returns',
        'Long-term value creation',
      ],
      tradeOffs: [
        'Will trade for strategic advantage',
        'Understands opportunity cost',
        'Thinks long-term',
        'Values structure optimization',
      ],
      wantOffPlate: [
        'Suboptimal structures',
        'Missed opportunities',
        'Inefficient capital deployment',
        'Strategic misalignment',
      ],
    },
    opennessToCreative: {
      bridgeQuestions: [
        'What structure optimizes your objectives?',
        'What creative variations should we explore?',
        'How can we structure this for maximum advantage?',
        'What would make this a perfect fit?',
      ],
      lowOpennessGuidance:
        'Should not exist - if present, may not be actually sophisticated. Verify knowledge level.',
    },
    likelyObjections: [
      {
        common: 'What\'s the catch?',
        protecting: 'Wants to understand all angles',
        risk: 'Hidden risks or costs',
        controlQuestion:
          'Great question - let\'s walk through the entire structure and all considerations...',
      },
      {
        common: 'How do you make money?',
        protecting: 'Wants transparent economics',
        risk: 'Being on wrong side of deal',
        controlQuestion:
          'Happy to share - here\'s how this works for both sides...',
      },
      {
        common: 'What about [specific technical concern]?',
        protecting: 'Due diligence',
        risk: 'Technical issues',
        controlQuestion:
          'Excellent question - let me address that specifically...',
      },
      {
        common: 'Why this vs [alternative structure]?',
        protecting: 'Optimization',
        risk: 'Suboptimal choice',
        controlQuestion:
          'Great comparison - let\'s analyze both side by side...',
      },
    ],
    complianceSignals: [
      {
        signal: 'Claims expertise but asks basic questions',
        meaning: 'May not be as sophisticated as claimed',
      },
      {
        signal: 'Agrees without due diligence',
        meaning: 'Not actually sophisticated',
      },
      {
        signal: 'Wants to move fast without analysis',
        meaning: 'Red flag - verify sophistication',
      },
    ],
    redFlags: [
      {
        flag: 'Claims expertise but lacks understanding',
        impact: 'Will have issues later',
      },
      {
        flag: 'No clear investment criteria',
        impact: 'Deal chaser, not strategic',
      },
      {
        flag: 'Unrealistic return expectations',
        impact: 'Not grounded in reality',
      },
      {
        flag: 'No team (attorney, CPA)',
        impact: 'May not be as sophisticated as claimed',
      },
    ],
    decisionStyles: [
      {
        name: 'Strategic Investor',
        needs: [
          'Complete analysis',
          'Structure optimization',
          'Team review',
          'Due diligence',
          'Strategic fit',
        ],
        avoids: ['Sales tactics', 'Pressure', 'Incomplete data', 'Suboptimal structure'],
      },
      {
        name: 'Deal Flow Professional',
        needs: ['Efficient process', 'Quick analysis', 'Clear terms', 'Speed when ready'],
        avoids: ['Waste of time', 'Inefficiency', 'Amateur approach'],
      },
    ],
    falseBeliefsAndStories: [
      {
        belief: 'I can get better terms elsewhere',
        innerDialogue:
          'Someone will offer better... (without analyzing actual market)',
      },
      {
        belief: 'I know more than I do',
        innerDialogue:
          'I\'ve got this figured out... (overconfidence)',
      },
      {
        belief: 'Speed is more important than strategy',
        innerDialogue:
          'I need to move fast... (ignoring due diligence)',
      },
    ],
    dealStructures: [
      {
        name: 'Subject-To',
        bestFit: 'If loan terms and strategy align',
        primaryLever: 'Leverage + control + cash flow optimization',
        whenNotToUse: 'If loan terms don\'t support strategy',
      },
      {
        name: 'Seller Finance',
        bestFit: 'If terms can be negotiated favorably',
        primaryLever: 'Creative structuring + favorable terms',
        whenNotToUse: 'If seller won\'t carry favorable terms',
      },
      {
        name: 'Hybrid Structures',
        bestFit: 'Often preferred for sophistication',
        primaryLever: 'Maximum optimization and flexibility',
        whenNotToUse: 'If complexity outweighs benefit',
      },
    ],
    transformation: {
      from: [
        'Seeking optimal deal structure',
        'Exploring opportunities',
        'Deploying capital strategically',
        'Building portfolio',
      ],
      to: [
        'Structured optimal deal',
        'Strategic portfolio addition',
        'Capital deployed efficiently',
        'Value maximized',
      ],
    },
  },
};

export const trainingUsage = {
  rolePlay: 'Use prospect type selector to practice different scenarios',
  objectionDrills: 'Study objection translations and practice control questions',
  dealMatching: 'Practice matching prospect types to optimal deal structures',
  confidenceCalibration: 'Review warning signs and red flags to improve qualification',
};
