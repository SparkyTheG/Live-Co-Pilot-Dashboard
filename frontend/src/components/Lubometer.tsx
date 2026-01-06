import { DollarSign, TrendingUp, Zap } from 'lucide-react';
import { LubometerTier } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface LubometerProps {
  tiers: LubometerTier[];
}

export default function Lubometer({ tiers }: LubometerProps) {
  const { settings } = useSettings();
  
  // Use settings price tiers as defaults, merge with incoming readiness data
  const defaultTiers: LubometerTier[] = settings.priceTiers.map(t => ({
    price: t.price,
    readiness: 0,
    label: t.label,
  }));
  
  // Merge incoming tiers with settings (match by index, use settings labels/prices)
  const displayTiers = defaultTiers.map((defaultTier, index) => {
    const incomingTier = tiers?.[index];
    return {
      ...defaultTier,
      readiness: incomingTier?.readiness ?? 0,
    };
  });
  
  const hasData = tiers && tiers.length > 0 && tiers.some(t => t.readiness > 0);

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 80) return 'from-emerald-500 to-green-400';
    if (readiness >= 60) return 'from-cyan-500 to-teal-400';
    if (readiness >= 40) return 'from-amber-500 to-yellow-400';
    if (readiness > 0) return 'from-blue-500 to-indigo-400';
    return 'from-gray-600 to-gray-500';
  };

  const getReadinessLabel = (readiness: number) => {
    if (readiness >= 80) return 'High Propensity';
    if (readiness >= 60) return 'Good Interest';
    if (readiness >= 40) return 'Moderate';
    if (readiness > 0) return 'Low Readiness';
    return 'Analyzing...';
  };

  const recommendedTier = displayTiers.reduce((prev, current) =>
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
        {hasData && (
          <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {displayTiers.map((tier) => (
          <div
            key={tier.price}
            className={`p-4 rounded-xl border transition-all duration-500 ${
              hasData && tier.price === recommendedTier.price && recommendedTier.readiness > 0
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
                <div className={`text-2xl font-bold bg-gradient-to-r ${getReadinessColor(tier.readiness)} bg-clip-text text-transparent transition-all duration-500`}>
                  {tier.readiness}%
                </div>
                <div className="text-xs text-gray-400">{getReadinessLabel(tier.readiness)}</div>
              </div>
            </div>

            <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getReadinessColor(tier.readiness)} transition-all duration-700 ease-out`}
                style={{ width: `${Math.max(tier.readiness, 2)}%` }}
              ></div>
            </div>

            {hasData && tier.price === recommendedTier.price && recommendedTier.readiness > 0 && (
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Recommended Tier</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`mt-6 p-4 rounded-xl transition-all duration-500 ${
        hasData 
          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30' 
          : 'bg-gray-800/30 border border-gray-700/30'
      }`}>
        <p className={`text-sm font-medium ${hasData ? 'text-emerald-300' : 'text-gray-400'}`}>
          {hasData 
            ? `Lead to ${recommendedTier.label} Package ($${recommendedTier.price.toLocaleString()}) - ${recommendedTier.readiness}% buy probability`
            : 'Start recording to analyze buying readiness'
          }
        </p>
      </div>
    </div>
  );
}
