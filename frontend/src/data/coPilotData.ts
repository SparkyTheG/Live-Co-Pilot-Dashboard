export type StrategyType =
  | 'lease-purchase'
  | 'subject-to'
  | 'seller-finance';

export interface StrategyOption {
  id: StrategyType;
  label: string;
  shortLabel: string;
}

export type ProspectType =
  | 'creative-seller-financing'
  | 'distressed-landlord'
  | 'performing-tired-landlord'
  | 'foreclosure'
  | 'cash-equity-seller';

export interface ProspectTypeOption {
  id: ProspectType;
  label: string;
  shortLabel: string;
}

export interface LubometerInterpretation {
  low: string;
  medium: string;
  high: string;
}

export interface ProspectQuotes {
  urgency: string;
  trust: string;
  authority: string;
  structure: string;
}

export interface HotButtons {
  pain1: string;
  pain2: string;
  desire: string;
}

export interface ObjectionExample {
  objection: string;
  fear: string;
  whisper: string;
}

export interface TruthSignals {
  signals: string[];
  redFlags: string[];
}

export interface ProspectTypeData {
  lubometer: LubometerInterpretation;
  prospectQuotes: ProspectQuotes;
  hotButtons: HotButtons;
  objections: ObjectionExample[];
  truthIndex: TruthSignals;
}

export interface StrategyData {
  lubometer: LubometerInterpretation;
  hotButtons: HotButtons;
  objections: ObjectionExample[];
  scripts: {
    intro: string;
    mainPitch: string;
    close: string;
  };
}

export const strategyOptions: StrategyOption[] = [
  {
    id: 'lease-purchase',
    label: 'Lease Purchase',
    shortLabel: 'Lease Purchase'
  },
  {
    id: 'subject-to',
    label: 'Subject-To',
    shortLabel: 'Subject-To'
  },
  {
    id: 'seller-finance',
    label: 'Seller Finance',
    shortLabel: 'Seller Finance'
  }
];

export const prospectTypes: ProspectTypeOption[] = [
  {
    id: 'creative-seller-financing',
    label: 'Creative Seller Financing (Sub-To / Seller Carry)',
    shortLabel: 'Creative SF'
  },
  {
    id: 'distressed-landlord',
    label: 'Distressed Landlord',
    shortLabel: 'Distressed LL'
  },
  {
    id: 'performing-tired-landlord',
    label: 'Performing / Tired Landlord',
    shortLabel: 'Tired LL'
  },
  {
    id: 'foreclosure',
    label: 'Pre-Foreclosure / Foreclosure',
    shortLabel: 'Foreclosure'
  },
  {
    id: 'cash-equity-seller',
    label: 'Cash / Equity Seller',
    shortLabel: 'Cash Seller'
  }
];

