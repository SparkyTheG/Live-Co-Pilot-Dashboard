import { Objection, PsychologicalDial, RedFlag, LubometerTier, CustomerProfile } from '../types';

export const CUSTOMER_NAME = "Alexandra Sterling";

export const customerProfile: CustomerProfile = {
  name: "Alexandra Sterling",
  photo: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
  status: "Prospect",
  crmData: {
    company: "Sterling Ventures LLC",
    title: "Founder & CEO",
    email: "alexandra@sterlingventures.com",
    phone: "+1 (555) 234-5678",
    location: "Austin, TX",
    linkedIn: "linkedin.com/in/alexandrasterling",
    source: "Webinar - Q4 Leadership Series",
    dealValue: 15997,
    lastContact: "2025-11-15"
  },
  calls: [
    {
      id: "1",
      type: "Intro Call",
      date: "2025-11-10",
      duration: "28:45",
      status: "analyzed",
    },
    {
      id: "2",
      type: "Close",
      date: "2025-11-15",
      duration: "42:18",
      status: "analyzed",
    },
    {
      id: "3",
      type: "Follow Up",
      date: "2025-11-18",
      duration: "0:00",
      status: "pending",
    }
  ]
};

export const objections: Objection[] = [
  { id: '1', text: 'I need to think about it', probability: 78 },
  { id: '2', text: "It's too expensive", probability: 72 },
  { id: '3', text: 'I need to talk to my therapist first', probability: 65 },
  { id: '4', text: "What if it doesn't work for me?", probability: 58 },
  { id: '5', text: 'Can I start next month instead?', probability: 45 },
];

export const psychologicalDials: PsychologicalDial[] = [
  { name: 'Validation Seeker', intensity: 94, color: 'from-fuchsia-500 to-pink-500' },
  { name: 'Status Conscious', intensity: 87, color: 'from-cyan-500 to-blue-500' },
  { name: 'Fear of Missing Out', intensity: 82, color: 'from-rose-500 to-pink-500' },
  { name: 'Control Oriented', intensity: 76, color: 'from-blue-500 to-indigo-500' },
  { name: 'Analytical Thinker', intensity: 71, color: 'from-emerald-500 to-teal-500' },
];

export const redFlags: RedFlag[] = [
  { text: 'Mentions recent divorce (6 months) - emotional volatility possible', severity: 'medium' },
  { text: 'Self-reported history of incomplete programs', severity: 'low' },
];

export const lubometerTiers: LubometerTier[] = [
  { price: 2997, readiness: 82, label: 'Starter' },
  { price: 7997, readiness: 70, label: 'Professional' },
  { price: 15997, readiness: 60, label: 'Elite' },
];

