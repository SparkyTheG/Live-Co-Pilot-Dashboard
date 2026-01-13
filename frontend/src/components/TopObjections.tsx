import { AlertTriangle } from 'lucide-react';

interface RealTimeObjection {
  objectionText: string;
  fear: string;
  whisper: string;
  probability: number;
  rebuttalScript: string;
}

interface TopObjectionsProps {
  realTimeObjections?: RealTimeObjection[];
}

export default function TopObjections({ realTimeObjections }: TopObjectionsProps) {
  // Show only TOP 3 objections, sorted by probability
  const top3Objections = (realTimeObjections || [])
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  // Extract one-sentence versions from multi-sentence content
  const getFirstSentence = (text: string): string => {
    if (!text) return '';
    const cleaned = text.trim();
    // Split by period, exclamation, or question mark followed by space or end
    const match = cleaned.match(/^[^.!?]+[.!?](?:\s|$)/);
    if (match) return match[0].trim();
    // If no sentence ending found, take first 100 chars
    return cleaned.length > 100 ? cleaned.slice(0, 97) + '...' : cleaned;
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className="w-7 h-7 text-red-400" />
            <div className="absolute inset-0 blur-md bg-red-400/30"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Top Objections Right Now</h2>
            <p className="text-sm text-gray-400 mt-1">Live predicted objections</p>
          </div>
        </div>
        {top3Objections.length > 0 && (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
            Top {top3Objections.length}
          </span>
        )}
      </div>

      {/* Top 3 Objections List */}
      <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
        {top3Objections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-2">No objections detected yet.</p>
            <p className="text-sm">Start recording to see live predictions.</p>
          </div>
        ) : (
          top3Objections.map((objection, index) => {
            const probability = Math.round(objection.probability * 100);
            
            // Color coding based on probability
            const getColor = () => {
              if (probability >= 80) return {
                bg: 'from-red-600/20 to-orange-600/20',
                border: 'border-red-400/50',
                text: 'text-red-400',
                badge: 'bg-red-500/20 text-red-300'
              };
              if (probability >= 70) return {
                bg: 'from-orange-600/20 to-yellow-600/20',
                border: 'border-orange-400/50',
                text: 'text-orange-400',
                badge: 'bg-orange-500/20 text-orange-300'
              };
              return {
                bg: 'from-yellow-600/20 to-amber-600/20',
                border: 'border-yellow-400/50',
                text: 'text-yellow-400',
                badge: 'bg-yellow-500/20 text-yellow-300'
              };
            };
            
            const color = getColor();

            return (
              <div
                key={`objection-${index}`}
                className={`bg-gradient-to-br ${color.bg} border-2 ${color.border} rounded-xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl`}
              >
                {/* Objection Title with Rank */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${color.badge} flex items-center justify-center font-bold text-lg`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${color.text} leading-tight`}>
                        {objection.objectionText}
                      </h3>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 px-3 py-1 ${color.badge} rounded-full text-sm font-bold ml-3`}>
                    {probability}%
                  </div>
                </div>

                {/* Three Key Insights */}
                <div className="space-y-3">
                  {/* Diagnosis (Fear) */}
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-cyan-300 font-semibold text-xs uppercase tracking-wide">Diagnosis:</span>
                      <p className="text-gray-200 text-sm mt-1">
                        {getFirstSentence(objection.fear) || 'Fear not identified yet'}
                      </p>
                    </div>
                  </div>

                  {/* Emotional Driver (Whisper) */}
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-purple-300 font-semibold text-xs uppercase tracking-wide">Emotional Driver:</span>
                      <p className="text-gray-200 text-sm italic mt-1">
                        {getFirstSentence(objection.whisper) || 'Analyzing emotional state...'}
                      </p>
                    </div>
                  </div>

                  {/* Rebuttal */}
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-emerald-300 font-semibold text-xs uppercase tracking-wide">Rebuttal:</span>
                      <p className="text-gray-200 text-sm mt-1 font-medium">
                        {getFirstSentence(objection.rebuttalScript) || 'Generating rebuttal...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Whispering Angel Tagline */}
      {top3Objections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 text-center italic">
            💡 <span className="text-gray-400">The whispering angel — making weak closers look dangerous</span>
          </p>
        </div>
      )}
    </div>
  );
}
