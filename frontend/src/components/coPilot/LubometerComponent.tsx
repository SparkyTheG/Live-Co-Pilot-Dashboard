import { LubometerInterpretation } from '../../data/coPilotData';
import { Snowflake, Target, BookOpen, Flame } from 'lucide-react';

interface LubometerComponentProps {
  interpretation: LubometerInterpretation;
  value: number;
  onChange: (value: number) => void;
}

export default function LubometerComponent({ interpretation, value, onChange }: LubometerComponentProps) {
  const getActiveLevel = () => {
    if (value <= 33) return 'low';
    if (value <= 66) return 'medium';
    return 'high';
  };

  const activeLevel = getActiveLevel();

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-950 backdrop-blur-sm border-2 border-cyan-400/40 rounded-2xl p-8 h-full shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10">
        <Snowflake className="w-40 h-40 text-cyan-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Snowflake className="w-10 h-10 text-cyan-400 animate-pulse" />
          <h2 className="text-4xl font-bold text-cyan-400">Lubometer</h2>
        </div>
        <div className="flex items-center justify-between mb-8">
          <p className="text-xl text-gray-400 italic">Prospect readiness level</p>
          <div className="text-3xl font-bold text-cyan-400">{value}%</div>
        </div>

        <div className="space-y-6">
          <div className={`bg-gradient-to-r from-red-950/50 to-red-900/30 border-2 rounded-xl p-6 transform transition-all ${
            activeLevel === 'low'
              ? 'border-red-400 scale-105 animate-pulse shadow-2xl shadow-red-500/50'
              : 'border-red-500/40 hover:scale-105'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full bg-red-500 ${activeLevel === 'low' ? 'animate-ping absolute' : ''}`}></div>
              <div className="w-6 h-6 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
              <span className="text-2xl font-bold text-red-400">LOW {activeLevel === 'low' && '← CURRENT'}</span>
            </div>
            <p className="text-lg text-gray-200 leading-relaxed mb-4">{interpretation.low}</p>
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-red-300" />
                <span className="text-sm font-semibold text-red-300 uppercase tracking-wide">Action</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                Isolate objections, give homework materials to explore, set another meeting
              </p>
            </div>
          </div>

          <div className={`bg-gradient-to-r from-yellow-950/50 to-yellow-900/30 border-2 rounded-xl p-6 transform transition-all ${
            activeLevel === 'medium'
              ? 'border-yellow-400 scale-105 animate-pulse shadow-2xl shadow-yellow-500/50'
              : 'border-yellow-500/40 hover:scale-105'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full bg-yellow-500 ${activeLevel === 'medium' ? 'animate-ping absolute' : ''}`}></div>
              <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
              <span className="text-2xl font-bold text-yellow-400">MEDIUM {activeLevel === 'medium' && '← CURRENT'}</span>
            </div>
            <p className="text-lg text-gray-200 leading-relaxed mb-4">{interpretation.medium}</p>
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">Action</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                Address remaining concerns, trial close, build urgency
              </p>
            </div>
          </div>

          <div className={`bg-gradient-to-r from-green-950/50 to-green-900/30 border-2 rounded-xl p-6 transform transition-all ${
            activeLevel === 'high'
              ? 'border-green-400 scale-105 animate-pulse shadow-2xl shadow-green-500/50'
              : 'border-green-500/40 hover:scale-105'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full bg-green-500 ${activeLevel === 'high' ? 'animate-ping absolute' : ''}`}></div>
              <div className="w-6 h-6 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
              <span className="text-2xl font-bold text-green-400">HIGH {activeLevel === 'high' && '← CURRENT'}</span>
            </div>
            <p className="text-lg text-gray-200 leading-relaxed mb-4">{interpretation.high}</p>
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-green-300" />
                <span className="text-sm font-semibold text-green-300 uppercase tracking-wide">Action</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed font-semibold">
                Push the close
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
