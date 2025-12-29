export interface Objection {
  id: string;
  text: string;
  probability: number;
}

export interface ScriptStep {
  step: number;
  text: string;
  pause?: string;
  note?: string;
}

export interface PsychologicalDial {
  name: string;
  intensity: number;
  color: string;
}

export interface RedFlag {
  text: string;
  severity: 'low' | 'medium' | 'high';
}

export interface LubometerTier {
  price: number;
  readiness: number;
  label: string;
}

export interface CallRecord {
  id: string;
  type: 'Intro Call' | 'Close' | 'Follow Up';
  date: string;
  duration: string;
  status: 'analyzed' | 'processing' | 'pending';
  audioUrl?: string;
}

export interface CRMData {
  company: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  source: string;
  dealValue: number;
  lastContact: string;
}

export interface CustomerProfile {
  name: string;
  photo: string;
  status: string;
  crmData: CRMData;
  calls: CallRecord[];
}

export interface PriceTier {
  name: string;
  price: number;
  description: string;
  deliverables: string[];
}

export interface OfferProfile {
  coreTransformation: string;
  painfulProblems: string[];
  commonSymptoms: string[];
  targetAudience: {
    demographics: string;
    identityTraits: string[];
    decisionMakingBehavior: string;
    emotionalTriggers: string[];
  };
  buyerBeliefs: string[];
  differentiation: string[];
  falseBeliefsLimitingStories: string[];
  priceTiers: PriceTier[];
  discountsAndBonuses: {
    fastActionBonuses: string[];
    discountTypes: string[];
    bundles: string[];
    limitedTimeOffers: string[];
  };
  paymentOptions: string[];
  deliveryTimeline: {
    startTime: string;
    duration: string;
    firstResultMilestone: string;
  };
}

export interface CloserProfile {
  name: string;
  photo: string;
  company: string;
  title: string;
  biggestFrustrations: string[];
  offer: OfferProfile;
  truthIndexInsights: {
    pleaserSignals: string[];
    redFlags: string[];
  };
  decisionMakingStyles: string[];
  successCallCount: number;
  difficultCallCount: number;
}

export interface CloserPerformanceMetrics {
  callsThisWeek: number;
  callsThisMonth: number;
  closeRate: number;
  avgDealValue: number;
  totalRevenue: number;
  revenueThisMonth: number;
  avgCallDuration: string;
  truthIndexAvg: number;
}

export interface CloserStrength {
  area: string;
  description: string;
}

export interface CloserVulnerability {
  area: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface BurnoutIndicator {
  metric: string;
  status: 'normal' | 'warning' | 'critical';
  value: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CloserOverview {
  id: string;
  name: string;
  photo: string;
  title: string;
  status: 'active' | 'on-call' | 'offline';
  metrics: CloserPerformanceMetrics;
  strengths: CloserStrength[];
  vulnerabilities: CloserVulnerability[];
  burnoutIndicators: BurnoutIndicator[];
  tendency: 'evolving' | 'stable' | 'burning-out';
  lastActivity: string;
  activeCalls: number;
}

export interface SalesManagerProfile {
  name: string;
  photo: string;
  company: string;
  teamSize: number;
  closers: CloserOverview[];
}
