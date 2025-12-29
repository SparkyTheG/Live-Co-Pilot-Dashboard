import { X, Target, Users, MessageSquare, Handshake, TrendingUp, Megaphone, Video, FileText, Award, Zap, Mail } from 'lucide-react';

interface MarketingPlanPageProps {
  onClose: () => void;
}

export default function MarketingPlanPage({ onClose }: MarketingPlanPageProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Megaphone className="w-12 h-12 text-teal-600" />
                <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Marketing Plan
                </h1>
              </div>
              <p className="text-gray-600 text-xl">
                Zero-Stress Sales - Customer Acquisition Strategy
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center transition-all group"
            >
              <X className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
            </button>
          </div>

          {/* Overview */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-3xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Marketing Philosophy</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Our target market (high-ticket closers and sales managers) doesn't respond to traditional B2B ads. They're skeptical, performance-driven, and need proof. Our strategy focuses on relationship-driven outreach, social proof, and strategic partnerships.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white border border-teal-200 rounded-xl">
                <div className="text-2xl font-bold text-teal-600 mb-1">70%</div>
                <div className="text-sm text-gray-700">Direct Outreach (LinkedIn + Instantly)</div>
              </div>
              <div className="p-4 bg-white border border-teal-200 rounded-xl">
                <div className="text-2xl font-bold text-teal-600 mb-1">20%</div>
                <div className="text-sm text-gray-700">Partnerships & Referrals</div>
              </div>
              <div className="p-4 bg-white border border-teal-200 rounded-xl">
                <div className="text-2xl font-bold text-teal-600 mb-1">10%</div>
                <div className="text-sm text-gray-700">Content & Community</div>
              </div>
            </div>
          </div>

          {/* Channel Strategy */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* LinkedIn Outreach */}
            <div className="bg-gray-50 border-2 border-blue-200 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">LinkedIn Outreach</h2>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-900 mb-2">Strategy: Warm, Thought Leadership Approach</div>
                <div className="text-sm text-gray-700">Position founder as expert in sales psychology, not pushy vendor</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-gray-900 mb-2">Daily Activities:</div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Post 1x daily: sales tips, objection breakdowns, psychology insights</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Engage with 20 target profiles (closers, sales managers)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Send 15-20 personalized connection requests</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>DM 10 warm connections with value (not pitch)</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border border-blue-200 rounded-xl">
                  <div className="font-semibold text-gray-900 mb-2">Target Personas:</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>• High-ticket closers (coaching, consulting, SaaS)</div>
                    <div>• Sales managers at info product companies</div>
                    <div>• Agency owners with sales teams</div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl">
                  <div className="font-semibold text-gray-900 mb-1">Expected Results:</div>
                  <div className="text-sm text-gray-700">20-30 demos/month, 15% close rate = 3-5 new customers</div>
                </div>
              </div>
            </div>

            {/* Instantly.ai Cold Outreach */}
            <div className="bg-gray-50 border-2 border-purple-200 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Instantly.ai Cold Outreach</h2>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-900 mb-2">Strategy: Hyper-Personalized Sequences</div>
                <div className="text-sm text-gray-700">Low volume, high personalization (NOT mass spray-and-pray)</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-gray-900 mb-2">Sequence Structure:</div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Email 1:</strong> Personalized insight about their business/offer</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Email 2 (+3 days):</strong> Case study of similar closer who 2x'd close rate</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Email 3 (+5 days):</strong> Soft breakup with valuable resource</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border border-purple-200 rounded-xl">
                  <div className="font-semibold text-gray-900 mb-2">List Building:</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>• Scrape LinkedIn: "closer", "sales manager", "appointment setter"</div>
                    <div>• Filter: info product, coaching, consulting industries</div>
                    <div>• Verify emails: Hunter.io, Apollo.io</div>
                    <div>• Target: 500 new contacts/month</div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-300 rounded-xl">
                  <div className="font-semibold text-gray-900 mb-1">Expected Results:</div>
                  <div className="text-sm text-gray-700">30% open, 5% reply, 10% of replies book demo = 15 demos/month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Partnerships */}
          <div className="bg-gray-50 border-2 border-teal-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Handshake className="w-8 h-8 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">Strategic Partnerships</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <div className="text-lg font-bold text-gray-900 mb-3">Sales Coaching Programs</div>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Target Partners:</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>• Cole Gordon (Closers.io)</div>
                    <div>• Jeremy Miner (NEPQ)</div>
                    <div>• Dan Lok programs</div>
                    <div>• Russell Brunson ecosystem</div>
                  </div>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-1">Deal Structure:</div>
                  <div className="text-sm text-gray-700">20% recurring commission + co-branded version</div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-teal-100 rounded-xl">
                <div className="text-lg font-bold text-gray-900 mb-3">CRM & Tool Integrations</div>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Integration Partners:</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>• HubSpot marketplace</div>
                    <div>• Salesforce AppExchange</div>
                    <div>• Close.com ecosystem</div>
                    <div>• GoHighLevel partners</div>
                  </div>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-1">Strategy:</div>
                  <div className="text-sm text-gray-700">Deep integration = featured placement + SEO juice</div>
                </div>
              </div>

              <div className="p-6 bg-teal-50 border-2 border-teal-400 rounded-xl">
                <div className="text-lg font-bold text-gray-900 mb-3">Referral Program</div>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Structure:</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>• 20% lifetime commission</div>
                    <div>• Tracked via unique links</div>
                    <div>• Monthly payouts (Net-30)</div>
                    <div>• Bonus at 10+ referrals</div>
                  </div>
                </div>
                <div className="p-3 bg-white border border-teal-300 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-1">Top Referrers:</div>
                  <div className="text-sm text-gray-700">Power users become affiliates = viral loop</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content & Community */}
          <div className="bg-gray-50 border-2 border-cyan-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-cyan-600" />
              <h2 className="text-3xl font-bold text-gray-900">Content Marketing & Community</h2>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <Video className="w-6 h-6 text-cyan-600 mb-3" />
                <div className="text-lg font-bold text-gray-900 mb-3">Weekly Webinars</div>
                <div className="text-sm text-gray-700 mb-3">
                  "Objection Breakdown" series - analyze real calls, show live demos
                </div>
                <div className="text-sm font-semibold text-gray-900">Goal: 50-100 attendees, 20% convert to trial</div>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <FileText className="w-6 h-6 text-cyan-600 mb-3" />
                <div className="text-lg font-bold text-gray-900 mb-3">Case Studies</div>
                <div className="text-sm text-gray-700 mb-3">
                  Deep dives: "How [Closer] went from 15% to 40% close rate in 90 days"
                </div>
                <div className="text-sm font-semibold text-gray-900">Goal: 2 case studies/month, SEO + social proof</div>
              </div>

              <div className="p-6 bg-cyan-50 border-2 border-cyan-400 rounded-xl">
                <Users className="w-6 h-6 text-cyan-700 mb-3" />
                <div className="text-lg font-bold text-gray-900 mb-3">Private Community</div>
                <div className="text-sm text-gray-700 mb-3">
                  Slack/Circle group for customers - share wins, scripts, best practices
                </div>
                <div className="text-sm font-semibold text-gray-900">Goal: Increase retention, generate testimonials</div>
              </div>
            </div>

            <div className="p-6 bg-white border border-cyan-200 rounded-xl">
              <div className="font-semibold text-gray-900 mb-3">SEO Content Strategy:</div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <div className="font-medium text-gray-900 mb-2">High-Intent Keywords:</div>
                  <div className="space-y-1">
                    <div>• "sales objection handling software"</div>
                    <div>• "closer CRM for high-ticket"</div>
                    <div>• "real-time sales coaching tool"</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-2">Educational Content:</div>
                  <div className="space-y-1">
                    <div>• "147 sales objections + rebuttals"</div>
                    <div>• "Psychology of high-ticket buyers"</div>
                    <div>• "How to hire & train closers"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why NO Paid Ads */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-gray-900">Why We're NOT Running Paid Ads (Yet)</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="font-semibold text-gray-900 mb-3">Reasons to Avoid (Year 1):</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>High CAC:</strong> Our target audience is skeptical - ads have poor conversion</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>Trust Issue:</strong> Closers want proof, not promises - need social proof first</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>Long Sales Cycle:</strong> $997-$2,997/mo needs education + demos - not impulse buy</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>Better ROI:</strong> LinkedIn + partnerships = lower cost, higher intent</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-3">When We'll Consider Ads (Year 2+):</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>Retargeting:</strong> Warm up webinar attendees, demo no-shows</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>YouTube Pre-Roll:</strong> Target sales training channels</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>Podcast Sponsorships:</strong> Sales-focused podcasts with proven audience</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span><strong>After PMF:</strong> Once we have 50+ case studies + proven LTV:CAC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics & KPIs */}
          <div className="bg-teal-50 border-2 border-teal-400 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">Marketing Metrics & Goals</h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-teal-300 rounded-xl text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">500+</div>
                <div className="text-sm text-gray-700">LinkedIn connections/month</div>
              </div>
              <div className="p-4 bg-white border border-teal-300 rounded-xl text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">35+</div>
                <div className="text-sm text-gray-700">Qualified demos/month</div>
              </div>
              <div className="p-4 bg-white border border-teal-300 rounded-xl text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">15%</div>
                <div className="text-sm text-gray-700">Demo → Customer close rate</div>
              </div>
              <div className="p-4 bg-white border border-teal-300 rounded-xl text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">$2K</div>
                <div className="text-sm text-gray-700">Blended CAC target</div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white border border-teal-300 rounded-xl">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-2">Expected Results: 5-7 New Customers/Month</div>
                <div className="text-sm text-gray-700">Average $1,200/mo contract = $6K-$8.4K MRR growth monthly</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
