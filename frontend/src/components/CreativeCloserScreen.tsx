import { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2, TrendingUp, FileText, Users, Shield, Target, AlertTriangle, Edit3, Settings, ChevronDown, ChevronUp, List } from 'lucide-react';
import {
  ProspectType,
  prospectTypeLabels,
  prospectData,
  dealComparisons,
  incentivesProtections,
  commonCloserMistakes,
  trainingUsage,
} from '../data/creativeCloserData';

interface CreativeCloserScreenProps {
  onBack: () => void;
}

export default function CreativeCloserScreen({ onBack }: CreativeCloserScreenProps) {
  const [selectedProspectType, setSelectedProspectType] = useState<ProspectType>('owner-occupied');
  const [showTOC, setShowTOC] = useState(false);

  const currentData = prospectData[selectedProspectType];

  const sections = [
    { id: 'framework', title: 'Framework Overview — 5 Core Questions', icon: Target },
    { id: 'discovery', title: 'Discovery Phases (1-7)', icon: FileText },
    { id: 'pressure', title: 'Prospect Reality & Pressure', icon: TrendingUp },
    { id: 'property', title: 'Property & Loan Reality', icon: FileText },
    { id: 'pain', title: 'Pain & Motivation Dig', icon: AlertCircle },
    { id: 'failed', title: 'Failed Solutions', icon: AlertCircle },
    { id: 'outcome', title: 'Desired Outcome Clarity', icon: Target },
    { id: 'openness', title: 'Openness to Creative Solutions', icon: TrendingUp },
    { id: 'objections', title: 'Likely Objections (Translated)', icon: AlertTriangle },
    { id: 'compliance', title: 'Truth Index — Compliance Signals', icon: AlertCircle },
    { id: 'redflags', title: 'Truth Index — Red Flags', icon: AlertTriangle },
    { id: 'decision', title: 'Decision-Making Style', icon: Users },
    { id: 'beliefs', title: 'False Beliefs & Limiting Stories', icon: AlertCircle },
    { id: 'dealstructure', title: 'Deal Structure Matching', icon: Target },
    { id: 'comparison', title: 'Deal Structure Comparison', icon: FileText },
    { id: 'incentives', title: 'Incentives & Protections', icon: Shield },
    { id: 'transformation', title: 'Core Transformation', icon: TrendingUp },
    { id: 'mistakes', title: 'Common Closer Mistakes', icon: AlertTriangle },
    { id: 'training', title: 'Training Usage', icon: Users },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowTOC(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/40 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 text-sm font-medium">Back</span>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Creative Closer Profile
              </h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">Customizable Template</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">Creative Finance Real Estate</div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-8 py-8">
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Prospect Type (Controls All Content)
          </label>
          <div className="grid grid-cols-7 gap-3">
            {(Object.keys(prospectTypeLabels) as ProspectType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedProspectType(type)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedProspectType === type
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800 border border-gray-700/50'
                }`}
              >
                {prospectTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="w-full bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg p-4 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <List className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold text-lg">Table of Contents</span>
              <span className="text-gray-400 text-sm">({sections.length} sections)</span>
            </div>
            {showTOC ? (
              <ChevronUp className="w-5 h-5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cyan-400 group-hover:animate-bounce" />
            )}
          </button>

          {showTOC && (
            <div className="mt-3 bg-gray-800/60 border border-gray-700/50 rounded-lg p-6 grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-200">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-3 p-3 bg-gray-900/60 hover:bg-gray-900 border border-gray-700/50 hover:border-cyan-500/50 rounded-lg transition-all text-left group"
                  >
                    <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm group-hover:text-white font-medium">{section.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Section id="framework" title="Framework Overview — 5 Core Questions" icon={<Target className="w-5 h-5" />}>
            <div className="space-y-4">
              <QuestionAnswer
                question="1. Why are they talking now?"
                answer={currentData.coreQuestions.whyNow}
              />
              <QuestionAnswer
                question="2. What pressure are they under?"
                answer={currentData.coreQuestions.pressure}
              />
              <QuestionAnswer
                question="3. What outcome do they want?"
                answer={currentData.coreQuestions.outcome}
              />
              <QuestionAnswer
                question="4. What has failed already?"
                answer={currentData.coreQuestions.failedSolutions}
              />
              <QuestionAnswer
                question="5. Are they open to non-traditional solutions?"
                answer={currentData.coreQuestions.openness}
              />
            </div>
          </Section>

          <Section id="discovery" title="Discovery Phases (1-7)" icon={<FileText className="w-5 h-5" />}>
            <div className="space-y-6">
              {currentData.discoveryPhases.map((phase, index) => (
                <div key={index} className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-6 hover:border-teal-500/30 transition-all group relative">
                  <button className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-300">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {index + 1}. {phase.title}
                  </h3>
                  <p className="text-teal-400 text-base mb-5 font-medium">{phase.goal}</p>

                  <div className="space-y-5">
                    <div className="bg-gray-800/40 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-cyan-400 mb-3">Key Questions</h4>
                      <ul className="space-y-2">
                        {phase.questions.map((q, qi) => (
                          <li key={qi} className="text-gray-200 text-base flex items-start gap-3">
                            <span className="text-cyan-400 text-lg">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <h4 className="text-base font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Qualification Signals
                        </h4>
                        <ul className="space-y-2">
                          {phase.qualificationSignals.map((s, si) => (
                            <li key={si} className="text-gray-200 text-base flex items-start gap-2">
                              <span className="text-green-400">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                        <h4 className="text-base font-semibold text-orange-400 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Warning Signs
                        </h4>
                        <ul className="space-y-2">
                          {phase.warningSigns.map((w, wi) => (
                            <li key={wi} className="text-gray-200 text-base flex items-start gap-2">
                              <span className="text-orange-400">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="pressure" title="Prospect Reality & Pressure" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-6">
              <PressureCategory title="Time Pressure" items={currentData.pressurePatterns.time} color="red" />
              <PressureCategory
                title="Financial Pressure"
                items={currentData.pressurePatterns.financial}
                color="orange"
              />
              <PressureCategory
                title="Emotional Pressure"
                items={currentData.pressurePatterns.emotional}
                color="purple"
              />
              <PressureCategory
                title="Authority Pressure"
                items={currentData.pressurePatterns.authority}
                color="blue"
              />
            </div>
          </Section>

          <Section id="property" title="Property & Loan Reality" icon={<FileText className="w-5 h-5" />}>
            <div className="space-y-4">
              <DataList title="Occupancy Status" items={currentData.propertyLoanReality.occupancy} />
              <DataList title="Condition Burden" items={currentData.propertyLoanReality.condition} />
              <DataList title="Loan Presence" items={currentData.propertyLoanReality.loanPresence} />
              <DataList title="Payment Status" items={currentData.propertyLoanReality.paymentStatus} />
              <DataList
                title="Structural Viability for Creative Finance"
                items={currentData.propertyLoanReality.viability}
              />
            </div>
          </Section>

          <Section id="pain" title="Pain & Motivation Dig" icon={<AlertCircle className="w-5 h-5" />}>
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 hover:border-red-500/50 transition-all group relative">
                <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                  <Edit3 className="w-5 h-5" />
                </button>
                <h4 className="text-base font-bold text-red-400 mb-4">Core Pain Questions</h4>
                <ul className="space-y-3">
                  {currentData.painMotivation.corePain.map((pain, i) => (
                    <li key={i} className="text-gray-100 text-base italic border-l-4 border-red-500 pl-5 py-2 bg-gray-800/40 rounded-r">
                      "{pain}"
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6 hover:border-teal-500/50 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-300">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <h4 className="text-base font-bold text-teal-400 mb-4">Deepening Questions</h4>
                  <ul className="space-y-2">
                    {currentData.painMotivation.deepeningQuestions.map((q, i) => (
                      <li key={i} className="text-gray-200 text-base flex items-start gap-2">
                        <span className="text-teal-400 text-lg">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500/50 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <h4 className="text-base font-bold text-cyan-400 mb-4">Emotional Signals to Listen For</h4>
                  <ul className="space-y-2">
                    {currentData.painMotivation.emotionalSignals.map((s, i) => (
                      <li key={i} className="text-gray-200 text-base flex items-start gap-2">
                        <span className="text-cyan-400 text-lg">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500/50 transition-all group relative">
                <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300">
                  <Edit3 className="w-5 h-5" />
                </button>
                <h4 className="text-base font-bold text-cyan-400 mb-3">Guidance</h4>
                <p className="text-gray-200 text-base leading-relaxed">{currentData.painMotivation.guidance}</p>
              </div>
            </div>
          </Section>

          <Section id="failed" title="Failed Solutions" icon={<AlertCircle className="w-5 h-5" />}>
            <div className="space-y-4">
              <DataList title="What They Tried" items={currentData.failedSolutions.attempted} />
              <DataList title="Why It Failed" items={currentData.failedSolutions.whyFailed} />
              <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Remaining Hope</h4>
                <p className="text-gray-300">{currentData.failedSolutions.remainingHope}</p>
              </div>
            </div>
          </Section>

          <Section id="outcome" title="Desired Outcome Clarity" icon={<Target className="w-5 h-5" />}>
            <div className="space-y-4">
              <DataList title="What Success Means to Them" items={currentData.desiredOutcome.successMeans} />
              <DataList
                title="Trade-offs (Speed vs Price vs Certainty)"
                items={currentData.desiredOutcome.tradeOffs}
              />
              <DataList title="What They Want Off Their Plate" items={currentData.desiredOutcome.wantOffPlate} />
            </div>
          </Section>

          <Section id="openness" title="Openness to Creative Solutions" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Permission-Based Bridge Questions</h4>
                <ul className="space-y-1">
                  {currentData.opennessToCreative.bridgeQuestions.map((q, i) => (
                    <li key={i} className="text-teal-400 text-sm">
                      • {q}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-orange-400 mb-2">
                  If Openness is Low
                </h4>
                <p className="text-gray-300 text-sm">{currentData.opennessToCreative.lowOpennessGuidance}</p>
              </div>
            </div>
          </Section>

          <Section id="objections" title="Likely Objections (Translated)" icon={<AlertTriangle className="w-5 h-5" />}>
            <div className="space-y-5">
              {currentData.likelyObjections.map((obj, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-6 hover:border-orange-500/30 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 hover:text-orange-300">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <h4 className="text-white font-bold mb-5 text-lg border-l-4 border-orange-500 pl-4 py-1">"{obj.common}"</h4>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="bg-gray-800/60 rounded-lg p-4">
                      <span className="text-xs text-gray-400 uppercase font-semibold block mb-2">Protecting</span>
                      <p className="text-gray-200 text-base">{obj.protecting}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-4">
                      <span className="text-xs text-gray-400 uppercase font-semibold block mb-2">Risk Behind Objection</span>
                      <p className="text-gray-200 text-base">{obj.risk}</p>
                    </div>
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                      <span className="text-xs text-teal-400 uppercase font-semibold block mb-2">Control Question</span>
                      <p className="text-teal-300 text-base italic">"{obj.controlQuestion}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="compliance" title="Truth Index — Compliance Signals" icon={<AlertCircle className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-5">
              {currentData.complianceSignals.map((signal, i) => (
                <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-5 hover:border-yellow-500/50 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400 hover:text-yellow-300">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold mb-2 text-base">{signal.signal}</h4>
                      <p className="text-gray-200 text-base leading-relaxed">{signal.meaning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="redflags" title="Truth Index — Red Flags" icon={<AlertTriangle className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-5">
              {currentData.redFlags.map((flag, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 hover:border-red-500/50 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold mb-2 text-base">{flag.flag}</h4>
                      <p className="text-gray-200 text-base"><span className="text-red-400 font-semibold">Impact:</span> {flag.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="decision" title="Decision-Making Style" icon={<Users className="w-5 h-5" />}>
            <div className="space-y-5">
              {currentData.decisionStyles.map((style, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-6 hover:border-cyan-500/30 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <h4 className="text-white font-bold mb-5 text-lg">{style.name}</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <span className="text-sm text-green-400 uppercase font-bold block mb-3">What They Need</span>
                      <ul className="space-y-2">
                        {style.needs.map((need, ni) => (
                          <li key={ni} className="text-gray-200 text-base flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <span className="text-sm text-red-400 uppercase font-bold block mb-3">What Not To Do</span>
                      <ul className="space-y-2">
                        {style.avoids.map((avoid, ai) => (
                          <li key={ai} className="text-gray-200 text-base flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>{avoid}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="beliefs" title="False Beliefs & Limiting Stories" icon={<AlertCircle className="w-5 h-5" />}>
            <div className="space-y-3">
              {currentData.falseBeliefsAndStories.map((belief, i) => (
                <div key={i} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-purple-400 font-medium mb-2">{belief.belief}</h4>
                  <p className="text-gray-300 text-sm italic">"{belief.innerDialogue}"</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="dealstructure" title="Deal Structure Matching" icon={<Target className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-6">
              {currentData.dealStructures.map((structure, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-6 hover:border-teal-500/30 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-300">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <h4 className="text-white font-bold mb-5 text-lg border-b border-gray-700 pb-3">{structure.name}</h4>
                  <div className="space-y-4">
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
                      <span className="text-sm text-teal-400 uppercase font-bold block mb-2">Best Fit</span>
                      <p className="text-gray-200 text-base">{structure.bestFit}</p>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                      <span className="text-sm text-cyan-400 uppercase font-bold block mb-2">Primary Lever</span>
                      <p className="text-gray-200 text-base">{structure.primaryLever}</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <span className="text-sm text-orange-400 uppercase font-bold block mb-2">When NOT to Use</span>
                      <p className="text-gray-200 text-base">{structure.whenNotToUse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="comparison" title="Deal Structure Comparison" icon={<FileText className="w-5 h-5" />}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Structure</th>
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Speed</th>
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Bank Approval</th>
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Credit Impact</th>
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Seller Payments</th>
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Flexibility</th>
                    <th className="text-left text-sm font-medium text-gray-400 pb-3">Best Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  {dealComparisons.map((deal, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-3 text-white font-medium">{deal.structure}</td>
                      <td className="py-3 text-gray-300 text-sm">{deal.speed}</td>
                      <td className="py-3 text-gray-300 text-sm">{deal.bankApproval}</td>
                      <td className="py-3 text-gray-300 text-sm">{deal.creditImpact}</td>
                      <td className="py-3 text-gray-300 text-sm">{deal.sellerPayments}</td>
                      <td className="py-3 text-gray-300 text-sm">{deal.flexibility}</td>
                      <td className="py-3 text-gray-300 text-sm">{deal.bestUseCase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="incentives" title="Incentives & Protections" icon={<Shield className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-6">
              {incentivesProtections.map((category, i) => (
                <div key={i} className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">{category.category}</h4>
                  <ul className="space-y-2">
                    {category.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="transformation" title="Core Transformation" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h4 className="text-red-400 font-semibold mb-4 text-lg">FROM</h4>
                <ul className="space-y-2">
                  {currentData.transformation.from.map((item, i) => (
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <h4 className="text-green-400 font-semibold mb-4 text-lg">TO</h4>
                <ul className="space-y-2">
                  {currentData.transformation.to.map((item, i) => (
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="mistakes" title="Common Closer Mistakes" icon={<AlertTriangle className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-5">
              {commonCloserMistakes.map((mistake, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 hover:border-red-500/50 transition-all group relative">
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <h4 className="text-red-400 font-bold mb-4 text-base border-l-4 border-red-500 pl-3 py-1">{mistake.mistake}</h4>
                  <div className="space-y-4">
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <span className="text-sm text-gray-400 uppercase font-semibold block mb-2">Why</span>
                      <p className="text-gray-200 text-base">{mistake.why}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <span className="text-sm text-green-400 uppercase font-semibold block mb-2">Instead</span>
                      <p className="text-gray-200 text-base">{mistake.instead}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="training" title="Training Usage" icon={<Users className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6 hover:border-teal-500/50 transition-all group relative">
                <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-300">
                  <Edit3 className="w-5 h-5" />
                </button>
                <h4 className="text-teal-400 font-bold mb-3 text-base">Role-play by Prospect Type</h4>
                <p className="text-gray-200 text-base leading-relaxed">{trainingUsage.rolePlay}</p>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500/50 transition-all group relative">
                <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300">
                  <Edit3 className="w-5 h-5" />
                </button>
                <h4 className="text-cyan-400 font-bold mb-3 text-base">Objection Translation Drills</h4>
                <p className="text-gray-200 text-base leading-relaxed">{trainingUsage.objectionDrills}</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 hover:border-blue-500/50 transition-all group relative">
                <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300">
                  <Edit3 className="w-5 h-5" />
                </button>
                <h4 className="text-blue-400 font-bold mb-3 text-base">Deal-Matching Exercises</h4>
                <p className="text-gray-200 text-base leading-relaxed">{trainingUsage.dealMatching}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 hover:border-green-500/50 transition-all group relative">
                <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-green-400 hover:text-green-300">
                  <Edit3 className="w-5 h-5" />
                </button>
                <h4 className="text-green-400 font-bold mb-3 text-base">Confidence Calibration</h4>
                <p className="text-gray-200 text-base leading-relaxed">{trainingUsage.confidenceCalibration}</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, icon, children }: { id?: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-8 hover:border-cyan-500/30 transition-all group scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-cyan-400">{icon}</div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium">
          <Edit3 className="w-4 h-4" />
          Customize
        </button>
      </div>
      {children}
    </div>
  );
}

function QuestionAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-6 hover:border-teal-500/30 transition-all group relative">
      <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-300">
        <Edit3 className="w-4 h-4" />
      </button>
      <h4 className="text-teal-400 font-semibold mb-3 text-base">{question}</h4>
      <p className="text-gray-200 text-base leading-relaxed">{answer}</p>
    </div>
  );
}

function PressureCategory({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colorMap: Record<string, string> = {
    red: 'border-red-500/30 bg-red-500/10',
    orange: 'border-orange-500/30 bg-orange-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
  };

  const textColorMap: Record<string, string> = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`border rounded-lg p-6 ${colorMap[color]} hover:scale-[1.02] transition-all group relative`}>
      <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-300">
        <Edit3 className="w-4 h-4" />
      </button>
      <h4 className={`font-bold mb-4 text-lg ${textColorMap[color]}`}>{title}</h4>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="text-gray-200 text-base flex items-start gap-3">
            <span className={`${textColorMap[color]} text-lg`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-5 hover:border-cyan-500/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-cyan-400">{title}</h4>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300">
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-800/40 rounded-lg p-3">
            <span className="text-cyan-400 text-lg mt-0.5">•</span>
            <span className="text-gray-200 text-base leading-relaxed flex-1">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
