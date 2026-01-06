import { Upload, CheckCircle2, AlertCircle, FileAudio } from 'lucide-react';
import { useState } from 'react';

const INTRO_CALL_QUESTIONS = [
  {
    category: 'Current Situation & Pain Discovery',
    questions: [
      'What made you decide to take this call today?',
      'Walk me through what\'s been going on that brought you here.',
      'What have you already tried to solve this problem?',
      'On a scale of 1-10, how urgent is solving this for you right now?'
    ]
  },
  {
    category: 'Urgency & Timeline',
    questions: [
      'What happens if nothing changes in the next 3-6 months?',
      'Is there a specific date or event driving your timeline?',
      'What would it mean for you personally if this problem was solved by [specific date]?',
      'Why now versus 6 months from now?'
    ]
  },
  {
    category: 'Past Investments & Experience',
    questions: [
      'What have you invested in previously to try to solve this?',
      'How much have you already spent trying to fix this problem?',
      'What worked? What didn\'t work? Why do you think that was?',
      'What would you do differently if you could go back?'
    ]
  },
  {
    category: 'Budget & Investment Readiness',
    questions: [
      'If this was the perfect solution for you, what would you expect an investment like this to cost?',
      'Have you set aside a budget for solving this problem?',
      'What\'s more important to you - the lowest price, or the right solution?',
      'If price wasn\'t a factor, would you move forward with this today?'
    ]
  },
  {
    category: 'Decision-Making Process',
    questions: [
      'Walk me through how you typically make big decisions like this.',
      'Is there anyone else who needs to be involved in this decision?',
      'What information do you need to feel confident saying yes?',
      'Have you ever made a decision like this on your own before?'
    ]
  },
  {
    category: 'Objection Pre-Framing',
    questions: [
      'If this was the right product/service for you at the right price, would you buy?',
      'How would you know if this is the right solution for you?',
      'What would the right price look like for you?',
      'What concerns do you have about moving forward with something like this?',
      'What would need to be true for you to feel 100% confident in your decision?'
    ]
  },
  {
    category: 'Validation & Proof',
    questions: [
      'What would give you confidence that this actually works?',
      'Do you need to see proof from others who\'ve done this?',
      'Are you someone who needs guarantees, or do you trust your gut?',
      'What\'s your biggest fear about investing in this?'
    ]
  }
];

export default function IntroCallQuestions() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadStatus('uploading');

    setTimeout(() => {
      setUploadStatus('success');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-3">Call 1: Intro Call Questions</h2>
          <p className="text-gray-400 text-lg">
            These diagnostic questions are designed to reveal your prospect's urgency, budget readiness,
            decision-making style, and potential objections. Ask these questions during your discovery call
            and upload the recording to generate your personalized Closer Co-Pilot Script.
          </p>
        </div>

        <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-cyan-400 font-semibold mb-2">How This Works</h3>
              <ol className="text-gray-300 space-y-2 text-sm">
                <li>1. Use these questions during your Call 1 (Discovery/Intro) with your prospect</li>
                <li>2. Record the conversation (with permission)</li>
                <li>3. Upload the recording below</li>
                <li>4. Our system analyzes the responses and generates your personalized Closer Co-Pilot Script for Call 2</li>
              </ol>
            </div>
          </div>
        </div>

        {INTRO_CALL_QUESTIONS.map((section, idx) => (
          <div key={idx} className="mb-8 last:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{idx + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{section.category}</h3>
            </div>
            <div className="space-y-3 ml-11">
              {section.questions.map((question, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-all">
                      <span className="text-gray-400 text-xs group-hover:text-cyan-400">{qIdx + 1}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{question}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Upload Call 1 Recording</h3>

        <div className="relative">
          <input
            type="file"
            id="recording-upload"
            accept="audio/*,.mp3,.wav,.m4a,.mp4"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="recording-upload"
            className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:bg-gray-800/80 transition-all group"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {uploadStatus === 'idle' && <Upload className="w-10 h-10 text-white" />}
              {uploadStatus === 'uploading' && (
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {uploadStatus === 'success' && <CheckCircle2 className="w-10 h-10 text-white" />}
              {uploadStatus === 'error' && <AlertCircle className="w-10 h-10 text-white" />}
            </div>

            <div className="text-center">
              {uploadStatus === 'idle' && (
                <>
                  <p className="text-xl font-semibold text-white mb-2">Click to upload recording</p>
                  <p className="text-gray-400 text-sm">Supports MP3, WAV, M4A, MP4 formats</p>
                </>
              )}
              {uploadStatus === 'uploading' && (
                <>
                  <p className="text-xl font-semibold text-white mb-2">Uploading...</p>
                  <p className="text-gray-400 text-sm">{fileName}</p>
                </>
              )}
              {uploadStatus === 'success' && (
                <>
                  <p className="text-xl font-semibold text-green-400 mb-2">Upload Successful!</p>
                  <p className="text-gray-400 text-sm mb-4">{fileName}</p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-semibold">
                    <FileAudio className="w-5 h-5" />
                    Processing Recording...
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Your Closer Co-Pilot Script will be ready for Call 2</p>
                </>
              )}
              {uploadStatus === 'error' && (
                <>
                  <p className="text-xl font-semibold text-red-400 mb-2">Upload Failed</p>
                  <p className="text-gray-400 text-sm">Please try again</p>
                </>
              )}
            </div>
          </label>
        </div>

        {uploadStatus === 'success' && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-green-400 font-semibold mb-2">What Happens Next</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Our AI analyzes the prospect's answers to identify psychological triggers</li>
                  <li>• The system maps urgency levels, price sensitivity, and decision-making patterns</li>
                  <li>• We identify the 5 main psychological dials for this specific prospect</li>
                  <li>• Your personalized Closer Co-Pilot Script is generated with objection handling and closing strategies</li>
                  <li>• Access your script on the Closer Co-Pilot Screen before Call 2</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}