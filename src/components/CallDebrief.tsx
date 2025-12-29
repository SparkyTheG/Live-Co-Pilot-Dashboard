import { Upload, CheckCircle2, Heart, Sparkles, Wind, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

const MONEY_DEMONS = [
  { name: 'Money Gnome', description: 'Talented, rich, sits in her cave and wants to get more than she gives' },
  { name: 'Stuck Mermaid', description: 'Nothing can get me out of my swamp' },
  { name: 'Frozen', description: 'Frozen and feeling nothing' },
  { name: 'Ghost', description: 'Lives in the past, crying over previous dreams' },
  { name: 'Stuck In 3-D', description: 'No imagination, no dreams, no desire to serve' },
  { name: 'Critic', description: 'Nothing will work for me' },
  { name: 'Money Demon', description: 'Scared to part with money' },
  { name: 'Zombie', description: "Cannot see anything outside it's dependency" },
  { name: 'Deathly Solitude Demon', description: 'I will be alone forever' },
];

interface CallDebriefProps {
  callNumber: number;
  onComplete: () => void;
}

type UploadStage = 'upload' | 'outcome' | 'feedback';

export default function CallDebrief({ callNumber, onComplete }: CallDebriefProps) {
  const [stage, setStage] = useState<UploadStage>('upload');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [saleMade, setSaleMade] = useState<boolean | null>(null);
  const [wasBrutal, setWasBrutal] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadStatus('uploading');

    setTimeout(() => {
      setUploadStatus('success');
      setTimeout(() => setStage('outcome'), 1000);
    }, 2000);
  };

  const handleOutcome = (didClose: boolean, brutal: boolean = false) => {
    setSaleMade(didClose);
    setWasBrutal(brutal);
    setStage('feedback');
  };

  if (stage === 'upload') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full backdrop-blur-xl bg-gray-900/90 border border-cyan-500/30 rounded-2xl p-8 relative">
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 flex items-center justify-center transition-all group"
            title="Skip and return to dashboard"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Call Debrief</h2>
            <p className="text-gray-300 text-lg">
              You've completed another call. Let's capture what happened so we can help you grow.
            </p>
          </div>

          <div className="relative mb-6">
            <input
              type="file"
              id="call-recording-upload"
              accept="audio/*,.mp3,.wav,.m4a,.mp4"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="call-recording-upload"
              className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:bg-gray-800/80 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {uploadStatus === 'idle' && <Upload className="w-8 h-8 text-white" />}
                {uploadStatus === 'uploading' && (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {uploadStatus === 'success' && <CheckCircle2 className="w-8 h-8 text-white" />}
              </div>

              <div className="text-center">
                {uploadStatus === 'idle' && (
                  <>
                    <p className="text-lg font-semibold text-white mb-2">Upload Call Recording</p>
                    <p className="text-gray-400 text-sm">MP3, WAV, M4A, MP4</p>
                  </>
                )}
                {uploadStatus === 'uploading' && (
                  <p className="text-lg font-semibold text-white">{fileName}</p>
                )}
                {uploadStatus === 'success' && (
                  <p className="text-lg font-semibold text-green-400">Upload Complete</p>
                )}
              </div>
            </label>
          </div>

          <div className="text-center">
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'outcome') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full backdrop-blur-xl bg-gray-900/90 border border-cyan-500/30 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">How did it go?</h2>
            <p className="text-gray-300 text-lg">
              Tell us about the outcome so we can give you personalized feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleOutcome(true)}
              className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl hover:border-green-400 hover:scale-105 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-1">Sale Made!</h3>
                  <p className="text-gray-300">The prospect said yes</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleOutcome(false, false)}
              className="p-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl hover:border-blue-400 hover:scale-105 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-1">No Sale (But Good Call)</h3>
                  <p className="text-gray-300">It was challenging but you handled it well</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleOutcome(false, true)}
              className="p-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl hover:border-red-400 hover:scale-105 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-1">Brutal Call</h3>
                  <p className="text-gray-300">That one was really tough</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getRecommendations = () => {
    if (saleMade) {
      return [
        'What you did worked. Document the specific language you used that resonated.',
        'Notice what felt different about this call compared to others.',
        'Celebrate this win, then study it. Success leaves clues.',
        'Consider: What made THIS prospect ready to say yes?',
      ];
    }

    if (wasBrutal) {
      return [
        'Sometimes prospects come with deep blocks that have nothing to do with you.',
        'Review the Lubometer signals. Were they ever in the "ready" zone?',
        'Brutal calls are often teachers. What did this one show you?',
        'Not every prospect is meant to be your client. That\'s okay.',
      ];
    }

    return [
      'No sale today, but you showed up. That matters.',
      'Review where the Lubometer dropped. What shifted their energy?',
      'Consider: Was this prospect truly qualified from the start?',
      'Every call is practice. You\'re getting better with each one.',
    ];
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-4xl w-full backdrop-blur-xl bg-gray-900/90 border border-cyan-500/30 rounded-2xl p-8 my-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            {saleMade ? 'Congratulations on Your Close!' : 'You Showed Up. That\'s What Matters.'}
          </h2>
          <p className="text-gray-300 text-lg">
            {saleMade
              ? 'Another win in the books. You\'re building momentum.'
              : 'Not every call ends in a sale, and that\'s part of the journey. You\'re doing great.'}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">Recommendations for Next Time</h3>
          <div className="space-y-3">
            {getRecommendations().map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-cyan-400 text-xs font-bold">{idx + 1}</span>
                </div>
                <p className="text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {wasBrutal && (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-red-400 mb-4">Understanding Money Demons</h3>
            <p className="text-gray-300 mb-4">
              Sometimes prospects carry deep psychological blocks around money and transformation. These are called "Money Demons" and they have nothing to do with your skill as a closer. Here are some common ones:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MONEY_DEMONS.map((demon, idx) => (
                <div key={idx} className="p-4 bg-gray-800/60 border border-red-400/20 rounded-lg">
                  <h4 className="text-red-300 font-semibold mb-1">{demon.name}</h4>
                  <p className="text-gray-400 text-sm">{demon.description}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-300 mt-4 text-sm italic">
              When you encounter these demons, remember: you can't want it more than they do. Some people aren't ready yet, and that's not your failure.
            </p>
          </div>
        )}

        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-purple-300 mb-2">Call Decompression Meditation</h3>
              <p className="text-gray-300 mb-4">
                Sales calls carry emotional weight. Take 5 minutes to reset your nervous system before your next call.
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg text-white font-semibold transition-all">
                Start 5-Minute Meditation
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-semibold transition-all"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}