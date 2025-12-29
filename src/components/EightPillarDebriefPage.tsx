import { useState } from 'react';
import { ArrowLeft, Save, Brain, User, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';

interface EightPillarDebriefPageProps {
  onBack: () => void;
  initialData: {
    currentDialValues: {
      urgency: number;
      trust: number;
      authority: number;
      structure: number;
    };
    lubometer: number;
    prospectType: string;
    predictedObjections: Array<{
      objectionText: string;
      rebuttalScript: string;
      probability: number;
    }>;
  };
}

interface FeedbackAnswers {
  whichObjectionCameUp: string[];
  actualObjection: string;
  whichRecommendationTried: string;
  recommendationWorked: string;
  betterApproach: string;
  urgencyPrediction: string;
  urgencyActual: string;
  trustPrediction: string;
  trustActual: string;
  authorityPrediction: string;
  authorityActual: string;
  structurePrediction: string;
  structureActual: string;
  whatWasDrivingThem: string;
  truthIndexAccuracy: string;
  truthIndexNotes: string;
  situationAccurate: string[];
  riskComfort: string;
  shouldMoveForward: string;
  whereWouldBreak: string;
  whatSystemMissed: string;
  accuracyScore: number;
  oneSentenceSummary: string;
}

export default function EightPillarDebriefPage({
  onBack,
  initialData
}: EightPillarDebriefPageProps) {
  const [outcome, setOutcome] = useState<'closed' | 'follow-up' | 'not-a-fit' | 'no-sale-good'>('no-sale-good');
  const [closerPerformanceNarrative, setCloserPerformanceNarrative] = useState('');
  const [answers, setAnswers] = useState<FeedbackAnswers>({
    whichObjectionCameUp: [],
    actualObjection: '',
    whichRecommendationTried: '',
    recommendationWorked: '',
    betterApproach: '',
    urgencyPrediction: '',
    urgencyActual: '',
    trustPrediction: '',
    trustActual: '',
    authorityPrediction: '',
    authorityActual: '',
    structurePrediction: '',
    structureActual: '',
    whatWasDrivingThem: '',
    truthIndexAccuracy: '',
    truthIndexNotes: '',
    situationAccurate: [],
    riskComfort: '',
    shouldMoveForward: '',
    whereWouldBreak: '',
    whatSystemMissed: '',
    accuracyScore: 5,
    oneSentenceSummary: ''
  });
  const [saving, setSaving] = useState(false);

  const updateAnswer = (key: keyof FeedbackAnswers, value: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const toggleCheckbox = (key: 'whichObjectionCameUp' | 'situationAccurate', value: string) => {
    const current = answers[key];
    if (current.includes(value)) {
      updateAnswer(key, current.filter(v => v !== value));
    } else {
      updateAnswer(key, [...current, value]);
    }
  };

  const generateAssessment = () => {
    const { urgency, trust, authority, structure } = initialData.currentDialValues;
    const { lubometer } = initialData;

    let narrative = '';
    if (outcome === 'closed') {
      narrative = `WHAT YOU DID GREAT: You built strong rapport (${lubometer}%), established trust (${trust}/10), created urgency (${urgency}/10), and confirmed you were speaking with the decision-maker (${authority}/10). Your conversation flow and objection handling (${structure}/10) led to a successful close. KEEP DOING: Read prospect signals like this and ask for commitment when all buying conditions are present.`;
    } else if (outcome === 'follow-up') {
      narrative = `WHAT YOU DID GREAT: Professional execution with good rapport (${lubometer}%) and trust-building (${trust}/10). You maintained the relationship and set up next steps. WHAT CAN BE EVEN BETTER: Look for opportunities to create more urgency (${urgency}/10) so prospects feel the pain of waiting. Ask: "What's the cost of not solving this problem in the next 90 days?"`;
    } else if (outcome === 'not-a-fit') {
      narrative = `WHAT YOU DID GREAT: You qualified effectively and identified this wasn't a good fit. That saves everyone time and energy. Professional rapport (${lubometer}%) maintained throughout. WHAT CAN BE EVEN BETTER: Try qualifying harder earlier in the call to spot red flags sooner. This lets you spend more time on better-fit prospects.`;
    } else {
      if (authority < 5) {
        narrative = `WHAT YOU DID GREAT: Good rapport (${lubometer}%) and trust-building (${trust}/10). You maintained professionalism throughout. WHAT CAN BE EVEN BETTER: You may not have been speaking with the real decision-maker (Authority: ${authority}/10). Qualify harder upfront: "Who else needs to be part of this conversation?" or "Walk me through how decisions like this get made at your company."`;
      } else if (urgency < 5) {
        narrative = `WHAT YOU DID GREAT: Solid rapport (${lubometer}%) and trust (${trust}/10). You demonstrated the value well. WHAT CAN BE EVEN BETTER: Create more urgency (${urgency}/10). Help them see what staying in their current situation costs them. Ask: "What happens if you don't solve this in the next 3-6 months?"`;
      } else {
        narrative = `WHAT YOU DID GREAT: Good execution overall. Strong rapport (${lubometer}%), trust (${trust}/10), and some urgency (${urgency}/10). You kept the door open professionally. WHAT CAN BE EVEN BETTER: Not every qualified prospect closes on the first call. Your follow-up strategy will be critical - they need time to process or overcome internal obstacles.`;
      }
    }

    setCloserPerformanceNarrative(narrative);
  };

  const handleSave = async () => {
    if (!isSupabaseAvailable()) {
      alert('Supabase is not configured. Cannot save call debrief. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable this feature.');
      return;
    }
    
    setSaving(true);

    try {
      const { error } = await supabase!.from('call_debriefs').insert({
        closer_id: 'demo-closer',
        prospect_type: initialData.prospectType,
        call_date: new Date().toISOString(),
        lubometer: initialData.lubometer,
        urgency: initialData.currentDialValues.urgency,
        trust: initialData.currentDialValues.trust,
        authority: initialData.currentDialValues.authority,
        structure: initialData.currentDialValues.structure,
        what_went_well: '',
        what_didnt_go_well: '',
        why_outcome: closerPerformanceNarrative,
        system_notes: JSON.stringify(answers),
        accuracy_check: '',
        outcome
      });

      if (error) throw error;

      onBack();
    } catch (error) {
      console.error('Error saving debrief:', error);
    } finally {
      setSaving(false);
    }
  };

  const RadioButtons = ({
    options,
    value,
    onChange
  }: {
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-2">
      {options.map(option => (
        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-gray-200 text-lg group-hover:text-white transition-colors">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );

  const Checkboxes = ({
    options,
    values,
    onChange
  }: {
    options: Array<{ value: string; label: string }>;
    values: string[];
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-2">
      {options.map(option => (
        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            value={option.value}
            checked={values.includes(option.value)}
            onChange={() => onChange(option.value)}
            className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 rounded"
          />
          <span className="text-gray-200 text-lg group-hover:text-white transition-colors">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );

  const Section = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-8 mb-6">
      <h2 className="text-2xl font-bold text-emerald-400 mb-6">
        {number}. {title}
      </h2>
      {children}
    </div>
  );

  const Question = ({ number, text, children }: { number: number; text: string; children: React.ReactNode }) => (
    <div className="mb-8 last:mb-0">
      <p className="text-white text-lg font-semibold mb-4">
        {number}. {text}
      </p>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/40">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Co-Pilot</span>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-10 h-10 text-emerald-400" />
            <h1 className="text-4xl font-bold text-emerald-400">Post-Call Debrief</h1>
          </div>
          <p className="text-gray-400 text-lg">Share how the call went and help Siren learn</p>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">How Did The Call Go?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {(['closed', 'follow-up', 'not-a-fit', 'no-sale-good'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setOutcome(type);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  outcome === type
                    ? type === 'closed'
                      ? 'bg-green-500/20 border-green-500'
                      : type === 'follow-up'
                        ? 'bg-blue-500/20 border-blue-500'
                        : type === 'not-a-fit'
                          ? 'bg-orange-500/20 border-orange-500'
                          : 'bg-yellow-500/20 border-yellow-500'
                    : 'bg-gray-800/40 border-gray-600 hover:border-gray-500'
                }`}
              >
                <p className="font-semibold text-white text-lg">
                  {type === 'closed'
                    ? 'Closed'
                    : type === 'follow-up'
                    ? 'Set Up Follow Up'
                    : type === 'not-a-fit'
                    ? 'Not A Fit'
                    : 'No Sale (Good Try)'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {type === 'closed'
                    ? 'Deal closed today'
                    : type === 'follow-up'
                    ? 'Scheduled next step'
                    : type === 'not-a-fit'
                    ? 'Wrong prospect'
                    : 'Professional attempt'}
                </p>
              </button>
            ))}
          </div>
          {!closerPerformanceNarrative && (
            <button
              onClick={generateAssessment}
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition-all"
            >
              Show Me Our Assessment
            </button>
          )}
        </div>

        {closerPerformanceNarrative && (
          <>
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Our Assessment: What You Did Great & What Can Be Even Better</h2>
              </div>
              <div className="bg-gray-900/60 border border-gray-600 rounded-xl p-6">
                <p className="text-white text-lg leading-relaxed">{closerPerformanceNarrative}</p>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Help Siren Get Smarter</h1>
              <div className="bg-gray-800/60 border-l-4 border-emerald-500 rounded-r-lg p-6 mt-6">
                <p className="text-xl font-bold text-emerald-400 mb-2">Why this matters</p>
                <p className="text-gray-300 text-lg mb-4">
                  Below you'll see exactly what Siren predicted. Your feedback on what was accurate and what missed helps the system get better at reading prospects and making recommendations that actually work.
                </p>
              </div>
            </div>

            <Section number={1} title="SIREN'S OBJECTION PREDICTIONS">
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-3">Siren predicted these objections:</h3>
                    <div className="space-y-4">
                      {initialData.predictedObjections.map((obj, idx) => (
                        <div key={idx} className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="text-white font-semibold text-lg">"{obj.objectionText}"</p>
                            <span className="text-blue-400 font-bold text-sm whitespace-nowrap">{obj.probability}% likely</span>
                          </div>
                          <div className="text-gray-400 text-sm mb-2">Siren recommended:</div>
                          <p className="text-cyan-300 italic text-base">"{obj.rebuttalScript}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Question number={1} text="Which objection(s) actually came up on the call?">
                <Checkboxes
                  options={initialData.predictedObjections.map(obj => ({
                    value: obj.objectionText,
                    label: obj.objectionText
                  }))}
                  values={answers.whichObjectionCameUp}
                  onChange={(v) => toggleCheckbox('whichObjectionCameUp', v)}
                />
                <label className="flex items-center gap-3 cursor-pointer group mt-3">
                  <input
                    type="checkbox"
                    checked={answers.whichObjectionCameUp.includes('none-of-these')}
                    onChange={() => toggleCheckbox('whichObjectionCameUp', 'none-of-these')}
                    className="w-5 h-5 text-red-500 focus:ring-red-500 rounded"
                  />
                  <span className="text-red-400 text-lg group-hover:text-red-300 transition-colors font-semibold">
                    None of these — their real objection was different
                  </span>
                </label>
              </Question>

              {answers.whichObjectionCameUp.includes('none-of-these') && (
                <Question number={2} text="What was their ACTUAL objection?">
                  <textarea
                    value={answers.actualObjection}
                    onChange={(e) => updateAnswer('actualObjection', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Write exactly what they said or were concerned about..."
                  />
                </Question>
              )}
            </Section>

            <Section number={2} title="DID SIREN'S RECOMMENDATIONS WORK?">
              <Question number={3} text="Which recommendation did you try?">
                <RadioButtons
                  options={[
                    ...initialData.predictedObjections.map(obj => ({
                      value: obj.objectionText,
                      label: `"${obj.objectionText}" — ${obj.rebuttalScript.substring(0, 60)}...`
                    })),
                    { value: 'none', label: 'I didn\'t use any of these' },
                    { value: 'custom', label: 'I used my own approach' }
                  ]}
                  value={answers.whichRecommendationTried}
                  onChange={(v) => updateAnswer('whichRecommendationTried', v)}
                />
              </Question>

              {answers.whichRecommendationTried && answers.whichRecommendationTried !== 'none' && (
                <Question number={4} text="Did it work?">
                  <RadioButtons
                    options={[
                      { value: 'yes', label: 'Yes — it moved them forward' },
                      { value: 'somewhat', label: 'Somewhat — helped but didn\'t fully resolve it' },
                      { value: 'no', label: 'No — didn\'t help' }
                    ]}
                    value={answers.recommendationWorked}
                    onChange={(v) => updateAnswer('recommendationWorked', v)}
                  />
                </Question>
              )}

              <Question number={5} text="What did you say/do that actually worked?">
                <textarea
                  value={answers.betterApproach}
                  onChange={(e) => updateAnswer('betterApproach', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Share the exact words or approach that moved the conversation forward..."
                />
              </Question>
            </Section>

            <Section number={3} title="SIREN'S DIAL PREDICTIONS">
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-purple-400 mb-4">Siren predicted these dials:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Urgency</div>
                    <div className="text-white text-2xl font-bold">{initialData.currentDialValues.urgency}/10</div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Trust</div>
                    <div className="text-white text-2xl font-bold">{initialData.currentDialValues.trust}/10</div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Authority</div>
                    <div className="text-white text-2xl font-bold">{initialData.currentDialValues.authority}/10</div>
                  </div>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Structure</div>
                    <div className="text-white text-2xl font-bold">{initialData.currentDialValues.structure}/10</div>
                  </div>
                </div>
              </div>

              <Question number={6} text={`Urgency: We predicted ${initialData.currentDialValues.urgency}/10. Was that accurate?`}>
                <RadioButtons
                  options={[
                    { value: 'accurate', label: 'Accurate' },
                    { value: 'too-high', label: 'Too high — less urgent than we thought' },
                    { value: 'too-low', label: 'Too low — more urgent than we thought' }
                  ]}
                  value={answers.urgencyPrediction}
                  onChange={(v) => updateAnswer('urgencyPrediction', v)}
                />
                {answers.urgencyPrediction !== 'accurate' && answers.urgencyPrediction && (
                  <input
                    type="text"
                    value={answers.urgencyActual}
                    onChange={(e) => updateAnswer('urgencyActual', e.target.value)}
                    placeholder="What should it have been? (e.g., 3/10, 8/10)"
                    className="mt-3 w-full bg-gray-900/60 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </Question>

              <Question number={7} text={`Trust: We predicted ${initialData.currentDialValues.trust}/10. Was that accurate?`}>
                <RadioButtons
                  options={[
                    { value: 'accurate', label: 'Accurate' },
                    { value: 'too-high', label: 'Too high — less trust than we thought' },
                    { value: 'too-low', label: 'Too low — more trust than we thought' }
                  ]}
                  value={answers.trustPrediction}
                  onChange={(v) => updateAnswer('trustPrediction', v)}
                />
                {answers.trustPrediction !== 'accurate' && answers.trustPrediction && (
                  <input
                    type="text"
                    value={answers.trustActual}
                    onChange={(e) => updateAnswer('trustActual', e.target.value)}
                    placeholder="What should it have been?"
                    className="mt-3 w-full bg-gray-900/60 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </Question>

              <Question number={8} text={`Authority: We predicted ${initialData.currentDialValues.authority}/10. Was that accurate?`}>
                <RadioButtons
                  options={[
                    { value: 'accurate', label: 'Accurate' },
                    { value: 'too-high', label: 'Too high — less authority than we thought' },
                    { value: 'too-low', label: 'Too low — more authority than we thought' }
                  ]}
                  value={answers.authorityPrediction}
                  onChange={(v) => updateAnswer('authorityPrediction', v)}
                />
                {answers.authorityPrediction !== 'accurate' && answers.authorityPrediction && (
                  <input
                    type="text"
                    value={answers.authorityActual}
                    onChange={(e) => updateAnswer('authorityActual', e.target.value)}
                    placeholder="What should it have been?"
                    className="mt-3 w-full bg-gray-900/60 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </Question>
            </Section>

            <Section number={4} title="WHAT WAS REALLY DRIVING THEM?">
              <Question number={9} text="What were they ACTUALLY motivated by?">
                <textarea
                  value={answers.whatWasDrivingThem}
                  onChange={(e) => updateAnswer('whatWasDrivingThem', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Fear of loss? Greed? Status? Ego? Relief from stress? Be specific about what was REALLY driving their decisions..."
                />
              </Question>
            </Section>

            <Section number={5} title="TRUTH INDEX">
              <div className="bg-orange-950/30 border border-orange-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-orange-400 mb-2">Siren's Truth Index:</h3>
                <div className="text-white text-2xl font-bold">{initialData.lubometer}%</div>
              </div>

              <Question number={10} text="Was our read on their honesty level accurate?">
                <RadioButtons
                  options={[
                    { value: 'accurate', label: 'Accurate' },
                    { value: 'too-trusting', label: 'Too trusting — they were hiding more than we thought' },
                    { value: 'too-skeptical', label: 'Too skeptical — they were more genuine than we thought' }
                  ]}
                  value={answers.truthIndexAccuracy}
                  onChange={(v) => updateAnswer('truthIndexAccuracy', v)}
                />
              </Question>

              {answers.truthIndexAccuracy !== 'accurate' && answers.truthIndexAccuracy && (
                <Question number={11} text="What did we miss about their honesty?">
                  <textarea
                    value={answers.truthIndexNotes}
                    onChange={(e) => updateAnswer('truthIndexNotes', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Were they hiding something? Overselling? Playing games?"
                  />
                </Question>
              )}
            </Section>

            <Section number={6} title="DEAL QUALITY">
              <Question number={12} text="Should we have moved forward with this person?">
                <RadioButtons
                  options={[
                    { value: 'forward', label: 'Yes — move forward confidently' },
                    { value: 'slow', label: 'Maybe — slow it down and clarify more' },
                    { value: 'stop', label: 'No — this will likely turn into a mess' }
                  ]}
                  value={answers.shouldMoveForward}
                  onChange={(v) => updateAnswer('shouldMoveForward', v)}
                />
              </Question>

              <Question number={13} text="If this deal moved forward, where would it likely break?">
                <textarea
                  value={answers.whereWouldBreak}
                  onChange={(e) => updateAnswer('whereWouldBreak', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Financing? Cold feet? Hidden decision-makers? Unrealistic expectations?"
                />
              </Question>
            </Section>

            <Section number={7} title="WHAT THE SYSTEM CAN'T SEE">
              <Question number={14} text="What did you notice that no system could score?">
                <textarea
                  value={answers.whatSystemMissed}
                  onChange={(e) => updateAnswer('whatSystemMissed', e.target.value)}
                  rows={5}
                  className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Tone shifts, long pauses, contradictions, energy changes, gut feelings, body language..."
                />
              </Question>
            </Section>

            <Section number={8} title="FINAL SCORE">
              <Question number={15} text="Overall, how accurate was Siren's read? (1–10)">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={answers.accuracyScore}
                    onChange={(e) => updateAnswer('accuracyScore', parseInt(e.target.value))}
                    className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-3xl font-bold text-emerald-400 w-12 text-center">
                    {answers.accuracyScore}
                  </span>
                </div>
              </Question>

              <Question number={16} text="One sentence summary of this person:">
                <div className="mb-2 text-gray-400 italic">
                  "This was a ________ person in a ________ situation."
                </div>
                <input
                  type="text"
                  value={answers.oneSentenceSummary}
                  onChange={(e) => updateAnswer('oneSentenceSummary', e.target.value)}
                  className="w-full bg-gray-900/60 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-lg"
                  placeholder="This was a..."
                />
              </Question>
            </Section>
          </>
        )}

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-white font-semibold transition-all text-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !closerPerformanceNarrative}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Teaching Siren...' : 'Save & Teach Siren'}
          </button>
        </div>
      </div>
    </div>
  );
}