export const prospectTypeData: Record<ProspectType, ProspectTypeData> = {
  'creative-seller-financing': {
    lubometer: {
      low: 'Curious but fearful, needs safety framing',
      medium: 'Understands relief, still worried about liability',
      high: 'Ready for structure discussion'
    },
    prospectQuotes: {
      urgency: '"I\'m falling behind on payments and I\'m scared of foreclosure"',
      trust: '"What if you just stop paying the mortgage?"',
      authority: '"I need to talk to my wife about this before deciding"',
      structure: '"I don\'t understand how you can take over my loan"'
    },
    hotButtons: {
      pain1: '"I\'m falling behind on payments and terrified of foreclosure"',
      pain2: '"I can\'t afford the house anymore but I don\'t want to ruin my credit"',
      desire: '"I just need relief from this monthly payment stress"'
    },
    objections: [
      {
        objection: 'What if you stop paying?',
        fear: 'Long-term liability',
        whisper: 'Emphasize servicing + control'
      }
    ],
    truthIndex: {
      signals: [
        'Shares loan details',
        'Asks servicing questions'
      ],
      redFlags: [
        "Won't share mortgage",
        'Avoids liability talk'
      ]
    }
  },
  'distressed-landlord': {
    lubometer: {
      low: 'Overwhelmed, ashamed, avoiding reality',
      medium: 'Acknowledges failure, open to alternatives',
      high: 'Wants out, prioritizes relief over price'
    },
    prospectQuotes: {
      urgency: '"This property is bleeding me dry every month"',
      trust: '"I\'ve been burned by investors before"',
      authority: '"My business partner needs to approve any deal"',
      structure: '"I just want to be done with this nightmare"'
    },
    hotButtons: {
      pain1: '"This property is bleeding me dry every single month"',
      pain2: '"I can\'t take another 3am emergency repair call"',
      desire: '"I just want to be done with this nightmare and move on"'
    },
    objections: [
      {
        objection: "I've tried this before",
        fear: 'Repeating failure',
        whisper: 'Contrast old vs new risk'
      }
    ],
    truthIndex: {
      signals: [
        'Admits exhaustion',
        'Willing to disclose numbers'
      ],
      redFlags: [
        'Blames tenants only',
        'Refuses financial reality'
      ]
    }
  },
  'performing-tired-landlord': {
    lubometer: {
      low: 'Defensive, attached to income',
      medium: 'Fatigued, testing options',
      high: 'Ready to trade yield for peace'
    },
    prospectQuotes: {
      urgency: '"I\'m exhausted from dealing with tenant calls at midnight"',
      trust: '"How do I know I\'m getting a fair deal?"',
      authority: '"My wife has been begging me to sell this for years"',
      structure: '"I need the monthly income to cover my retirement"'
    },
    hotButtons: {
      pain1: '"I\'m exhausted from dealing with tenant calls at midnight"',
      pain2: '"My wife has been begging me to sell for years, it\'s affecting our marriage"',
      desire: '"I want my weekends back and peace of mind in retirement"'
    },
    objections: [
      {
        objection: "I'm still making money",
        fear: 'Losing steady income',
        whisper: 'Acknowledge value, pivot to freedom'
      }
    ],
    truthIndex: {
      signals: [
        'Discusses time cost',
        'Open about fatigue'
      ],
      redFlags: [
        'Only focused on rent',
        'Dismisses stress impact'
      ]
    }
  },
  'foreclosure': {
    lubometer: {
      low: 'Panic, paralysis, distrust',
      medium: 'Accepts urgency, needs clarity',
      high: 'Focused, deadline-driven'
    },
    prospectQuotes: {
      urgency: '"The auction is in 3 weeks and I don\'t know what to do"',
      trust: '"How do I know you\'re not trying to scam me?"',
      authority: '"My kids are telling me not to trust anyone"',
      structure: '"I\'ll do anything to save my credit and not lose everything"'
    },
    hotButtons: {
      pain1: '"The auction is in 3 weeks and I\'m terrified of losing everything"',
      pain2: '"I can\'t sleep at night thinking about my family being homeless"',
      desire: '"I just want to save my credit and protect my family from this disaster"'
    },
    objections: [
      {
        objection: "I don't understand any of this",
        fear: 'Losing control',
        whisper: 'Slow down, simplify'
      }
    ],
    truthIndex: {
      signals: [
        'Shares notice dates',
        'Stops deflecting'
      ],
      redFlags: [
        'Magical delay thinking',
        'Avoids deadline clarity'
      ]
    }
  },
  'cash-equity-seller': {
    lubometer: {
      low: 'Shopping offers',
      medium: 'Comparing speed vs price',
      high: 'Clear exit criteria'
    },
    prospectQuotes: {
      urgency: '"I need to close by end of month to buy my next property"',
      trust: '"Can you actually close this fast or is this just talk?"',
      authority: '"I make my own decisions, I don\'t need anyone\'s approval"',
      structure: '"I only want cash, no creative financing stuff"'
    },
    hotButtons: {
      pain1: '"I need to close by end of month or I\'ll lose my next deal"',
      pain2: '"Every day this sits on the market costs me money and opportunity"',
      desire: '"I want certainty and speed so I can move on to my next investment"'
    },
    objections: [
      {
        objection: 'Your price is low',
        fear: 'Leaving money',
        whisper: 'Re-anchor on speed'
      }
    ],
    truthIndex: {
      signals: [
        'States clear bottom line',
        'Direct about timeline'
      ],
      redFlags: [
        'Endless shopping',
        'No commitment criteria'
      ]
    }
  }
};

