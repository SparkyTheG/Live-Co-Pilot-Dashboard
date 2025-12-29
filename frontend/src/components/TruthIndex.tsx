import { Shield, CheckCircle2 } from 'lucide-react';

interface TruthIndexProps {
  score: number;
}

export default function TruthIndex({ score }: TruthIndexProps) {
  const getColorClass = () => {
    if (score >= 75) return 'from-emerald-500 to-green-400';
    if (score >= 50) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-orange-400';
  };

  const getLabel = () => {
    if (score >= 75) return 'High Honesty';
    if (score >= 50) return 'Moderate Honesty';
    return 'Low Honesty';
  };

  const getExplanation = () => {
    if (score >= 75)
      return 'Authentic, vulnerable responses. Low people-pleasing.';
    if (score >= 50)
      return 'Mostly honest with some guarded responses.';
    return 'Defensive patterns detected. Surface-level responses.';
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Shield className="w-7 h-7 text-emerald-400" />
          <div className="absolute inset-0 blur-md bg-emerald-400/30"></div>
        </div>
        <h2 className="text-2xl font-bold text-white">Truth Index™</h2>
      </div>

      <div className="text-center mb-6">
        <div className={`text-6xl font-bold bg-gradient-to-r ${getColorClass()} bg-clip-text text-transparent mb-2`}>
          {score}%
        </div>
        <div className="text-xl text-white font-semibold mb-2">{getLabel()}</div>
        <div className="w-full bg-gray-800/50 rounded-full h-4 overflow-hidden mb-4">
          <div
            className={`h-full bg-gradient-to-r ${getColorClass()} transition-all duration-500`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <p className="text-emerald-300 text-sm leading-relaxed">
          {getExplanation()}
        </p>
      </div>
    </div>
  );
}
