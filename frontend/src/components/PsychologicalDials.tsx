import { Brain } from 'lucide-react';
import { PsychologicalDial } from '../types';

interface PsychologicalDialsProps {
  dials: PsychologicalDial[];
}

export default function PsychologicalDials({ dials }: PsychologicalDialsProps) {
  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Brain className="w-7 h-7 text-purple-400" />
          <div className="absolute inset-0 blur-md bg-purple-400/30"></div>
        </div>
        <h2 className="text-2xl font-bold text-white">Top 5 Psychological Dials</h2>
      </div>

      <div className="space-y-4">
        {dials.map((dial, index) => (
          <div
            key={dial.name}
            className="p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl hover:border-gray-600/60 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-white/50 font-bold text-lg">#{index + 1}</span>
                <span className="text-white font-medium">{dial.name}</span>
              </div>
              <span className={`text-xl font-bold bg-gradient-to-r ${dial.color} bg-clip-text text-transparent`}>
                {dial.intensity}%
              </span>
            </div>

            <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${dial.color} transition-all duration-500`}
                style={{ width: `${dial.intensity}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
