import { useState } from 'react';
import { MessageSquare, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, Target, Snowflake } from 'lucide-react';
import { comprehensiveObjections } from '../../data/objectionsData';

interface ObjectionWhisperComponentProps {
  prospectType: 'foreclosure' | 'tired-landlord' | 'probate-inherited';
}

export default function ObjectionWhisperComponent({ prospectType }: ObjectionWhisperComponentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const objections = comprehensiveObjections.filter(obj => obj.sellerType === prospectType);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-red-400 bg-red-500/10';
    if (probability >= 70) return 'text-orange-400 bg-orange-500/10';
    return 'text-cyan-400 bg-cyan-500/10';
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 backdrop-blur-sm border-2 border-blue-500/40 rounded-2xl p-8 h-full shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10">
        <Snowflake className="w-40 h-40 text-blue-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Snowflake className="w-10 h-10 text-blue-400 animate-pulse" />
          <h2 className="text-4xl font-bold text-blue-400">Objection Whispers</h2>
          <div className="ml-auto text-base text-gray-400 bg-blue-500/10 px-4 py-2 rounded-full font-semibold">
            {objections.length} Top Objections
          </div>
        </div>
        <p className="text-xl text-gray-400 mb-6 italic">Click to see Siren's recommendation</p>

        <div className="space-y-4">
          {objections.map((objection, index) => (
            <div
              key={objection.id}
              className={`bg-gray-800/40 rounded-xl border-2 transition-all transform hover:scale-105 ${
                expandedId === objection.id
                  ? 'border-blue-500/50 shadow-xl shadow-blue-500/20'
                  : 'border-gray-700/30 hover:border-blue-500/30'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(expandedId === objection.id ? null : objection.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-blue-400 font-bold text-xl">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-xl mb-2">
                        "{objection.objectionText}"
                      </div>
                      <div className={`inline-flex items-center gap-2 text-base px-3 py-1.5 rounded-lg ${getProbabilityColor(objection.probability)}`}>
                        <span className="font-bold">{objection.probability}%</span>
                        <span>likely</span>
                      </div>
                    </div>
                  </div>
                  {expandedId === objection.id ? (
                    <ChevronUp className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === objection.id && (
                <div className="px-5 pb-5 space-y-5 border-t-2 border-gray-700/30 pt-5">
                  {/* What They're Really Afraid Of */}
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-7 h-7 text-orange-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-orange-400 mb-2">What They Fear:</div>
                      <div className="text-lg text-gray-300 leading-relaxed">{objection.whatTheyreReallyAfraidOf}</div>
                    </div>
                  </div>

                  {/* Reframe */}
                  <div className="flex items-start gap-4">
                    <Lightbulb className="w-7 h-7 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-blue-400 mb-2">Reframe:</div>
                      <div className="text-lg text-gray-300 italic leading-relaxed">{objection.reframe}</div>
                    </div>
                  </div>

                  {/* Whisper Response */}
                  <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <MessageSquare className="w-7 h-7 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="text-lg font-bold text-cyan-400">Rebuttal Script:</div>
                    </div>
                    <div className="text-lg text-cyan-200 leading-relaxed">
                      "{objection.rebuttalScript}"
                    </div>
                  </div>

                  {/* Control Question */}
                  <div className="flex items-start gap-4">
                    <Target className="w-7 h-7 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-blue-400 mb-2">Control Question:</div>
                      <div className="text-lg text-blue-200 italic leading-relaxed">"{objection.controlQuestion}"</div>
                    </div>
                  </div>

                  {/* Why It Works */}
                  <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-5">
                    <div className="text-lg font-bold text-green-400 mb-3">Why It Works:</div>
                    <div className="space-y-2">
                      {objection.whyItWorks.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="text-green-400 text-lg mt-0.5">✓</span>
                          <span className="text-base text-gray-300">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