export const objectionScripts: Record<string, any> = {
  '1': {
    title: '"I need to think about it"',
    dialTrigger: 'Validation Seeker + Status Conscious',
    truthLevel: 78,
    moneyStyle: 'Investment-minded, seeks premium solutions',
    steps: [
      {
        step: 1,
        text: `${CUSTOMER_NAME}, I totally get that… and thank you for being honest with me.`,
        pause: '1s',
      },
      {
        step: 2,
        text: `Based on what you shared earlier — especially when you mentioned feeling stuck in that pattern of starting things but not finishing — this isn't really about needing time to think. It's about whether you truly believe this is the solution that will finally break that cycle.`,
        pause: '1.5s',
      },
      {
        step: 3,
        text: `So let me ask you this directly… if that fear of repeating the past wasn't there, would this be the right solution for you?`,
        pause: '2s',
        note: 'Wait for response - this is the pivot moment',
      },
      {
        step: 4,
        text: `And here's why I'm asking: people who are Validation Seekers like yourself — and I mean that as a strength — tend to overthink decisions because they're afraid of making the "wrong" choice and having others judge them for it.`,
        pause: '1s',
      },
      {
        step: 5,
        text: `But ${CUSTOMER_NAME}, every successful person you admire made decisions quickly and adjusted along the way. That's how you build the kind of life that gets validation naturally — not by waiting for perfect certainty, but by taking decisive action.`,
        pause: '1.5s',
      },
      {
        step: 6,
        text: `The Starter package at $2,997 — which your profile shows 82% readiness for — isn't just a purchase. It's a statement about who you're becoming. And that statement starts today, not "when you've thought about it."`,
        pause: '1s',
      },
      {
        step: 7,
        text: `So what do you say? Are you ready to make that decision right now and start this transformation?`,
        note: 'Close with assumptive tone - lean forward slightly',
      },
    ],
  },
  '2': {
    title: '"It\'s too expensive"',
    dialTrigger: 'Status Conscious + Investment-minded',
    truthLevel: 78,
    moneyStyle: 'Has capital, questions ROI',
    steps: [
      {
        step: 1,
        text: `I appreciate you being direct about that, ${CUSTOMER_NAME}.`,
        pause: '1s',
      },
      {
        step: 2,
        text: `And you know what? You're right — $15,997 is expensive. It's supposed to be. Because what we're talking about isn't a cost… it's an investment in the version of yourself who doesn't have to worry about money anymore.`,
        pause: '1.5s',
      },
      {
        step: 3,
        text: `Let me ask you something: when you bought your last luxury item — maybe that watch, or that car, or that vacation — did you hesitate because of the price?`,
        pause: '1s',
        note: 'Let them answer',
      },
      {
        step: 4,
        text: `Exactly. Because you saw the value immediately. And here's the thing: this is the same principle, except instead of depreciating assets, you're investing in an appreciating one — yourself.`,
        pause: '1.5s',
      },
      {
        step: 5,
        text: `Your profile shows Status Conscious at 87% — which tells me you understand that premium solutions deliver premium results. You don't shop at discount stores, you don't fly economy when business class is available. Why? Because you know quality matters.`,
        pause: '1s',
      },
      {
        step: 6,
        text: `This is the same thing. The Starter package is for people who understand that investing in themselves is the highest ROI activity they can do. And at 82% readiness, you're literally one decision away from transforming your entire trajectory.`,
        pause: '1.5s',
      },
      {
        step: 7,
        text: `So the real question isn't "can I afford this?" The real question is: "can I afford not to do this?"`,
        pause: '2s',
      },
      {
        step: 8,
        text: `Let's get you started today. I'll personally make sure you get the VIP onboarding experience. Deal?`,
        note: 'Extend hand for handshake or lean in expectantly',
      },
    ],
  },
  '3': {
    title: '"I need to talk to my therapist first"',
    dialTrigger: 'Validation Seeker + Control Oriented',
    truthLevel: 78,
    moneyStyle: 'Seeks external approval before big decisions',
    steps: [
      {
        step: 1,
        text: `${CUSTOMER_NAME}, I love that you have a therapist you trust. That shows real emotional intelligence.`,
        pause: '1s',
      },
      {
        step: 2,
        text: `But let me ask you this: what specifically are you hoping your therapist will tell you about this decision?`,
        pause: '1.5s',
        note: 'Critical - listen to their actual concern',
      },
      {
        step: 3,
        text: `Because here's what I've noticed: when high-achieving people like yourself bring big decisions to their therapist, what they're really doing is outsourcing responsibility. Not because they can't make the decision — but because if someone else validates it, they don't have to own it.`,
        pause: '1.5s',
      },
      {
        step: 4,
        text: `And I get it. Your Validation Seeker score is 94% — top of the chart. But here's the paradox: the people who command the most respect and validation are the ones who make bold decisions without needing permission.`,
        pause: '1s',
      },
      {
        step: 5,
        text: `Your therapist can help you process emotions and work through past trauma. But they can't tell you whether this investment in your future is right. Only you know that.`,
        pause: '1.5s',
      },
      {
        step: 6,
        text: `So let me reframe this: imagine you call your therapist right now, and they say "go for it." Would you be ready to commit?`,
        pause: '1s',
        note: 'If yes, proceed. If no, deeper objection exists',
      },
      {
        step: 7,
        text: `Then you already know the answer. The Starter package at $2,997 is your decision to make, ${CUSTOMER_NAME}. And making it right now — without needing someone else to tell you it's okay — that's the first step in your transformation.`,
        pause: '1s',
      },
      {
        step: 8,
        text: `Are you ready to trust yourself enough to say yes?`,
        note: 'Hold eye contact - this is about self-trust',
      },
    ],
  },
  '4': {
    title: '"What if it doesn\'t work for me?"',
    dialTrigger: 'Control Oriented + Analytical Thinker',
    truthLevel: 78,
    moneyStyle: 'Risk-averse despite high net worth',
    steps: [
      {
        step: 1,
        text: `That's a fair question, ${CUSTOMER_NAME}. And I'm glad you're asking it because it shows you're taking this seriously.`,
        pause: '1s',
      },
      {
        step: 2,
        text: `But let me flip that question back to you: what if it does work?`,
        pause: '1.5s',
        note: 'Let the weight of that question land',
      },
      {
        step: 3,
        text: `Because here's what I know from your profile: you're 76% Control Oriented and 71% Analytical. That means you want guarantees. You want to see the spreadsheet, the case studies, the proof.`,
        pause: '1s',
      },
      {
        step: 4,
        text: `But transformation doesn't come with a guarantee, ${CUSTOMER_NAME}. It comes with a commitment. And the difference between people who succeed and people who stay stuck is that successful people make decisions based on potential upside, not fear of downside.`,
        pause: '1.5s',
      },
      {
        step: 5,
        text: `Your self-reported history of incomplete programs? That's not because the programs didn't work. It's because you didn't fully commit. You hedged. You kept one foot out the door "just in case."`,
        pause: '1s',
      },
      {
        step: 6,
        text: `This time is different because we're addressing that pattern directly. The Elite package includes accountability structures specifically designed for analytical thinkers who tend to overthink and under-execute.`,
        pause: '1.5s',
      },
      {
        step: 7,
        text: `So the real question isn't "what if it doesn't work?" The real question is: "am I willing to fully commit this time?" Because if you are, it will work. That's not a guarantee — it's a prediction based on your 82% readiness score.`,
        pause: '1s',
      },
      {
        step: 8,
        text: `So what do you say, ${CUSTOMER_NAME}? Are you ready to commit fully, or are you going to keep that foot out the door?`,
        note: 'Challenge them directly - control-oriented people respect directness',
      },
    ],
  },
  '5': {
    title: '"Can I start next month instead?"',
    dialTrigger: 'Fear of Missing Out + Procrastination Pattern',
    truthLevel: 78,
    moneyStyle: 'Uses timing as delay tactic',
    steps: [
      {
        step: 1,
        text: `${CUSTOMER_NAME}, I hear you. And normally, I'd say "sure, we can start next month." But I'm not going to do that with you.`,
        pause: '1s',
      },
      {
        step: 2,
        text: `You want to know why? Because you have an 82% FOMO score and a self-reported pattern of incomplete programs. That combination tells me something important: you're really good at starting things… next month.`,
        pause: '1.5s',
        note: 'Let that observation sink in',
      },
      {
        step: 3,
        text: `And then next month comes, and suddenly there's a reason to push it to the month after that. And before you know it, a year has gone by and you're having the exact same conversation with someone else, still stuck in the same place.`,
        pause: '1s',
      },
      {
        step: 4,
        text: `Here's the truth, ${CUSTOMER_NAME}: there's never going to be a "perfect" time. Next month you'll have different reasons why it's not ideal. The month after that, same thing.`,
        pause: '1.5s',
      },
      {
        step: 5,
        text: `But right now — in this moment — you have 82% readiness for the Starter package. That's not an accident. That's your intuition telling you this is exactly the right time.`,
        pause: '1s',
      },
      {
        step: 6,
        text: `And here's what happens if you wait: that readiness drops. The momentum from this conversation fades. And that voice in your head that says "I'll do it later" wins again.`,
        pause: '1.5s',
      },
      {
        step: 7,
        text: `So I'm going to challenge you right now: start today. Not because it's convenient, but because you're ready. Your profile proves it. Your gut knows it. The only question is whether you'll trust that or let procrastination win again.`,
        pause: '1s',
      },
      {
        step: 8,
        text: `What's it going to be, ${CUSTOMER_NAME}?`,
        note: 'Direct challenge - silence is powerful here',
      },
    ],
  },
};
