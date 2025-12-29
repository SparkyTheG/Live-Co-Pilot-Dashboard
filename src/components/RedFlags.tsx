import { AlertTriangle } from 'lucide-react';
import { RedFlag } from '../types';

interface RedFlagsProps {
  flags: RedFlag[];
}

export default function RedFlags({ flags }: RedFlagsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 border-red-500/40 text-red-300';
      case 'medium':
        return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
      case 'low':
        return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      default:
        return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <AlertTriangle className="w-7 h-7 text-red-400" />
          <div className="absolute inset-0 blur-md bg-red-400/30"></div>
        </div>
        <h2 className="text-2xl font-bold text-white">Red Flags</h2>
      </div>

      {flags.length > 0 ? (
        <div className="space-y-3">
          {flags.map((flag, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getSeverityColor(flag.severity)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{getSeverityIcon(flag.severity)}</span>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{flag.text}</p>
                  <div className="mt-2">
                    <span className="text-xs uppercase font-semibold tracking-wide opacity-70">
                      {flag.severity} severity
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">No red flags detected</p>
        </div>
      )}
    </div>
  );
}
