import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Loader2, AlertCircle, CheckCircle2, Clock, User, MessageSquare } from 'lucide-react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ConversationSummary {
  id: string;
  session_id: string;
  user_email: string;
  prospect_type: string;
  summary_json: {
    executiveSummary?: string;
    prospectSituation?: string;
    keyPoints?: string[];
    objectionsRaised?: string[];
    objectionsResolved?: string[];
    nextSteps?: string[];
    closerPerformance?: string;
    prospectReadiness?: string;
    recommendations?: string;
  };
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

interface CallSession {
  id: string;
  prospect_type: string;
  created_at: string;
  ended_at: string | null;
  transcript_text: string;
}

interface ConversationSummaryPageProps {
  onBack: () => void;
}

export default function ConversationSummaryPage({ onBack }: ConversationSummaryPageProps) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Array<ConversationSummary & { session?: CallSession }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<ConversationSummary | null>(null);

  useEffect(() => {
    if (!isSupabaseAvailable() || !user) {
      setError('Supabase not configured or user not logged in');
      setLoading(false);
      return;
    }

    loadSummaries();
  }, [user]);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: summariesData, error: summariesError } = await supabase!
        .from('call_summaries')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (summariesError) {
        // Check if table doesn't exist (code 42P01) - but NOT schema cache errors
        // Schema cache errors usually resolve on retry
        if (summariesError.code === '42P01' || 
            (summariesError.message.includes('does not exist') && !summariesError.message.includes('schema cache'))) {
          setError('TABLE_NOT_FOUND');
          setLoading(false);
          return;
        }
        // For schema cache errors, show a different message
        if (summariesError.message.includes('schema cache')) {
          setError('SCHEMA_CACHE');
          setLoading(false);
          return;
        }
        throw summariesError;
      }

      // Load associated sessions
      const sessionIds = summariesData?.map(s => s.session_id) || [];
      if (sessionIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase!
          .from('call_sessions')
          .select('id, prospect_type, created_at, ended_at, transcript_text')
          .in('id', sessionIds);

        if (sessionsError) throw sessionsError;

        // Merge summaries with sessions
        const summariesWithSessions = summariesData?.map(summary => ({
          ...summary,
          session: sessionsData?.find(s => s.id === summary.session_id)
        })) || [];

        setSummaries(summariesWithSessions);
      } else {
        setSummaries([]);
      }
    } catch (err: any) {
      console.error('Error loading summaries:', err);
      setError(err.message || 'Failed to load conversation summaries');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress';
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const minutes = Math.floor((endMs - startMs) / 60000);
    return `${minutes} minutes`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading conversation summaries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/40">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 text-sm font-medium">Back</span>
              </button>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <h1 className="text-2xl font-bold text-white">Conversation Summaries</h1>
              </div>
            </div>
            <button
              onClick={loadSummaries}
              className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 rounded-lg transition-all text-cyan-300 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {error === 'SCHEMA_CACHE' ? (
          <div className="mb-6 backdrop-blur-xl bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-amber-300">Schema Cache Updating</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Supabase is updating its schema cache. This usually resolves within a few seconds.
            </p>
            <button
              onClick={loadSummaries}
              className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded-lg transition-all text-amber-300 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : error === 'TABLE_NOT_FOUND' ? (
          <div className="mb-6 backdrop-blur-xl bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-amber-300">Database Setup Required</h3>
            </div>
            <p className="text-gray-300 mb-4">
              The <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400">call_summaries</code> table doesn't exist yet. 
              Please run this SQL in your Supabase SQL Editor:
            </p>
            <pre className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto mb-4">
{`create table if not exists public.call_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  user_id uuid not null,
  user_email text not null,
  prospect_type text not null default '',
  summary_json jsonb not null,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.call_summaries enable row level security;

create policy "call_summaries_select_own" on public.call_summaries
  for select to authenticated using (auth.uid() = user_id);

create policy "call_summaries_insert_own" on public.call_summaries
  for insert to authenticated with check (auth.uid() = user_id);

create policy "call_summaries_update_own" on public.call_summaries
  for update to authenticated using (auth.uid() = user_id);`}
            </pre>
            <button
              onClick={loadSummaries}
              className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded-lg transition-all text-amber-300 text-sm font-medium"
            >
              I've run the SQL - Refresh
            </button>
          </div>
        ) : error ? (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {summaries.length === 0 ? (
          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Summaries Yet</h2>
            <p className="text-gray-400">
              Conversation summaries will appear here after you complete calls. Summaries are generated automatically as conversations progress.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">All Summaries</h2>
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  onClick={() => setSelectedSummary(summary)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedSummary?.id === summary.id
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-gray-800/40 border-gray-700/40 hover:border-gray-600/60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {summary.is_final ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs text-gray-400">
                        {summary.is_final ? 'Final' : 'Progressive'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(summary.updated_at)}
                    </span>
                  </div>
                  <div className="text-sm text-white font-medium mb-1">
                    {summary.prospect_type || 'Unknown Type'}
                  </div>
                  {summary.session && (
                    <div className="text-xs text-gray-400">
                      {getDuration(summary.session.created_at, summary.session.ended_at)}
                    </div>
                  )}
                  {summary.summary_json.executiveSummary && (
                    <p className="text-xs text-gray-300 mt-2 line-clamp-2">
                      {summary.summary_json.executiveSummary}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Summary Detail */}
            <div className="lg:col-span-2">
              {selectedSummary ? (
                <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Conversation Summary</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatDate(selectedSummary.updated_at)}</span>
                        <span>•</span>
                        <span>{selectedSummary.prospect_type || 'Unknown Type'}</span>
                        <span>•</span>
                        <span className={selectedSummary.is_final ? 'text-emerald-400' : 'text-amber-400'}>
                          {selectedSummary.is_final ? 'Final Summary' : 'Progressive Summary'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Executive Summary */}
                    {selectedSummary.summary_json.executiveSummary && (
                      <div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-2">Executive Summary</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {selectedSummary.summary_json.executiveSummary}
                        </p>
                      </div>
                    )}

                    {/* Prospect Situation */}
                    {selectedSummary.summary_json.prospectSituation && (
                      <div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-2">Prospect Situation</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {selectedSummary.summary_json.prospectSituation}
                        </p>
                      </div>
                    )}

                    {/* Key Points */}
                    {selectedSummary.summary_json.keyPoints && selectedSummary.summary_json.keyPoints.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-2">Key Points</h3>
                        <ul className="space-y-2">
                          {selectedSummary.summary_json.keyPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-cyan-400 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Objections Raised */}
                    {selectedSummary.summary_json.objectionsRaised && selectedSummary.summary_json.objectionsRaised.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-amber-400 mb-2">Objections Raised</h3>
                        <ul className="space-y-2">
                          {selectedSummary.summary_json.objectionsRaised.map((objection, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-amber-400 mt-1">•</span>
                              <span>{objection}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Objections Resolved */}
                    {selectedSummary.summary_json.objectionsResolved && selectedSummary.summary_json.objectionsResolved.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-2">Objections Resolved</h3>
                        <ul className="space-y-2">
                          {selectedSummary.summary_json.objectionsResolved.map((resolution, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-emerald-400 mt-1">•</span>
                              <span>{resolution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Steps */}
                    {selectedSummary.summary_json.nextSteps && selectedSummary.summary_json.nextSteps.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-purple-400 mb-2">Next Steps</h3>
                        <ul className="space-y-2">
                          {selectedSummary.summary_json.nextSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Closer Performance */}
                    {selectedSummary.summary_json.closerPerformance && (
                      <div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-2">Closer Performance</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {selectedSummary.summary_json.closerPerformance}
                        </p>
                      </div>
                    )}

                    {/* Prospect Readiness */}
                    {selectedSummary.summary_json.prospectReadiness && (
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-2">Prospect Readiness</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {selectedSummary.summary_json.prospectReadiness}
                        </p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedSummary.summary_json.recommendations && (
                      <div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-2">Recommendations</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {selectedSummary.summary_json.recommendations}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">Select a Summary</h2>
                  <p className="text-gray-400">
                    Click on a summary from the list to view its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
