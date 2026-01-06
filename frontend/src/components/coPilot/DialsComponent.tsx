import { ProspectQuotes } from '../../data/coPilotData';
import { MessageSquareQuote, Snowflake } from 'lucide-react';

interface DialsComponentProps {
  quotes: ProspectQuotes;
}

export default function DialsComponent({ quotes }: DialsComponentProps) {
  const quotesList = [
    { text: quotes.urgency, color: 'border-l-cyan-500', bgGradient: 'from-cyan-950/40' },
    { text: quotes.trust, color: 'border-l-purple-500', bgGradient: 'from-purple-950/40' },
    { text: quotes.authority, color: 'border-l-amber-500', bgGradient: 'from-amber-950/40' },
    { text: quotes.structure, color: 'border-l-green-500', bgGradient: 'from-green-950/40' }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 backdrop-blur-sm border-2 border-blue-500/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10">
        <Snowflake className="w-40 h-40 text-blue-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Snowflake className="w-10 h-10 text-blue-400 animate-pulse" />
          <h2 className="text-4xl font-bold text-blue-400">Hot Buttons</h2>
          <span className="ml-auto text-xl text-gray-400 italic">Key phrases to reference</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {quotesList.map((quote, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${quote.bgGradient} to-gray-800/40 border-l-4 ${quote.color} rounded-xl p-6 transform hover:scale-105 transition-transform shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <MessageSquareQuote className="w-7 h-7 text-gray-400 flex-shrink-0 mt-1" />
                <p className="text-xl text-gray-100 leading-relaxed italic font-medium">
                  {quote.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
