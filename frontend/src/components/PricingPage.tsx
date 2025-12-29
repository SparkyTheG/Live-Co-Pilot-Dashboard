import { X, Check, Zap, Crown, Rocket, Users, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { useState } from 'react';
import InvestorPage from './InvestorPage';

interface PricingPageProps {
  onClose: () => void;
}

const PRICING_TIERS = [
  {
    name: 'Solo Closer',
    price: 297,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-400/40',
    description: 'Perfect for individual closers',
    features: [
      '1 Closer Profile',
      'Unlimited Prospects',
      'Whisper™ Engine',
      'Lubometer™ Analysis',
      'Truth Index™',
      'Call Recording Analysis',
      'Standard Objection Library',
      'Email Support'
    ],
    popular: false
  },
  {
    name: 'Small Team',
    price: 997,
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-400/60',
    description: 'For growing sales teams',
    features: [
      'Up to 5 Closers',
      'Everything in Solo Closer',
      'Sales Manager Dashboard',
      'Team Performance Analytics',
      'Custom Objection Training',
      'Burnout Detection',
      'Priority Support',
      'Weekly Group Training Call'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 2997,
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-400/40',
    description: 'Full customization & control',
    features: [
      'Unlimited Closers',
      'Everything in Small Team',
      'Full Logic Customization',
      'White-Label Option',
      'API Access',
      'Dedicated Success Manager',
      'Custom Integrations',
      'Quarterly Optimization Sessions'
    ],
    popular: false
  }
];

const ADD_ONS = [
  {
    name: 'AI Call Analysis',
    price: 497,
    description: 'Auto-transcribe and analyze recordings with AI'
  },
  {
    name: 'Live Call Coaching',
    price: 297,
    description: 'Real-time suggestions during active calls'
  },
  {
    name: 'Custom Training Program',
    price: 197,
    description: 'Additional weekly group coaching sessions'
  }
];

export default function PricingPage({ onClose }: PricingPageProps) {
  const [showInvestor, setShowInvestor] = useState(false);

  if (showInvestor) {
    return <InvestorPage onClose={() => setShowInvestor(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-10 h-10 text-cyan-400" />
                <h1 className="text-5xl font-bold text-white">Pricing Plans</h1>
              </div>
              <p className="text-gray-400 text-lg">
                Choose the perfect plan to transform your sales process
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 flex items-center justify-center transition-all group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-16">
            {PRICING_TIERS.map((tier) => {
              const IconComponent = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`relative backdrop-blur-xl bg-gray-900/60 border-2 ${tier.borderColor} rounded-3xl p-8 transition-all hover:scale-105 ${
                    tier.popular ? 'ring-4 ring-purple-500/30 shadow-2xl shadow-purple-500/20' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-bold shadow-lg">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-400 mb-6">{tier.description}</p>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">${tier.price.toLocaleString()}</span>
                      <span className="text-gray-400 text-lg">/month</span>
                    </div>
                  </div>

                  <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-8 bg-gradient-to-r ${tier.color} hover:opacity-90 text-white shadow-lg`}>
                    Get Started
                  </button>

                  <div className="space-y-4">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-400/30 rounded-3xl p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Add-Ons</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {ADD_ONS.map((addon) => (
                <div key={addon.name} className="p-6 bg-gray-900/60 border border-gray-700/50 rounded-xl">
                  <h4 className="text-xl font-bold text-white mb-2">{addon.name}</h4>
                  <p className="text-gray-400 text-sm mb-4">{addon.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-cyan-400">+${addon.price}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-400/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Enterprise Custom Setup</h2>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Onboarding & Customization</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Custom logic configuration for your offers</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Psychological dial calibration</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Custom objection library</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">3-6 months optimization</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">$15,000 - $35,000</span>
                    <span className="text-gray-400">one-time</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Ongoing Optimization</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Quarterly logic refinement sessions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Performance data analysis</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Script optimization based on results</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Continuous improvement</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">$2,500</span>
                    <span className="text-gray-400">/quarter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-6">
              All plans include secure data storage, GDPR compliance, and 99.9% uptime guarantee
            </p>
            <button
              onClick={() => setShowInvestor(true)}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 hover:from-purple-900/60 hover:to-pink-900/60 border border-purple-400/40 hover:border-purple-400/60 rounded-xl transition-all"
            >
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span className="text-purple-300 font-semibold">Interested in investing or founding membership?</span>
              <Sparkles className="w-5 h-5 text-pink-400 group-hover:-rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
