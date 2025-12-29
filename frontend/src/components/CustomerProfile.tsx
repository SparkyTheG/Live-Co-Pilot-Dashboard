import { Building2, Mail, Phone, MapPin, Linkedin, Calendar, DollarSign, ArrowLeft, Upload, Play, CheckCircle, Clock } from 'lucide-react';
import { CustomerProfile as CustomerProfileType } from '../types';

interface CustomerProfileProps {
  profile: CustomerProfileType;
  onBack: () => void;
  onSelectCall: (callId: string) => void;
}

export default function CustomerProfile({ profile, onBack, onSelectCall }: CustomerProfileProps) {
  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed':
        return 'text-teal-400';
      case 'processing':
        return 'text-blue-400';
      case 'pending':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getCallStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle className="w-5 h-5" />;
      case 'processing':
        return <Clock className="w-5 h-5 animate-pulse" />;
      case 'pending':
        return <Upload className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getCallTypeColor = (type: string) => {
    switch (type) {
      case 'Intro Call':
        return 'from-cyan-500 to-blue-500';
      case 'Close':
        return 'from-teal-500 to-emerald-500';
      case 'Follow Up':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-1 mb-4">
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{profile.name}</h1>
                <div className="inline-block px-4 py-1 rounded-full bg-teal-500/10 border border-teal-400/30">
                  <span className="text-teal-400 text-sm font-medium">{profile.status}</span>
                </div>
              </div>

              <div className="border-t border-gray-700/50 pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  CRM Information
                </h3>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Company</div>
                    <div className="text-white font-medium">{profile.crmData.company}</div>
                    <div className="text-sm text-gray-400">{profile.crmData.title}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Email</div>
                    <div className="text-white text-sm">{profile.crmData.email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Phone</div>
                    <div className="text-white text-sm">{profile.crmData.phone}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">Location</div>
                    <div className="text-white text-sm">{profile.crmData.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Linkedin className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400">LinkedIn</div>
                    <div className="text-cyan-400 text-sm hover:underline cursor-pointer">
                      {profile.crmData.linkedIn}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700/50 pt-4 mt-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-teal-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-400">Source</div>
                      <div className="text-white text-sm">{profile.crmData.source}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-teal-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-400">Deal Value</div>
                      <div className="text-white text-lg font-bold">
                        ${profile.crmData.dealValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-8">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Call History</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white font-medium hover:from-teal-600 hover:to-cyan-600 transition-all">
                  <Upload className="w-4 h-4" />
                  Upload New Call
                </button>
              </div>

              <div className="space-y-4">
                {profile.calls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-5 bg-gray-800/40 border border-gray-700/40 rounded-xl hover:border-gray-600/60 transition-all ${
                      call.status === 'analyzed' ? 'cursor-pointer hover:bg-gray-800/60' : ''
                    }`}
                    onClick={() => call.status === 'analyzed' && onSelectCall(call.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${getCallTypeColor(call.type)}`}>
                          {call.status === 'analyzed' ? (
                            <Play className="w-5 h-5 text-white" />
                          ) : (
                            getCallStatusIcon(call.status)
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{call.type}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>{new Date(call.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {call.duration !== '0:00' && (
                              <>
                                <span>•</span>
                                <span>{call.duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${getCallStatusColor(call.status)}`}>
                        {getCallStatusIcon(call.status)}
                        <span className="text-sm font-medium capitalize">{call.status}</span>
                      </div>
                    </div>

                    {call.status === 'analyzed' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-700/40">
                        <div className="flex-1 bg-gray-900/40 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-1">Truth Index</div>
                          <div className="text-teal-400 font-bold text-lg">78%</div>
                        </div>
                        <div className="flex-1 bg-gray-900/40 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-1">Top Objection</div>
                          <div className="text-white font-medium text-sm">Price Concern</div>
                        </div>
                        <div className="flex-1 bg-gray-900/40 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-1">Close Probability</div>
                          <div className="text-cyan-400 font-bold text-lg">82%</div>
                        </div>
                      </div>
                    )}

                    {call.status === 'pending' && (
                      <div className="pt-3 border-t border-gray-700/40">
                        <button className="w-full py-2 px-4 bg-teal-500/10 border border-teal-400/30 rounded-lg text-teal-400 hover:bg-teal-500/20 transition-all font-medium">
                          Upload Recording
                        </button>
                      </div>
                    )}

                    {call.status === 'processing' && (
                      <div className="pt-3 border-t border-gray-700/40">
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span>Analyzing call transcript and generating insights...</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-900/40 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
