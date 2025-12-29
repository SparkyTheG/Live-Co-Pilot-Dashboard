import { MessageSquare, Sparkles } from 'lucide-react';
import { Objection, ScriptStep } from '../types';

interface WhisperEngineProps {
  objections: Objection[];
  selectedObjection: string | null;
  onSelectObjection: (id: string) => void;
  script: any;
  onObjectionClick?: (objectionId: string) => void;
}

export default function WhisperEngine({
  objections,
  selectedObjection,
  onSelectObjection,
  script,
  onObjectionClick,
}: WhisperEngineProps) {
  const handleObjectionClick = (id: string) => {
    onSelectObjection(id);
    if (onObjectionClick) {
      onObjectionClick(id);
    }
  };
  const getColorClass = (probability: number) => {
    if (probability >= 70) return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40';
    if (probability >= 50) return 'from-teal-500/20 to-cyan-500/20 border-teal-500/40';
    return 'from-blue-500/20 to-indigo-500/20 border-blue-500/40';
  };

  const getTextColor = (probability: number) => {
    if (probability >= 70) return 'text-cyan-400';
    if (probability >= 50) return 'text-teal-400';
    return 'text-blue-400';
  };

  const getBarColor = (probability: number) => {
    if (probability >= 70) return 'bg-gradient-to-r from-cyan-500 to-blue-500';
    if (probability >= 50) return 'bg-gradient-to-r from-teal-500 to-cyan-500';
    return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-radial from-teal-500/30 via-transparent to-transparent blur-3xl -z-10 animate-energy-pulse"></div>
      <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-teal-500/20 blur-2xl -z-10 animate-pulse"></div>

      <div className="absolute top-4 right-4 w-2 h-2 bg-teal-400 rounded-full animate-particle-float"></div>
      <div className="absolute top-12 right-12 w-1 h-1 bg-cyan-400 rounded-full animate-particle-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-teal-300 rounded-full animate-particle-float" style={{ animationDelay: '2s' }}></div>

      <div className="relative backdrop-blur-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-2 border-teal-400/50 rounded-3xl p-8 shadow-2xl shadow-teal-500/20 glow-teal-strong hex-grid">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 h-1 rounded-t-3xl"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-teal-400 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-teal-400/60"></div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white text-glow">Whisper™ Engine</h2>
              <p className="text-xs text-teal-300/70 font-semibold tracking-wider uppercase mt-1">AI-Powered Intelligence</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/40 rounded-full">
            <span className="text-teal-300 text-sm font-bold tracking-wide">LIVE INTEL</span>
          </div>
        </div>

        <p className="text-teal-300/80 mb-6 flex items-center gap-2">
          <span className="text-cyan-400">👆</span>
          Click an objection to see personalized handling script:
        </p>

        <div className="space-y-3 mb-8">
          {objections.map((objection, index) => (
            <button
              key={objection.id}
              onClick={() => handleObjectionClick(objection.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:glow-teal-strong ${
                selectedObjection === objection.id
                  ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-teal-400/60 glow-teal-strong'
                  : `bg-gradient-to-r ${getColorClass(objection.probability)} hover:border-teal-400/40`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-white/60 font-semibold">{index + 1}</span>
                  <span className="text-white font-medium">{objection.text}</span>
                </div>
                <span className={`text-lg font-bold ${getTextColor(objection.probability)}`}>
                  {objection.probability}%
                </span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getBarColor(objection.probability)} transition-all duration-500`}
                  style={{ width: `${objection.probability}%` }}
                ></div>
              </div>
            </button>
          ))}
        </div>

        {script ? (
          <div className="animate-slide-up border-t border-teal-400/20 pt-6">
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-400/40 rounded-2xl p-6 glow-teal">
              <div className="flex items-start gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-teal-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-teal-300 mb-1">{script.title}</h3>
                  <div className="text-sm space-y-1">
                    <p className="text-cyan-400">
                      <span className="text-white/60">Trigger:</span> {script.dialTrigger}
                    </p>
                    <p className="text-cyan-400">
                      <span className="text-white/60">Truth Level:</span> {script.truthLevel}%
                    </p>
                    <p className="text-cyan-400">
                      <span className="text-white/60">Money Style:</span> {script.moneyStyle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {script.steps.map((step: ScriptStep) => (
                  <div key={step.step} className="bg-gray-900/60 rounded-lg p-4 border border-teal-400/20">
                    <div className="flex items-start gap-3">
                      <span className="text-teal-400 font-bold text-lg flex-shrink-0">
                        {step.step}.
                      </span>
                      <div className="flex-1">
                        <p className="text-white leading-relaxed mb-2">{step.text}</p>
                        {step.pause && (
                          <p className="text-cyan-400/70 text-sm italic">
                            (Pause {step.pause})
                          </p>
                        )}
                        {step.note && (
                          <p className="text-cyan-400/80 text-sm mt-2 flex items-start gap-2">
                            <span className="text-cyan-400">⚡</span>
                            <span>{step.note}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-teal-400/20 pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-16 h-16 text-teal-400/30 mb-4" />
              <p className="text-white/50 text-lg">
                Select an objection above to see your personalized handling script
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
