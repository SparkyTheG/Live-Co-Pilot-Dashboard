import { ProspectType } from './coPilotData';

export interface DiagnosticQuestion {
  question: string;
  why: string;
  category: 'situation' | 'timeline' | 'authority' | 'pain' | 'financial';
}

export const diagnosticQuestions: Record<ProspectType, DiagnosticQuestion[]> = {
  'creative-seller-financing': [
    {
      question: 'How many months behind are you on payments?',
      why: 'Determines urgency and foreclosure timeline',
      category: 'timeline'
    },
    {
      question: 'What is your current loan balance and monthly payment?',
      why: 'Required for Sub-To structuring',
      category: 'financial'
    },
    {
      question: 'Why did you fall behind? (job loss, medical, divorce, business failure)',
      why: 'Reveals emotional drivers and recovery likelihood',
      category: 'pain'
    },
    {
      question: 'Have you received any foreclosure notices? What date is the auction?',
      why: 'Establishes deadline and urgency level',
      category: 'timeline'
    },
    {
      question: 'Are there any other liens, judgments, or HOA issues on the property?',
      why: 'Uncovers hidden deal-killers',
      category: 'financial'
    },
    {
      question: 'Who else needs to be involved in this decision?',
      why: 'Identifies authority and potential blockers',
      category: 'authority'
    },
    {
      question: 'What would happen if you lost this property?',
      why: 'Amplifies pain and commitment to solving',
      category: 'pain'
    },
    {
      question: 'Have you tried listing with an agent or getting other offers?',
      why: 'Gauges sophistication and comparison mindset',
      category: 'situation'
    }
  ],

  'distressed-landlord': [
    {
      question: 'How long have you been a landlord?',
      why: 'Determines if this is burnout vs. temporary problem',
      category: 'situation'
    },
    {
      question: 'How many properties do you own?',
      why: 'Identifies if they\'re exiting entirely or trimming portfolio',
      category: 'situation'
    },
    {
      question: 'What is the current tenant situation? (problem tenants, vacancy, eviction)',
      why: 'Reveals immediate pain level',
      category: 'pain'
    },
    {
      question: 'How much negative cash flow are you experiencing per month?',
      why: 'Quantifies financial pain and urgency',
      category: 'financial'
    },
    {
      question: 'What was the specific incident that made you say "I\'m done"?',
      why: 'Uncovers emotional breaking point',
      category: 'pain'
    },
    {
      question: 'What condition is the property in? Any deferred maintenance?',
      why: 'Assesses repair burden and motivation to exit',
      category: 'situation'
    },
    {
      question: 'Are you managing this yourself or using a property manager?',
      why: 'Reveals time burden and control issues',
      category: 'situation'
    },
    {
      question: 'Have you tried to fix this property or situation before? What happened?',
      why: 'Identifies exhaustion and commitment to exit',
      category: 'pain'
    }
  ],

  'performing-tired-landlord': [
    {
      question: 'How long have you been in the landlord business?',
      why: 'Determines depth of fatigue and commitment',
      category: 'situation'
    },
    {
      question: 'What is your current monthly cash flow on this property?',
      why: 'Establishes the trade-off they\'re considering',
      category: 'financial'
    },
    {
      question: 'What triggered you to consider selling now?',
      why: 'Uncovers the hidden pain behind "tired"',
      category: 'pain'
    },
    {
      question: 'How much time do you spend managing this property per month?',
      why: 'Quantifies the life-cost vs. income',
      category: 'pain'
    },
    {
      question: 'What would you do with your time if you didn\'t have this property?',
      why: 'Paints the freedom picture',
      category: 'pain'
    },
    {
      question: 'Does your spouse/partner want you to sell?',
      why: 'Reveals relationship pressure and authority',
      category: 'authority'
    },
    {
      question: 'If you could trade the monthly income for total freedom today, would you?',
      why: 'Tests true motivation level',
      category: 'pain'
    },
    {
      question: 'Have you calculated what your time is worth versus the rental income?',
      why: 'Re-frames the economics to support exit',
      category: 'financial'
    }
  ],

  'foreclosure': [
    {
      question: 'How many days until your auction date?',
      why: 'Establishes the critical timeline',
      category: 'timeline'
    },
    {
      question: 'What is your loan balance versus current property value?',
      why: 'Determines equity position and options',
      category: 'financial'
    },
    {
      question: 'How many months behind are you on payments?',
      why: 'Quantifies the hole and catch-up feasibility',
      category: 'financial'
    },
    {
      question: 'Why did this happen? (job loss, medical, divorce, etc.)',
      why: 'Reveals if situation is temporary or permanent',
      category: 'pain'
    },
    {
      question: 'Have you talked to your lender about options?',
      why: 'Identifies sophistication and desperation level',
      category: 'situation'
    },
    {
      question: 'Is your family still living in the property?',
      why: 'Amplifies emotional pain and urgency',
      category: 'pain'
    },
    {
      question: 'What happens to you and your family if this goes to auction?',
      why: 'Drives commitment to solution',
      category: 'pain'
    },
    {
      question: 'Who else is involved in this decision?',
      why: 'Uncovers authority and potential interference',
      category: 'authority'
    },
    {
      question: 'Have you listed the property with an agent or gotten other offers?',
      why: 'Tests if they understand timeline reality',
      category: 'situation'
    }
  ],

  'cash-equity-seller': [
    {
      question: 'What is your timeline for selling?',
      why: 'Determines if speed is a lever',
      category: 'timeline'
    },
    {
      question: 'Why are you selling right now?',
      why: 'Uncovers motivation beyond just price',
      category: 'pain'
    },
    {
      question: 'What is your bottom-line number to sell?',
      why: 'Tests if they\'re realistic and qualified',
      category: 'financial'
    },
    {
      question: 'Have you already purchased your next property or have a time-sensitive need?',
      why: 'Reveals hidden urgency',
      category: 'timeline'
    },
    {
      question: 'What other offers have you received?',
      why: 'Gauges competition and price expectations',
      category: 'situation'
    },
    {
      question: 'What would it take for you to commit today?',
      why: 'Tests closing readiness',
      category: 'authority'
    },
    {
      question: 'Is there anyone else involved in this decision?',
      why: 'Identifies authority and blockers',
      category: 'authority'
    },
    {
      question: 'Would you accept a slightly lower price for a guaranteed close in 7 days?',
      why: 'Tests speed vs. price trade-off',
      category: 'financial'
    }
  ]
};
