import { DollarSign, TrendingUp } from 'lucide-react';
import { LubometerTier } from '../types';

interface LubometerProps {
  tiers: LubometerTier[];
}

export default function Lubometer({ tiers }: LubometerProps) {
  const getReadinessColor = (readiness: number) => {
    if (readiness >= 85) return 'from-emerald-500 to-green-400';
    if (readiness >= 60) return 'from-cyan-500 to-teal-400';
    return 'from-blue-500 to-indigo-400';
  };

  const getReadinessLabel = (readiness: number) => {
    if (readiness >= 85) return 'High Propensity';
    if (readiness >= 60) return 'Moderate Interest';
    return 'Low Readiness';
  };

  const recommendedTier = tiers.reduce((prev, current) =>
    current.readiness > prev.readiness ? current : prev
  );

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <DollarSign className="w-7 h-7 text-emerald-400" />
          <div className="absolute inset-0 blur-md bg-emerald-400/30"></div>
        </div>
        <h2 className="text-2xl font-bold text-white">Lubometer™</h2>
      </div>

      <div className="space-y-4">
        {tiers.map((tier) => (
          <div
            key={tier.price}
            className={`p-4 rounded-xl border transition-all ${
              tier.price === recommendedTier.price
                ? 'bg-emerald-500/10 border-emerald-500/40 glow-teal'
                : 'bg-gray-800/30 border-gray-700/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-semibold text-lg">
                  ${tier.price.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">{tier.label}</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold bg-gradient-to-r ${getReadinessColor(tier.readiness)} bg-clip-text text-transparent`}>
                  {tier.readiness}%
                </div>
                <div className="text-xs text-gray-400">{getReadinessLabel(tier.readiness)}</div>
              </div>
            </div>

            <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getReadinessColor(tier.readiness)} transition-all duration-500`}
                style={{ width: `${tier.readiness}%` }}
              ></div>
            </div>

            {tier.price === recommendedTier.price && (
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Recommended Tier</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl">
        <p className="text-emerald-300 text-sm font-medium">
          Lead to Elite Package (${recommendedTier.price.toLocaleString()}) - {recommendedTier.readiness}% buy probability
        </p>
      </div>
    </div>
  );
}
