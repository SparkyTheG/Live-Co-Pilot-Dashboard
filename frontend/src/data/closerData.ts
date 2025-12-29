import { CloserProfile } from '../types';

export const closerProfile: CloserProfile = {
  name: "Marcus Reynolds",
  photo: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
  company: "Elite Performance Academy",
  title: "Senior High-Ticket Closer",
  successCallCount: 5,
  difficultCallCount: 5,
  biggestFrustrations: [
    "'I need to think about it' stalls (decision-making avoidance)",
    "It's too expensive / budget concerns",
    "I need to talk to my spouse/partner before deciding",
    "'I've tried something similar and it didn't work' (burned in the past)",
    "Nervous / scared / concerned (fear-based hesitation)",
    "'I need more information' / proposal / research",
    "'Money is not available now' / funds need to be transferred"
  ],
  offer: {
    coreTransformation: "From stressed, overwhelmed entrepreneur stuck at $5-10K/month → Confident 6-figure business owner with systems, clarity, and predictable revenue",
    painfulProblems: [
      "Financial / business stagnation",
      "Lack of clarity or direction",
      "Overwhelm, inconsistency, procrastination",
      "Confidence / identity issues",
      "Fear-based avoidance"
    ],
    commonSymptoms: [
      "Feeling stuck after trying multiple things",
      "Embarrassment about current results",
      "Fear they will never change",
      "Lack of accountability",
      "Working hard but not seeing results",
      "Comparing themselves to others who are succeeding"
    ],
    targetAudience: {
      demographics: "Ages 32-48, Income $50K-$150K, Coaches, Consultants, Service Providers",
      identityTraits: [
        "Ambitious but overwhelmed",
        "Analytical thinkers",
        "Values-driven",
        "Growth-oriented",
        "Spiritual or personal development focused"
      ],
      decisionMakingBehavior: "Tends to over-research, seeks validation from spouse/partner, needs to 'feel right' about the decision, wants proof it will work for their specific situation",
      emotionalTriggers: [
        "Fear of staying stuck",
        "Desire to prove themselves",
        "Need to provide for family",
        "Regret about wasted time",
        "Longing for freedom and flexibility"
      ]
    },
    buyerBeliefs: [
      "I should be further along by now",
      "I know I can do more",
      "I'm tired of doing this alone",
      "There's something I'm missing",
      "I've invested so much already, I can't give up now"
    ],
    differentiation: [
      "Done-with-you implementation (not just training)",
      "Weekly accountability & private coaching",
      "Proprietary revenue acceleration framework",
      "Small cohorts (max 10 clients) for personalized attention",
      "90-day results guarantee"
    ],
    falseBeliefsLimitingStories: [
      "I need more time to prepare",
      "My situation is different / unique",
      "I can figure this out on my own",
      "I need to save up more money first",
      "I'm not ready yet",
      "What if I fail again?"
    ],
    priceTiers: [
      {
        name: "Foundation",
        price: 4997,
        description: "Self-paced program with group support",
        deliverables: [
          "12-week video training program",
          "Weekly group coaching calls",
          "Private community access",
          "Email support",
          "Revenue acceleration workbook"
        ]
      },
      {
        name: "Accelerator",
        price: 9997,
        description: "Done-with-you implementation with weekly coaching",
        deliverables: [
          "Everything in Foundation",
          "Bi-weekly 1:1 coaching (6 sessions)",
          "Custom business audit & strategy session",
          "Priority support (24-hour response)",
          "Bonus: Sales script templates"
        ]
      },
      {
        name: "Elite",
        price: 15997,
        description: "VIP intensive with private implementation support",
        deliverables: [
          "Everything in Accelerator",
          "Weekly 1:1 coaching (12 sessions)",
          "2-day intensive strategy session",
          "Direct access via private Slack",
          "Bonus: Done-for-you funnel build",
          "Bonus: 90-day extended support"
        ]
      }
    ],
    discountsAndBonuses: {
      fastActionBonuses: [
        "Enroll today: Free 2-day live workshop ($2,000 value)",
        "First 5 clients: Private mastermind dinner with Marcus",
        "Pay in full: Additional $1,000 off + VIP onboarding call"
      ],
      discountTypes: [
        "Pay in full: Save $1,000",
        "Referral discount: $500 off for each referred client who joins",
        "Early bird (7 days before cohort): $750 off"
      ],
      bundles: [
        "Bring a partner: 2 for $24,997 (normally $31,994)",
        "Annual membership: 12 months for price of 10"
      ],
      limitedTimeOffers: [
        "Next cohort starts in 14 days (only 3 spots left)",
        "Pricing increases $2,000 on January 1st",
        "Bonuses expire 48 hours after this call"
      ]
    },
    paymentOptions: [
      "Pay in Full (save $1,000)",
      "3-month payment plan ($500/month more)",
      "6-month payment plan ($800/month more)",
      "50% deposit + 2 payments",
      "Credit line assistance available"
    ],
    deliveryTimeline: {
      startTime: "Program begins within 7-14 days of enrollment",
      duration: "12-week core program + 30-day integration period",
      firstResultMilestone: "First revenue increase within 21-30 days of implementation"
    }
  },
  truthIndexInsights: {
    pleaserSignals: [
      "Quick 'yes' responses without pause or consideration",
      "Over-complimenting me or the program",
      "Mirroring my energy and enthusiasm artificially",
      "Avoiding direct questions about price or commitment",
      "Saying 'everything sounds great!' without asking deeper questions",
      "Agreeing to everything but showing inconsistent body language",
      "Extreme politeness or deferential behavior"
    ],
    redFlags: [
      "Quick, overly positive agreements without substance",
      "Inconsistent answers to similar questions",
      "Avoiding talking about money or budget reality",
      "Avoiding past failures or difficult topics",
      "Talking excessively to distract from answering directly",
      "No emotional depth when discussing pain points",
      "Can't articulate specific desired outcomes"
    ]
  },
  decisionMakingStyles: [
    "Slow, analytical thinkers (need to process and research)",
    "Emotion-first buyers (need to feel it's right)",
    "'Let me talk to my spouse/partner' buyers",
    "Buyers needing external validation (proof, testimonials, references)",
    "Logic-first buyers (need ROI calculations and guarantees)"
  ]
};
