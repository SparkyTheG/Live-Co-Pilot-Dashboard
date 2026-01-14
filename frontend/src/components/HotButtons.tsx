import { Activity } from 'lucide-react';

interface EmotionalLevers {
  riskTolerance?: number;
  fearOfFailure?: number;
  urgency?: number;
  familyPressure?: number;
  desireForCertainty?: number;
}

interface HotButtonsProps {
  emotionalLevers?: EmotionalLevers;
}

export default function HotButtons({ emotionalLevers }: HotButtonsProps) {
  // Define the 5 emotional levers with their properties
  const levers = [
    {
      key: 'riskTolerance' as keyof EmotionalLevers,
      label: 'Risk Tolerance',
      description: 'Willingness to take bold action',
      lowLabel: 'Risk-Averse',
      highLabel: 'Risk-Ready',
      icon: '⚡',
      color: { low: 'from-red-500 to-orange-500', mid: 'from-orange-500 to-yellow-500', high: 'from-yellow-500 to-green-500' }
    },
    {
      key: 'fearOfFailure' as keyof EmotionalLevers,
      label: 'Fear of Failure',
      description: 'Anxiety about making wrong decision',
      lowLabel: 'Confident',
      highLabel: 'Paralyzed',
      icon: '🎯',
      color: { low: 'from-green-500 to-emerald-500', mid: 'from-yellow-500 to-orange-500', high: 'from-orange-500 to-red-500' }
    },
    {
      key: 'urgency' as keyof EmotionalLevers,
      label: 'Urgency',
      description: 'Time pressure and deadline stress',
      lowLabel: 'Relaxed',
      highLabel: 'Critical',
      icon: '⏱️',
      color: { low: 'from-blue-500 to-cyan-500', mid: 'from-cyan-500 to-yellow-500', high: 'from-yellow-500 to-red-500' }
    },
    {
      key: 'familyPressure' as keyof EmotionalLevers,
      label: 'Family Pressure',
      description: 'Influence from spouse/family',
      lowLabel: 'Independent',
      highLabel: 'Dependent',
      icon: '👨‍👩‍👧‍👦',
      color: { low: 'from-purple-500 to-blue-500', mid: 'from-blue-500 to-cyan-500', high: 'from-cyan-500 to-emerald-500' }
    },
    {
      key: 'desireForCertainty' as keyof EmotionalLevers,
      label: 'Desire for Certainty',
      description: 'Need for guarantees and proof',
      lowLabel: 'Trusting',
      highLabel: 'Skeptical',
      icon: '🔒',
      color: { low: 'from-emerald-500 to-teal-500', mid: 'from-teal-500 to-cyan-500', high: 'from-cyan-500 to-blue-500' }
    }
  ];

  const getColorGradient = (value: number, colorSet: { low: string; mid: string; high: string }) => {
    if (value <= 3) return colorSet.low;
    if (value <= 7) return colorSet.mid;
    return colorSet.high;
  };

  const getIntensityLabel = (value: number): string => {
    if (value <= 2) return 'Very Low';
    if (value <= 4) return 'Low';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'High';
    return 'Very High';
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-7 h-7 text-orange-400" />
            <div className="absolute inset-0 blur-md bg-orange-400/30"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Hot Buttons</h2>
            <p className="text-sm text-gray-400 mt-1">Emotional levers to press right now</p>
          </div>
        </div>
      </div>

      {/* Emotional Levers List */}
      <div className="space-y-5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
        {!emotionalLevers || Object.keys(emotionalLevers).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-2">No emotional data detected yet.</p>
            <p className="text-sm">Start recording to analyze emotional levers.</p>
          </div>
        ) : (
          levers.map((lever) => {
            const value = emotionalLevers[lever.key] || 0;
            const percentage = (value / 10) * 100;
            const gradient = getColorGradient(value, lever.color);
            const intensity = getIntensityLabel(value);

            return (
              <div
                key={lever.key}
                className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 transition-all duration-300 hover:border-gray-600/60"
              >
                {/* Lever Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{lever.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{lever.label}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{lever.description}</p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                      {value.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">{intensity}</div>
                  </div>
                </div>

                {/* Heat Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-700/30 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 relative`}
                      style={{ width: `${percentage}%` }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  
                  {/* Scale labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{lever.lowLabel}</span>
                    <span>{lever.highLabel}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Message - Shows Highest Scoring Lever */}
      {emotionalLevers && Object.keys(emotionalLevers).length > 0 && (() => {
        // Find the highest scoring emotional lever
        const leversList = [
          { key: 'riskTolerance', label: 'Risk Tolerance', value: emotionalLevers.riskTolerance || 0 },
          { key: 'fearOfFailure', label: 'Fear of Failure', value: emotionalLevers.fearOfFailure || 0 },
          { key: 'urgency', label: 'Urgency', value: emotionalLevers.urgency || 0 },
          { key: 'familyPressure', label: 'Family Pressure', value: emotionalLevers.familyPressure || 0 },
          { key: 'desireForCertainty', label: 'Desire for Certainty', value: emotionalLevers.desireForCertainty || 0 }
        ];
        
        const highestLever = leversList.reduce((max, lever) => 
          lever.value > max.value ? lever : max
        , leversList[0]);
        
        return (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 text-center italic">
              🎯 <span className="text-gray-400">Press </span>
              <span className="text-orange-400 font-bold uppercase">{highestLever.label}</span>
              <span className="text-gray-400"> emotional lever right now</span>
            </p>
          </div>
        );
      })()}
    </div>
  );
}
