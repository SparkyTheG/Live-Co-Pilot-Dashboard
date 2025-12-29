import { X, Target, TrendingUp, Users, DollarSign, Rocket, CheckCircle2, Briefcase, Award, Calendar } from 'lucide-react';

interface BusinessPlanPageProps {
  onClose: () => void;
}

export default function BusinessPlanPage({ onClose }: BusinessPlanPageProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="w-12 h-12 text-teal-600" />
                <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Business Plan
                </h1>
              </div>
              <p className="text-gray-600 text-xl">
                Zero-Stress Sales - Strategic Roadmap 2025-2027
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center transition-all group"
            >
              <X className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
            </button>
          </div>

          {/* Executive Summary */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-3xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Executive Summary</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Zero-Stress Sales is revolutionizing high-ticket sales with real-time psychological AI that predicts buyer behavior and guides closers through objections. Unlike post-call analytics tools (Gong, Chorus), we provide live intelligence when it matters most - during the conversation.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Our proprietary logic system creates massive switching costs once configured for a company's specific offers, establishing a defensible moat. We're targeting the $50B sales training market with a SaaS model that scales from solo closers ($297/mo) to enterprise ($2,997/mo + custom setup fees).
            </p>
          </div>

          {/* Problem & Solution */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 border-2 border-gray-300 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">The Problem</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">85% Call Failure Rate</div>
                  <div className="text-sm">Most closers wing it without systematic objection handling</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">High Burnout & Turnover</div>
                  <div className="text-sm">Replacing a closer costs $150K+ in lost revenue and training</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Existing Tools Are Reactive</div>
                  <div className="text-sm">Gong/Chorus analyze after the call - too late to save the deal</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Generic Training Doesn't Scale</div>
                  <div className="text-sm">Cookie-cutter scripts don't adapt to buyer psychology</div>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 border-2 border-teal-400 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
                <h2 className="text-2xl font-bold text-gray-900">Our Solution</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Whisper™ Engine</div>
                  <div className="text-sm">Real-time objection prediction and script generation during calls</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Psychological AI</div>
                  <div className="text-sm">Lubometer™ & Truth Index™ profile buyer psychology live</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Burnout Detection</div>
                  <div className="text-sm">Manager dashboard identifies performance degradation early</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Custom Logic System</div>
                  <div className="text-sm">Tuned per offer, per industry - creates massive switching costs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Model */}
          <div className="bg-gray-50 border-2 border-cyan-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-cyan-600" />
              <h2 className="text-3xl font-bold text-gray-900">Business Model</h2>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <div className="text-sm text-gray-600 mb-2 font-medium">SaaS Subscriptions</div>
                <div className="text-3xl font-bold text-teal-600 mb-3">70%</div>
                <div className="text-sm text-gray-700">Monthly recurring revenue from $297-$2,997/mo plans</div>
              </div>
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <div className="text-sm text-gray-600 mb-2 font-medium">Custom Setup Fees</div>
                <div className="text-3xl font-bold text-teal-600 mb-3">25%</div>
                <div className="text-sm text-gray-700">$15K-$35K one-time enterprise onboarding</div>
              </div>
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <div className="text-sm text-gray-600 mb-2 font-medium">Add-Ons & Services</div>
                <div className="text-3xl font-bold text-teal-600 mb-3">5%</div>
                <div className="text-sm text-gray-700">AI analysis, live coaching, ongoing optimization</div>
              </div>
            </div>
            <div className="p-6 bg-teal-50 border border-teal-300 rounded-xl">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">6:1</div>
                  <div className="text-sm text-gray-600">LTV:CAC</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">85%</div>
                  <div className="text-sm text-gray-600">Gross Margin</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">5%</div>
                  <div className="text-sm text-gray-600">Annual Churn</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">18mo</div>
                  <div className="text-sm text-gray-600">Avg Contract</div>
                </div>
              </div>
            </div>
          </div>

          {/* Go-to-Market Strategy */}
          <div className="bg-gray-50 border-2 border-teal-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Rocket className="w-8 h-8 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">Go-to-Market Strategy</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <div className="text-lg font-bold text-gray-900 mb-3">Phase 1: Foundation (Q1-Q2 2025)</div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Target solo closers & small teams via LinkedIn</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Partner with 3-5 coaching programs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Build 10 case studies from beta users</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Goal: 20 paying customers, $120K ARR</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <div className="text-lg font-bold text-gray-900 mb-3">Phase 2: Scale (Q3-Q4 2025)</div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Expand to mid-market (5-20 closers)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Launch referral program (20% lifetime)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Integrate with HubSpot, Salesforce</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>Goal: 100 customers, $500K ARR</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-teal-50 border-2 border-teal-400 rounded-xl">
                <div className="text-lg font-bold text-gray-900 mb-3">Phase 3: Dominate (2026)</div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                    <span>Target enterprise (50+ closers)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                    <span>Launch white-label partnerships</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                    <span>Expand to international markets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                    <span>Goal: 300+ customers, $2.5M ARR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Projections */}
          <div className="bg-gray-50 border-2 border-cyan-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-cyan-600" />
              <h2 className="text-3xl font-bold text-gray-900">3-Year Financial Projections</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 text-gray-900 font-semibold">Metric</th>
                    <th className="text-right py-3 px-4 text-gray-900 font-semibold">Year 1 (2025)</th>
                    <th className="text-right py-3 px-4 text-gray-900 font-semibold">Year 2 (2026)</th>
                    <th className="text-right py-3 px-4 text-gray-900 font-semibold">Year 3 (2027)</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Total Customers</td>
                    <td className="text-right py-3 px-4 font-medium">100</td>
                    <td className="text-right py-3 px-4 font-medium">250</td>
                    <td className="text-right py-3 px-4 font-medium">500</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Monthly Recurring Revenue</td>
                    <td className="text-right py-3 px-4 font-medium">$42K</td>
                    <td className="text-right py-3 px-4 font-medium">$208K</td>
                    <td className="text-right py-3 px-4 font-medium">$667K</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Annual Recurring Revenue</td>
                    <td className="text-right py-3 px-4 font-medium text-teal-700">$500K</td>
                    <td className="text-right py-3 px-4 font-medium text-teal-700">$2.5M</td>
                    <td className="text-right py-3 px-4 font-medium text-teal-700">$8M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Custom Setup Revenue</td>
                    <td className="text-right py-3 px-4 font-medium">$250K</td>
                    <td className="text-right py-3 px-4 font-medium">$750K</td>
                    <td className="text-right py-3 px-4 font-medium">$1.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">Gross Profit (85% margin)</td>
                    <td className="text-right py-3 px-4 font-medium">$638K</td>
                    <td className="text-right py-3 px-4 font-medium">$2.8M</td>
                    <td className="text-right py-3 px-4 font-medium">$8.1M</td>
                  </tr>
                  <tr className="bg-teal-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">Net Profit</td>
                    <td className="text-right py-3 px-4 font-bold text-teal-700">$75K</td>
                    <td className="text-right py-3 px-4 font-bold text-teal-700">$875K</td>
                    <td className="text-right py-3 px-4 font-bold text-teal-700">$3.2M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Team & Milestones */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-gray-50 border-2 border-teal-200 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-teal-600" />
                <h2 className="text-2xl font-bold text-gray-900">Team Structure</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Year 1 (5 people)</div>
                  <div className="text-sm text-gray-700">Founder, 2 Engineers, Sales Lead, Customer Success</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Year 2 (12 people)</div>
                  <div className="text-sm text-gray-700">+4 Engineers, +2 Sales, Marketing Lead, Support</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Year 3 (25 people)</div>
                  <div className="text-sm text-gray-700">Full product, sales, marketing, and support teams</div>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 border-2 border-teal-400 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-8 h-8 text-teal-600" />
                <h2 className="text-2xl font-bold text-gray-900">Key Milestones</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Q1 2025: Beta Launch</div>
                    <div className="text-sm text-gray-700">10 pilot customers, product-market fit validation</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Q3 2025: Series A Raise</div>
                    <div className="text-sm text-gray-700">$2M at $8M valuation, accelerate growth</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Q2 2026: Enterprise Ready</div>
                    <div className="text-sm text-gray-700">SOC2, enterprise features, first Fortune 500</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
