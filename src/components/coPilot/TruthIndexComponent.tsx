import { TruthSignals } from '../../data/coPilotData';
import { CheckCircle2, XCircle, Snowflake } from 'lucide-react';
import PostCallDebriefButton from './PostCallDebriefButton';

interface TruthIndexComponentProps {
  truthIndex: TruthSignals;
  currentDialValues: {
    urgency: number;
    trust: number;
    authority: number;
    structure: number;
  };
  lubometer: number;
  prospectType: string;
  onOpenDebrief: () => void;
}

export default function TruthIndexComponent({
  truthIndex,
  currentDialValues,
  lubometer,
  prospectType,
  onOpenDebrief
}: TruthIndexComponentProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 backdrop-blur-sm border-2 border-emerald-500/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10">
        <Snowflake className="w-40 h-40 text-emerald-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Snowflake className="w-10 h-10 text-emerald-400 animate-pulse" />
          <h2 className="text-4xl font-bold text-emerald-400">Truth Index</h2>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold text-green-400">Truth Signals</h3>
            </div>
            <div className="space-y-4">
              {truthIndex.signals.map((signal, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-5 bg-gradient-to-r from-green-950/50 to-green-900/30 border-2 border-green-500/40 rounded-xl transform hover:scale-105 transition-transform"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-lg text-gray-200 leading-relaxed">{signal}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
              <h3 className="text-2xl font-bold text-red-400">Red Flags</h3>
            </div>
            <div className="space-y-4">
              {truthIndex.redFlags.map((flag, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-5 bg-gradient-to-r from-red-950/50 to-red-900/30 border-2 border-red-500/40 rounded-xl transform hover:scale-105 transition-transform"
                >
                  <XCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-lg text-gray-200 leading-relaxed">{flag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PostCallDebriefButton onClick={onOpenDebrief} />
      </div>
    </div>
  );
}
