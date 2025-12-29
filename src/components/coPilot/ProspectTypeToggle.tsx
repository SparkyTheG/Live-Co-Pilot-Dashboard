import { ProspectType, prospectTypes } from '../../data/coPilotData';
import { Snowflake } from 'lucide-react';

interface ProspectTypeToggleProps {
  selectedType: ProspectType;
  onTypeChange: (type: ProspectType) => void;
}

export default function ProspectTypeToggle({ selectedType, onTypeChange }: ProspectTypeToggleProps) {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-cyan-950 backdrop-blur-sm border-2 border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-2 right-2 opacity-10">
        <Snowflake className="w-24 h-24 text-cyan-400" />
      </div>

      <div className="relative z-10 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Snowflake className="w-7 h-7 text-cyan-400 animate-pulse" />
          <span className="text-xl font-bold text-cyan-400 whitespace-nowrap">Prospect Type</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {prospectTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`px-5 py-2.5 rounded-xl transition-all whitespace-nowrap transform hover:scale-105 ${
                selectedType === type.id
                  ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20'
                  : 'bg-gray-800/40 border-2 border-gray-700/50 text-gray-400 hover:border-cyan-500/50 hover:text-gray-300'
              }`}
            >
              <div className="font-semibold">{type.shortLabel}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
