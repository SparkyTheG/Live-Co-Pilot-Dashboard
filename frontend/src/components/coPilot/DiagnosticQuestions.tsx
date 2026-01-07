import { ClipboardList, HelpCircle } from 'lucide-react';
import { ProspectType } from '../../data/coPilotData';
import { diagnosticQuestions } from '../../data/diagnosticQuestions';
import { useSettings } from '../../contexts/SettingsContext';

interface DiagnosticQuestionsProps {
  prospectType: ProspectType;
}

const categoryColors = {
  situation: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
  timeline: 'bg-red-500/20 border-red-400/30 text-red-300',
  authority: 'bg-purple-500/20 border-purple-400/30 text-purple-300',
  pain: 'bg-orange-500/20 border-orange-400/30 text-orange-300',
  financial: 'bg-green-500/20 border-green-400/30 text-green-300',
};

const categoryLabels = {
  situation: 'Situation',
  timeline: 'Timeline',
  authority: 'Authority',
  pain: 'Pain Point',
  financial: 'Financial',
};

export default function DiagnosticQuestions({ prospectType }: DiagnosticQuestionsProps) {
  const { settings } = useSettings();
  const questions =
    (settings.diagnosticQuestionsByProspectType?.[prospectType] && Array.isArray(settings.diagnosticQuestionsByProspectType[prospectType]))
      ? settings.diagnosticQuestionsByProspectType[prospectType]
      : (diagnosticQuestions[prospectType] as any[]).map((q) => ({
          question: q.question,
          helper: q.why,
          badgeText: q.category === 'pain' ? 'Pain Point' : q.category.charAt(0).toUpperCase() + q.category.slice(1),
          badgeColor: q.category
        }));

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 border-2 border-blue-500/30 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-7 h-7 text-blue-400" />
        <h3 className="text-2xl font-bold text-blue-400">Diagnostic Questions</h3>
        <div className="ml-auto text-sm text-gray-400">
          Ask these to gather intel for accurate predictions
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div
            key={index}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-blue-500/40 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 font-bold text-sm">{index + 1}</span>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-white font-medium text-lg leading-relaxed">
                    {q.question}
                  </p>
                  <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[(q as any).badgeColor]}`}>
                    {(q as any).badgeText}
                  </span>
                </div>

                <div className="flex items-start gap-2 pl-2 border-l-2 border-blue-500/30">
                  <HelpCircle className="w-4 h-4 text-blue-400/60 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-300/70 text-sm italic">
                    {(q as any).helper}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
        <p className="text-blue-300 text-sm">
          <strong className="text-blue-400">Pro Tip:</strong> These questions should be woven naturally into your conversation, not asked robotically. Use your own voice and tonality. The goal is to extract this intel so the system can make accurate predictions.
        </p>
      </div>
    </div>
  );
}
