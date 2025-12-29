import { FileText } from 'lucide-react';

interface PostCallDebriefButtonProps {
  onClick: () => void;
}

export default function PostCallDebriefButton({ onClick }: PostCallDebriefButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/50 group"
    >
      <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span>Analyze The Call: 8-Pillar Debrief</span>
    </button>
  );
}
