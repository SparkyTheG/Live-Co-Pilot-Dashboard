export interface ObjectionHandling {
  id: string;
  sellerType: 'foreclosure' | 'tired-landlord' | 'probate-inherited';
  objectionText: string;
  probability: number;
  whatTheyreReallyAfraidOf: string;
  reframe: string;
  rebuttalScript: string;
  controlQuestion: string;
  whyItWorks: string[];
  advanceQuestion: string;
}

export const comprehensiveObjections: ObjectionHandling[] = [
  // FORECLOSURE SELLERS
  {
    id: 'fc-legal',
    sellerType: 'foreclosure',
    objectionText: 'Is this even legal?',
    probability: 85,
    whatTheyreReallyAfraidOf: 'Getting tricked, sued, or doing something "wrong"',
    reframe: 'Subject-To is not a loophole — it\'s a transfer of ownership, not a new loan',
    rebuttalScript: 'That\'s a fair question — and you should ask it. This isn\'t a new loan or anything hidden. Ownership transfers, but the loan itself doesn\'t change. Same lender, same payment, paid exactly as agreed. That\'s why this has worked for decades — because the bank keeps getting paid.',
    controlQuestion: 'Would you feel more comfortable if we walk through exactly how the loan stays protected?',
    whyItWorks: [
      'Validates their fear instead of dismissing it',
      'Removes mystery and complexity',
      'Shifts focus from legality to payment performance'
    ],
    advanceQuestion: 'Would it help if I showed you how the payment stays protected step by step?'
  },
  {
    id: 'fc-due-on-sale',
    sellerType: 'foreclosure',
    objectionText: 'What about the due-on-sale clause?',
    probability: 78,
    whatTheyreReallyAfraidOf: 'The bank calling the loan and ruining their life',
    reframe: 'Banks act on risk, not technical clauses',
    rebuttalScript: 'You\'re right — that clause exists. Banks include it to protect themselves if risk increases. In these cases, payments continue on time, insurance stays in place, and nothing changes from their perspective. That\'s why enforcement is extremely rare when loans stay current.',
    controlQuestion: 'If the payment stays current and insured, what would trigger the bank to step in?',
    whyItWorks: [
      'Acknowledges reality instead of avoiding it',
      'Explains why banks actually care',
      'Removes emotional exaggeration with logic'
    ],
    advanceQuestion: 'If the loan stays current and insured, what would realistically cause an issue?'
  },
  {
    id: 'fc-stop-paying',
    sellerType: 'foreclosure',
    objectionText: 'What if you stop paying?',
    probability: 92,
    whatTheyreReallyAfraidOf: 'Being burned or ending up worse than before',
    reframe: 'Risk already exists — Sub-To reduces it',
    rebuttalScript: 'That\'s the right concern to have. That\'s why we don\'t do handshake deals. Payments go through a licensed loan servicer, you can see every payment, and insurance stays in place naming you as additionally insured. You\'ll actually have more visibility than you do now.',
    controlQuestion: 'Would having proof of payment each month remove that worry?',
    whyItWorks: [
      'Doesn\'t get defensive about legitimate concern',
      'Adds structure and third-party protection',
      'Shifts risk perception with verifiable safeguards'
    ],
    advanceQuestion: 'If you could verify payments every month, would that solve that concern?'
  },

  // TIRED LANDLORD
  {
    id: 'tl-list-again',
    sellerType: 'tired-landlord',
    objectionText: 'I should just list it again',
    probability: 72,
    whatTheyreReallyAfraidOf: 'Making a permanent decision',
    reframe: 'Listing is hope — Sub-To is certainty',
    rebuttalScript: 'You absolutely can list it — and if it sells quickly at your number, that\'s great. The real question is what happens if it doesn\'t. This option gives you a guaranteed outcome without waiting and hoping.',
    controlQuestion: 'What\'s your plan if it doesn\'t sell again?',
    whyItWorks: [
      'Doesn\'t fight the listing option',
      'Introduces future-risk contrast',
      'Shifts focus to consequences of inaction'
    ],
    advanceQuestion: 'What\'s your backup plan if it doesn\'t sell this time either?'
  },
  {
    id: 'tl-need-cash',
    sellerType: 'tired-landlord',
    objectionText: 'I need cash to reinvest',
    probability: 68,
    whatTheyreReallyAfraidOf: 'Losing investment momentum and opportunity',
    reframe: 'Relief vs reinvestment — what costs more right now?',
    rebuttalScript: 'I hear you. The question is — how much is this property costing you every month in time, stress, and cash flow? Sometimes the best investment is getting out of what\'s draining you, so you can focus on what actually performs.',
    controlQuestion: 'If you freed up all the time and energy this property takes, what would that be worth?',
    whyItWorks: [
      'Reframes cash need as opportunity cost',
      'Acknowledges their investor mindset',
      'Redirects to emotional and time ROI'
    ],
    advanceQuestion: 'Between waiting for cash and ending the stress now, which moves you forward faster?'
  },
  {
    id: 'tl-too-good',
    sellerType: 'tired-landlord',
    objectionText: 'This sounds too good to be true',
    probability: 75,
    whatTheyreReallyAfraidOf: 'Hidden downside or being scammed',
    reframe: 'Unfamiliar ≠ risky',
    rebuttalScript: 'I hear that a lot — especially from people who\'ve tried the traditional routes already. This isn\'t better for everyone. It\'s better for people who value certainty and relief more than squeezing every dollar out of the sale.',
    controlQuestion: 'Which matters more for you right now — certainty or maximizing price?',
    whyItWorks: [
      'Removes hype and overselling',
      'Disqualifies instead of convincing',
      'Builds authority through honesty'
    ],
    advanceQuestion: 'Which matters more for you right now — maximizing price or removing this burden?'
  },

  // PROBATE / INHERITED
  {
    id: 'pi-honor-house',
    sellerType: 'probate-inherited',
    objectionText: 'I need to honor the house / memory',
    probability: 81,
    whatTheyreReallyAfraidOf: 'Feeling guilty about letting go or dishonoring family',
    reframe: 'Honoring them means taking care of yourself',
    rebuttalScript: 'I completely understand that. The best way to honor their memory is by making a decision that gives you peace and removes the burden they wouldn\'t want you to carry. This house is becoming a source of stress, not comfort. That\'s not what they would have wanted for you.',
    controlQuestion: 'If they could see the weight this is putting on you, what would they want you to do?',
    whyItWorks: [
      'Validates emotional attachment',
      'Reframes guilt as permission',
      'Shifts from house to their wellbeing'
    ],
    advanceQuestion: 'What would make this feel handled and resolved in a way you could feel good about?'
  },
  {
    id: 'pi-too-complicated',
    sellerType: 'probate-inherited',
    objectionText: 'This is too complicated',
    probability: 77,
    whatTheyreReallyAfraidOf: 'Making a mistake or getting overwhelmed',
    reframe: 'Complicated now = simple later',
    rebuttalScript: 'It can feel that way at first — and that\'s actually why we handle everything. You don\'t need to understand every detail. You just need to know: we take over the property, handle any issues, and close when probate allows. Simple outcome, even if the paperwork isn\'t.',
    controlQuestion: 'If someone else handled all the details, would you feel more comfortable?',
    whyItWorks: [
      'Acknowledges feeling without reinforcing it',
      'Offers to remove complexity burden',
      'Focuses on outcome, not process'
    ],
    advanceQuestion: 'What would this need to look like for you to feel confident moving forward?'
  },
  {
    id: 'pi-lawyer-said-no',
    sellerType: 'probate-inherited',
    objectionText: 'My friend / lawyer said not to do this',
    probability: 70,
    whatTheyreReallyAfraidOf: 'Social judgment and authority conflict',
    reframe: 'Advisors default to what they understand',
    rebuttalScript: 'That makes sense — most professionals don\'t see these unless they deal with distressed or creative transactions regularly. That\'s why everything is done through title, with written disclosures and servicers — so anyone advising you can review it clearly.',
    controlQuestion: 'Would it help if your attorney reviewed the exact paperwork before you decide?',
    whyItWorks: [
      'Respects outside authority without backing down',
      'Keeps control of the conversation',
      'Invites transparency and professional review'
    ],
    advanceQuestion: 'Would you want them reviewing the paperwork before making a final decision?'
  }
];

export const getObjectionsBySellerType = (sellerType: 'foreclosure' | 'tired-landlord' | 'probate-inherited') => {
  return comprehensiveObjections.filter(obj => obj.sellerType === sellerType);
};

export const getAllObjections = () => {
  return comprehensiveObjections;
};

export const getObjectionById = (id: string) => {
  return comprehensiveObjections.find(obj => obj.id === id);
};