export const strategyData: Record<StrategyType, StrategyData> = {
  'lease-purchase': {
    lubometer: {
      low: 'Skeptical about rent credits and long-term commitment',
      medium: 'Understands structure, worried about qualification timeline',
      high: 'Ready to move forward, sees path to ownership'
    },
    hotButtons: {
      pain1: '"I want to own but banks keep rejecting me"',
      pain2: '"I\'m tired of wasting money on rent with nothing to show for it"',
      desire: '"I want to build equity and stability for my family"'
    },
    objections: [
      {
        objection: 'What if I can\'t qualify at the end?',
        fear: 'Wasting time and money with no ownership',
        whisper: 'Emphasize credit repair support and extended timelines'
      },
      {
        objection: 'How do rent credits work?',
        fear: 'Getting cheated or losing money',
        whisper: 'Show clear documentation and third-party escrow'
      },
      {
        objection: 'What if the market crashes?',
        fear: 'Locked into overpriced property',
        whisper: 'Frame it as locked-in pricing advantage'
      }
    ],
    scripts: {
      intro: 'This program is designed for people who want to own but need time to qualify. You move in, build equity through rent credits, and we help you qualify for traditional financing.',
      mainPitch: 'Every month, a portion of your rent goes toward your down payment. Meanwhile, we connect you with credit specialists who help you qualify. You\'re not just renting—you\'re building toward ownership.',
      close: 'If you\'re ready to stop renting and start building equity, we can get you moved in within 30 days and on the path to ownership. Does that timeline work for you?'
    }
  },
  'subject-to': {
    lubometer: {
      low: 'Fearful about liability and due-on-sale clause',
      medium: 'Understands relief, still worried about long-term risk',
      high: 'Ready to transfer ownership and walk away'
    },
    hotButtons: {
      pain1: '"I\'m falling behind on payments and terrified of foreclosure"',
      pain2: '"I can\'t afford this house anymore but don\'t want to destroy my credit"',
      desire: '"I need relief from this payment stress immediately"'
    },
    objections: [
      {
        objection: 'What if you stop paying?',
        fear: 'Foreclosure and credit destruction',
        whisper: 'Show loan servicing and payment tracking system'
      },
      {
        objection: 'Is this legal?',
        fear: 'Getting sued or scammed',
        whisper: 'Explain deed transfer with title company and attorney review'
      },
      {
        objection: 'What about the due-on-sale clause?',
        fear: 'Bank calling the loan',
        whisper: 'Explain that banks care about payments, not ownership transfers'
      }
    ],
    scripts: {
      intro: 'This solution is for homeowners who need relief from mortgage payments but want to protect their credit. We take over your loan and make payments while you walk away debt-free.',
      mainPitch: 'The deed transfers to us, but the loan stays in your name temporarily. We make every payment through a licensed servicer—you can see proof monthly. Your credit is protected, and you get immediate relief.',
      close: 'If you\'re ready to stop the stress and protect your credit, we can start the paperwork this week and have you free of this burden within 30 days. Sound good?'
    }
  },
  'seller-finance': {
    lubometer: {
      low: 'Worried about buyer default and payment security',
      medium: 'Interested in monthly income, concerned about documentation',
      high: 'Ready to carry note with proper protections'
    },
    hotButtons: {
      pain1: '"I need monthly income but can\'t wait for a traditional sale"',
      pain2: '"I don\'t want to pay massive capital gains taxes"',
      desire: '"I want steady income and a secured investment"'
    },
    objections: [
      {
        objection: 'What if they stop paying?',
        fear: 'Lengthy foreclosure and legal costs',
        whisper: 'Explain note servicing and foreclosure protection'
      },
      {
        objection: 'How do I know they\'ll qualify?',
        fear: 'Selling to unqualified buyer',
        whisper: 'Show buyer vetting process and down payment requirement'
      },
      {
        objection: 'What about taxes?',
        fear: 'IRS penalties or complications',
        whisper: 'Frame installment sale benefits with CPA consultation'
      }
    ],
    scripts: {
      intro: 'This structure lets you sell the property while carrying the financing yourself. You become the bank, earn interest, and defer capital gains while we make monthly payments.',
      mainPitch: 'You get a substantial down payment upfront, monthly income with interest, and tax advantages through an installment sale. Everything is secured by a deed of trust—your property is protected.',
      close: 'If you\'re ready to turn your equity into steady income with tax benefits, we can get the paperwork started this week and have your first payment within 30 days. Ready to move forward?'
    }
  }
};
