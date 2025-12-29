import { X, TrendingUp, Target, Zap, Shield, Users, DollarSign, Rocket, Brain, Lock, Crown, CheckCircle2, ArrowRight, FileText, Megaphone, Star, Award, TrendingUp as Growth } from 'lucide-react';
import { useState } from 'react';
import BusinessPlanPage from './BusinessPlanPage';
import MarketingPlanPage from './MarketingPlanPage';

interface InvestorPageProps {
  onClose: () => void;
}

export default function InvestorPage({ onClose }: InvestorPageProps) {
  const [showBusinessPlan, setShowBusinessPlan] = useState(false);
  const [showMarketingPlan, setShowMarketingPlan] = useState(false);

  if (showBusinessPlan) {
    return <BusinessPlanPage onClose={() => setShowBusinessPlan(false)} />;
  }

  if (showMarketingPlan) {
    return <MarketingPlanPage onClose={() => setShowMarketingPlan(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-12 h-12 text-teal-600" />
                <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Zero-Stress Sales
                </h1>
              </div>
              <p className="text-gray-600 text-xl">
                Investor Overview & Founding Member Opportunities
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center transition-all group"
            >
              <X className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
            </button>
          </div>

          {/* Market Opportunity */}
          <div className="bg-gray-50 border-2 border-teal-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">Market Opportunity</h2>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-bold text-teal-600 mb-2">$50B+</div>
                <div className="text-gray-800 text-lg font-medium">Sales Training Market</div>
                <div className="text-gray-600 text-sm mt-2">Growing 12% annually</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-teal-600 mb-2">15M+</div>
                <div className="text-gray-800 text-lg font-medium">Sales Professionals in US</div>
                <div className="text-gray-600 text-sm mt-2">5M+ in high-ticket sales</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-teal-600 mb-2">85%</div>
                <div className="text-gray-800 text-lg font-medium">Failure Rate on Calls</div>
                <div className="text-gray-600 text-sm mt-2">Without proper tools</div>
              </div>
            </div>
          </div>

          {/* Unique Value Proposition */}
          <div className="bg-gray-50 border-2 border-cyan-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-cyan-600" />
              <h2 className="text-3xl font-bold text-gray-900">Why We're Unique</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <Brain className="w-8 h-8 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Psychological AI Engine</h3>
                <p className="text-gray-700 text-sm">
                  Real-time psychological profiling using Lubometer™, Truth Index™, and predictive objection modeling. No competitor has this depth of buyer psychology.
                </p>
              </div>
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <Lock className="w-8 h-8 text-cyan-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Proprietary Logic System</h3>
                <p className="text-gray-700 text-sm">
                  Custom-tuned decision trees per offer, per industry. The logic is the moat - once configured, switching costs are massive. Competitors can't replicate our specificity.
                </p>
              </div>
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <Target className="w-8 h-8 text-teal-700 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Whisper™ Engine</h3>
                <p className="text-gray-700 text-sm">
                  Live objection prediction and script generation during calls. Gong and Chorus only record and analyze after. We guide during the moment that matters.
                </p>
              </div>
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <Shield className="w-8 h-8 text-cyan-700 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Burnout Detection</h3>
                <p className="text-gray-700 text-sm">
                  Sales manager dashboard tracks closer wellness and performance degradation. Prevent turnover before it happens - a $150K+ problem for companies.
                </p>
              </div>
            </div>
          </div>

          {/* Competitive Landscape */}
          <div className="bg-gray-50 border-2 border-teal-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">Competitive Moat</h2>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="font-bold text-gray-900 mb-2">Gong/Chorus</div>
                <div className="text-sm text-gray-600">Post-call analysis</div>
                <div className="text-sm text-red-600 mt-1 font-medium">Too late</div>
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-2">SalesLoft</div>
                <div className="text-sm text-gray-600">Engagement platform</div>
                <div className="text-sm text-red-600 mt-1 font-medium">No psychology</div>
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-2">Generic CRMs</div>
                <div className="text-sm text-gray-600">Data storage</div>
                <div className="text-sm text-red-600 mt-1 font-medium">No intelligence</div>
              </div>
              <div className="bg-teal-50 border-2 border-teal-500 rounded-xl p-4">
                <div className="font-bold text-teal-700 mb-2">Zero-Stress Sales</div>
                <div className="text-sm text-gray-900 font-medium">Real-time + Psychology</div>
                <div className="text-sm text-green-700 mt-1 font-semibold">Unique positioning</div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white border border-teal-200 rounded-xl">
              <p className="text-gray-700 text-sm">
                <strong className="text-gray-900">Network Effects:</strong> Every closer profile trained = more valuable data. Every company customization = deeper moat. The system gets smarter with every call.
              </p>
            </div>
          </div>

          {/* Founder Story */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 border-2 border-amber-300 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-8 h-8 text-amber-600" />
              <h2 className="text-3xl font-bold text-gray-900">The Unlikely Founder</h2>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 space-y-4">
                <div className="p-6 bg-white/80 backdrop-blur border-2 border-amber-200 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Meet Luba Evans</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    A 55-year-old Russian grandmother who arrived in America at 19 with a toddler and $200. Started at Dunkin' Donuts, became manager, then earned a Bachelor's degree in 2 years followed by a graduate degree from <strong>NYU Tisch School of the Arts</strong>.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    By 28, she founded an interactive media company in New York, serving clients like the <strong>United Nations and CNN</strong>. Over 25+ years, she's led <strong>300+ workshops globally</strong>, mastered NLP and hypnotherapy, and created the Magnetic Communications Method.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Most recently, she founded <strong>Genius Mode AI</strong>, helping coaches build AI-powered apps. But her true passion? <strong>Sales psychology.</strong>
                  </p>
                </div>

                <div className="p-6 bg-white/80 backdrop-blur border-2 border-orange-300 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Proof of Concept: $1M Revenue from $250K Investment</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Before building Zero-Stress Sales, Luba spent <strong>$250,000 of her own money</strong> on Google ads testing her proprietary sales logic and psychology frameworks. The result? <strong>$1 million in revenue</strong> (4x ROAS).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    She didn't theorize. She didn't read case studies. She <strong>spent a quarter million dollars proving her system works</strong>. Now she's translating that hard-won intuition into AI that any closer can use.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-white/80 backdrop-blur border-2 border-pink-200 rounded-xl">
                  <Award className="w-8 h-8 text-pink-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Credentials</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>NYU Tisch Graduate</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Master NLP Practitioner</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Certified Hypnotherapist</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Interactive Media Founder</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>UN & CNN Client Work</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>300+ Global Workshops</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Genius Mode AI Founder</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl text-center">
                  <Growth className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-green-700 mb-1">4x ROAS</div>
                  <div className="text-sm text-gray-700 font-medium">$250K → $1M</div>
                  <div className="text-xs text-gray-600 mt-2">Proven with her own capital</div>
                </div>

                <div className="p-5 bg-white/80 backdrop-blur border-2 border-amber-300 rounded-xl">
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "Everyone underestimates me. That's my advantage. While competitors raised millions to analyze calls after they fail, I'm helping closers win during the conversation."
                  </p>
                  <p className="text-xs text-gray-600 mt-3 font-medium">— Luba Evans</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-2 border-amber-400 rounded-xl">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <p className="text-gray-700 font-medium">
                  <strong className="text-gray-900">Why This Matters:</strong> Investors back execution, not ideas. Luba spent $250K proving her system works before asking anyone for a dime. She's not a tech bro with a deck—she's a battle-tested operator with receipts.
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Model */}
          <div className="bg-gray-50 border-2 border-cyan-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-cyan-600" />
              <h2 className="text-3xl font-bold text-gray-900">Revenue Projections</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <div className="text-sm text-gray-600 mb-2 font-medium">Year 1</div>
                <div className="text-4xl font-bold text-gray-900 mb-3">$500K</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>20 clients @ $997/mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>10 custom setups @ $25K</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <div className="text-sm text-gray-600 mb-2 font-medium">Year 2</div>
                <div className="text-4xl font-bold text-gray-900 mb-3">$2.5M</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>100 clients avg $1.5K/mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>40% upsells to add-ons</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-teal-50 border-2 border-teal-400 rounded-xl">
                <div className="text-sm text-gray-600 mb-2 font-medium">Year 3</div>
                <div className="text-4xl font-bold text-teal-700 mb-3">$8M</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    <span>300+ enterprise clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    <span>White-label partnerships</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white border border-cyan-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-semibold mb-1">Unit Economics</div>
                  <div className="text-gray-600 text-sm">LTV:CAC Ratio = 6:1 | Gross Margin = 85% | Churn = 5% annually</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-700">ARR Growth</div>
                  <div className="text-gray-700">3x year-over-year</div>
                </div>
              </div>
            </div>
          </div>

          {/* Founding Member Opportunity */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-4 border-teal-400 rounded-3xl p-10 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <Crown className="w-12 h-12 text-amber-600" />
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Founding Member Opportunity</h2>
                <p className="text-gray-700">Get in early. Help shape the future of sales intelligence.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-6 bg-white border-2 border-teal-200 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">What We're Raising</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-teal-700">$500K Seed Round</div>
                    <div className="text-gray-600 text-sm mt-1">$2M pre-money valuation</div>
                  </div>
                  <div className="pt-4 border-t border-gray-300">
                    <div className="text-gray-900 font-semibold mb-2">Use of Funds:</div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Product development</span>
                        <span className="text-teal-700 font-semibold">40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales & marketing</span>
                        <span className="text-teal-700 font-semibold">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Team expansion</span>
                        <span className="text-teal-700 font-semibold">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-teal-200 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Founding Member Benefits</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-900 font-semibold">Lifetime Platinum Access</div>
                      <div className="text-gray-600 text-sm">Enterprise features, zero cost, forever</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-900 font-semibold">Equity Stake</div>
                      <div className="text-gray-600 text-sm">$50K investment = 2% equity</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-900 font-semibold">Advisory Board Seat</div>
                      <div className="text-gray-600 text-sm">Shape product roadmap</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-900 font-semibold">White-Label Rights</div>
                      <div className="text-gray-600 text-sm">Resell to your network</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-gray-900 font-semibold">Custom Integrations</div>
                      <div className="text-gray-600 text-sm">Priority feature requests</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-2 border-teal-300 rounded-xl mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-bold text-lg mb-1">Investment Tiers</div>
                  <div className="text-gray-700 text-sm">Multiple entry points available</div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-6 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="text-teal-700 font-bold">$25K</div>
                    <div className="text-gray-600 text-xs">1% equity</div>
                  </div>
                  <div className="text-center px-6 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="text-teal-700 font-bold">$50K</div>
                    <div className="text-gray-600 text-xs">2% equity</div>
                  </div>
                  <div className="text-center px-6 py-3 bg-teal-100 border-2 border-teal-500 rounded-lg">
                    <div className="text-teal-800 font-bold">$100K+</div>
                    <div className="text-gray-700 text-xs">Custom terms</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <a
                href="mailto:invest@zerostresssales.com"
                className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-xl text-white font-bold text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>Request Investment Deck</span>
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-center gap-8 mb-6">
              <button
                onClick={() => setShowBusinessPlan(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-teal-400 rounded-xl transition-all group"
              >
                <FileText className="w-5 h-5 text-teal-600" />
                <span className="text-gray-800 font-semibold">View Full Business Plan</span>
              </button>
              <button
                onClick={() => setShowMarketingPlan(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-cyan-400 rounded-xl transition-all group"
              >
                <Megaphone className="w-5 h-5 text-cyan-600" />
                <span className="text-gray-800 font-semibold">View Marketing Plan</span>
              </button>
            </div>
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-sm">
                This is a private offering. All projections are forward-looking statements and subject to market conditions.
              </p>
              <p className="text-gray-600 text-sm font-medium">
                © {new Date().getFullYear()} Zero-Stress Sales™. All Rights Reserved. | Provisional Patent Pending
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
