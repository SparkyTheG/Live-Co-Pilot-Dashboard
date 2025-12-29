import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Phone, DollarSign, Target, Clock, Activity, Award, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { SalesManagerProfile, CloserOverview } from '../types';

interface SalesManagerDashboardProps {
  profile: SalesManagerProfile;
  onCloserClick: (closerId: string) => void;
  onBack?: () => void;
}

export default function SalesManagerDashboard({ profile, onCloserClick, onBack }: SalesManagerDashboardProps) {
  const getTendencyColor = (tendency: string) => {
    switch (tendency) {
      case 'evolving':
        return 'from-teal-500 to-emerald-500';
      case 'stable':
        return 'from-blue-500 to-cyan-500';
      case 'burning-out':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTendencyIcon = (tendency: string) => {
    switch (tendency) {
      case 'evolving':
        return <TrendingUp className="w-5 h-5" />;
      case 'stable':
        return <Minus className="w-5 h-5" />;
      case 'burning-out':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getTendencyLabel = (tendency: string) => {
    switch (tendency) {
      case 'evolving':
        return 'Evolving';
      case 'stable':
        return 'Stable';
      case 'burning-out':
        return 'Burning Out';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-teal-500';
      case 'on-call':
        return 'bg-blue-500 animate-pulse';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBurnoutAlerts = (closer: CloserOverview) => {
    return closer.burnoutIndicators.filter(
      indicator => indicator.status === 'warning' || indicator.status === 'critical'
    );
  };

  const getCriticalAlerts = (closer: CloserOverview) => {
    return closer.burnoutIndicators.filter(indicator => indicator.status === 'critical');
  };

  const getHighVulnerabilities = (closer: CloserOverview) => {
    return closer.vulnerabilities.filter(v => v.severity === 'high');
  };

  const totalAlerts = profile.closers.reduce((sum, closer) => {
    return sum + getCriticalAlerts(closer).length + getHighVulnerabilities(closer).length;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8">
      <div className="max-w-[1800px] mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        )}
        <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 p-1">
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                <p className="text-gray-400 text-lg mb-3">Sales Manager - {profile.company}</p>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-teal-500/10 border border-teal-400/30 rounded-lg">
                    <span className="text-teal-400 font-bold text-lg">{profile.teamSize}</span>
                    <span className="text-gray-400 text-sm ml-2">Closers</span>
                  </div>
                  {totalAlerts > 0 && (
                    <div className="px-4 py-2 bg-red-500/10 border border-red-400/30 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-bold text-lg">{totalAlerts}</span>
                      <span className="text-gray-400 text-sm">Critical Alerts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {profile.closers.map(closer => (
                <div
                  key={closer.id}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-700 overflow-hidden">
                      <img src={closer.photo} alt={closer.name} className="w-full h-full object-cover" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(closer.status)} rounded-full border-2 border-gray-900`}></div>
                  </div>
                  <span className="text-xs text-gray-400">{closer.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {profile.closers.map(closer => {
            const burnoutAlerts = getBurnoutAlerts(closer);
            const criticalAlerts = getCriticalAlerts(closer);
            const highVulnerabilities = getHighVulnerabilities(closer);

            return (
              <div
                key={closer.id}
                onClick={() => onCloserClick(closer.id)}
                className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-400/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 p-0.5">
                        <img
                          src={closer.photo}
                          alt={closer.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(closer.status)} rounded-full border-2 border-gray-900`}></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {closer.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{closer.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{closer.lastActivity}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 bg-gradient-to-r ${getTendencyColor(closer.tendency)} rounded-lg flex items-center gap-2`}>
                    {getTendencyIcon(closer.tendency)}
                    <span className="text-white font-semibold text-sm">
                      {getTendencyLabel(closer.tendency)}
                    </span>
                  </div>
                </div>

                {(criticalAlerts.length > 0 || highVulnerabilities.length > 0) && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-semibold">Critical Alerts</span>
                    </div>
                    <div className="space-y-1">
                      {criticalAlerts.map((alert, idx) => (
                        <div key={idx} className="text-gray-300 text-sm">
                          • {alert.metric}: {alert.value}
                        </div>
                      ))}
                      {highVulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="text-gray-300 text-sm">
                          • High Risk: {vuln.area}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {burnoutAlerts.length > 0 && criticalAlerts.length === 0 && (
                  <div className="mb-4 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <span className="text-orange-400 font-semibold">Warnings</span>
                    </div>
                    <div className="space-y-1">
                      {burnoutAlerts.map((alert, idx) => (
                        <div key={idx} className="text-gray-300 text-sm">
                          • {alert.metric}: {alert.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="p-3 bg-gray-800/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-gray-400">Close Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{closer.metrics.closeRate}%</div>
                  </div>
                  <div className="p-3 bg-gray-800/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-400">Avg Deal</span>
                    </div>
                    <div className="text-lg font-bold text-white">${(closer.metrics.avgDealValue / 1000).toFixed(1)}k</div>
                  </div>
                  <div className="p-3 bg-gray-800/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">This Month</span>
                    </div>
                    <div className="text-lg font-bold text-white">{closer.metrics.callsThisMonth}</div>
                  </div>
                  <div className="p-3 bg-gray-800/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-400">Avg Time</span>
                    </div>
                    <div className="text-sm font-bold text-white">{closer.metrics.avgCallDuration}</div>
                  </div>
                </div>

                <div className="border-t border-gray-700/40 pt-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-teal-400" />
                    <h4 className="text-white font-semibold">Top Strengths</h4>
                  </div>
                  <div className="space-y-2">
                    {closer.strengths.slice(0, 2).map((strength, idx) => (
                      <div key={idx} className="p-2 bg-teal-500/5 border border-teal-400/20 rounded-lg">
                        <div className="text-teal-400 text-sm font-medium mb-1">{strength.area}</div>
                        <div className="text-gray-400 text-xs">{strength.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-700/40 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-5 h-5 text-orange-400" />
                    <h4 className="text-white font-semibold">Areas to Work On</h4>
                  </div>
                  <div className="space-y-2">
                    {closer.vulnerabilities.slice(0, 2).map((vuln, idx) => (
                      <div key={idx} className={`p-2 rounded-lg ${
                        vuln.severity === 'high'
                          ? 'bg-red-500/10 border border-red-400/30'
                          : 'bg-orange-500/5 border border-orange-400/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`text-sm font-medium ${
                            vuln.severity === 'high' ? 'text-red-400' : 'text-orange-400'
                          }`}>
                            {vuln.area}
                          </div>
                          {vuln.severity === 'high' && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 rounded text-red-300">
                              High Priority
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs">{vuln.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {closer.activeCalls > 0 && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="text-blue-400 font-medium">Currently on call</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
