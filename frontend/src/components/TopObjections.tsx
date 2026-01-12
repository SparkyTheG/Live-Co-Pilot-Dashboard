import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, MessageSquare, Target, Sparkles } from 'lucide-react';

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
  const [expandedObjection, setExpandedObjection] = useState<string | null>(null);

  const makeStableId = (text: string) => {
    const t = String(text || '').toLowerCase().trim();
    // Stable key so expanded state survives resorting and progressive updates.
    // Keep it short but deterministic.
    return `obj-${t.replace(/\s+/g, ' ').slice(0, 60)}`;
  };

  // Use real-time objections only - no static fallback (show all, not limited to 5)
  const objectionsToDisplay = realTimeObjections && realTimeObjections.length > 0
    ? realTimeObjections.map((obj) => ({
        id: makeStableId(obj.objectionText),
        objectionText: obj.objectionText,
        probability: Math.round(obj.probability * 100),
        whatTheyreReallyAfraidOf: obj.fear,
        reframe: obj.whisper,
        rebuttalScript: obj.rebuttalScript,
        controlQuestion: '',
        whyItWorks: [],
        advanceQuestion: ''
      }))
    : [];

  const getColorClass = (probability: number, type: 'gradient' | 'text' | 'border' | 'glow') => {
    if (probability >= 80) {
      return {
        gradient: 'from-cyan-500 to-teal-500',
        text: 'text-cyan-400',
        border: 'border-cyan-400/50',
        glow: 'shadow-cyan-500/20'
      }[type];
    }
    if (probability >= 70) {
      return {
        gradient: 'from-teal-500 to-cyan-500',
        text: 'text-teal-400',
        border: 'border-teal-400/50',
        glow: 'shadow-teal-500/20'
      }[type];
    }
    return {
      gradient: 'from-blue-500 to-cyan-500',
      text: 'text-blue-400',
      border: 'border-blue-400/50',
      glow: 'shadow-blue-500/20'
    }[type];
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-7 h-7 text-cyan-400" />
            <div className="absolute inset-0 blur-md bg-cyan-400/30"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Top Objections</h2>
            <p className="text-sm text-gray-400 mt-1">Objections with handling strategies</p>
          </div>
        </div>
        {objectionsToDisplay.length > 0 && (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
            {objectionsToDisplay.length} detected
          </span>
        )}
      </div>

      {/* Objections List - Scrollable */}
      <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
        {objectionsToDisplay.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No objections detected yet. Start recording to see real-time analysis.
          </div>
        )}
        {objectionsToDisplay.map((objection, index) => (
          <div
            key={objection.id}
            className={`bg-gray-800/40 border-2 rounded-xl transition-all duration-300 ${
              expandedObjection === objection.id
                ? `${getColorClass(objection.probability, 'border')} shadow-lg ${getColorClass(objection.probability, 'glow')}`
                : 'border-gray-700/40 hover:border-gray-600/60'
            }`}
          >
            {/* Objection Header */}
            <button
              onClick={() => setExpandedObjection(expandedObjection === objection.id ? null : objection.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <span className={`text-2xl font-bold ${getColorClass(objection.probability, 'text')}`}>
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-white font-medium text-lg">{objection.objectionText}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">Probability:</span>
                      <span className={`text-sm font-bold ${getColorClass(objection.probability, 'text')}`}>
                        {objection.probability}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getColorClass(objection.probability, 'text')}`}>
                    {objection.probability}%
                  </span>
                  {expandedObjection === objection.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Probability Bar */}
              <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getColorClass(objection.probability, 'gradient')} transition-all duration-500`}
                  style={{ width: `${objection.probability}%` }}
                ></div>
              </div>
            </button>

                {/* Expanded Content */}
            {expandedObjection === objection.id && (
              <div className="px-4 pb-4 space-y-4 animate-slide-down">
                {/* What They're Really Afraid Of */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-cyan-300 font-bold text-sm mb-1">What They're Really Afraid Of:</h4>
                      <p className="text-gray-300 text-sm">
                        {objection.whatTheyreReallyAfraidOf || 'Generating…'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reframe / Whisper */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-blue-300 font-bold text-sm mb-1">Whisper / Reframe:</h4>
                      <p className="text-gray-300 text-sm italic">
                        {objection.reframe || 'Generating…'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rebuttal Script */}
                  <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-400/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-teal-300 font-bold text-sm mb-2">Rebuttal Script:</h4>
                        <p className="text-gray-200 text-sm leading-relaxed bg-gray-900/40 p-3 rounded border border-teal-400/20">
                        "{objection.rebuttalScript || 'Generating…'}"
                        </p>
                    </div>
                  </div>
                </div>

                {/* Control Question */}
                {objection.controlQuestion && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-blue-300 font-bold text-sm mb-2">Control Question:</h4>
                        <p className="text-gray-200 text-sm italic">"{objection.controlQuestion}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Why It Works */}
                {objection.whyItWorks && objection.whyItWorks.length > 0 && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg p-4">
                    <h4 className="text-green-300 font-bold text-sm mb-2">Why It Works:</h4>
                    <ul className="space-y-1">
                      {objection.whyItWorks.map((reason, idx) => (
                        <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advance Question */}
                {objection.advanceQuestion && (
                  <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-400/30 rounded-lg p-4">
                    <h4 className="text-teal-300 font-bold text-sm mb-2">Advance Question:</h4>
                    <p className="text-gray-200 text-sm italic">"{objection.advanceQuestion}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Training Note */}
      <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-400/30 rounded-xl">
        <p className="text-cyan-300 text-sm font-medium">
          💡 <span className="font-bold">Training Tip:</span> You're not overcoming objections — you're resolving fear with structure and clarity.
        </p>
      </div>
    </div>
  );
}
