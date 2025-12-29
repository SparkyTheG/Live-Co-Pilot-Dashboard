import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ConversationUploadProps {
  onAnalysisComplete: (analysis: {
    prospectType: string;
    lubometer: number;
    dials: {
      urgency: number;
      trust: number;
      authority: number;
      structure: number;
    };
  }) => void;
}

export default function ConversationUpload({ onAnalysisComplete }: ConversationUploadProps) {
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const analyzeConversation = (text: string) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const lowerText = text.toLowerCase();

      // Determine prospect type
      let prospectType = 'creative-seller-financing';
      if (lowerText.includes('foreclosure') || lowerText.includes('behind on mortgage')) {
        prospectType = 'foreclosure';
      } else if (lowerText.includes('landlord') || lowerText.includes('tenant')) {
        if (lowerText.includes('tired') || lowerText.includes('done')) {
          prospectType = 'performing-tired-landlord';
        } else {
          prospectType = 'distressed-landlord';
        }
      } else if (lowerText.includes('inherited') || lowerText.includes('probate') || lowerText.includes('estate')) {
        prospectType = 'creative-seller-financing';
      }

      // Analyze urgency (0-100)
      let urgency = 50;
      const urgencyIndicators = [
        { phrase: 'months behind', value: 85 },
        { phrase: 'default notice', value: 85 },
        { phrase: "don't know what to do", value: 80 },
        { phrase: 'foreclosure', value: 85 },
        { phrase: 'need to sell fast', value: 90 },
        { phrase: 'already received', value: 75 },
        { phrase: 'scared', value: 80 },
      ];
      urgencyIndicators.forEach(({ phrase, value }) => {
        if (lowerText.includes(phrase)) urgency = Math.max(urgency, value);
      });

      // Analyze trust (0-100)
      let trust = 50;
      const trustIndicators = [
        { phrase: 'sketchy', value: -30 },
        { phrase: 'sounds sketchy', value: -30 },
        { phrase: "don't trust", value: -25 },
        { phrase: 'worried', value: -15 },
        { phrase: 'afraid', value: -10 },
        { phrase: 'makes sense', value: 15 },
        { phrase: 'that helps', value: 15 },
        { phrase: 'okay', value: 10 },
        { phrase: 'i guess', value: 5 },
      ];
      trustIndicators.forEach(({ phrase, value }) => {
        if (lowerText.includes(phrase)) trust += value;
      });
      trust = Math.max(0, Math.min(100, trust));

      // Analyze authority (0-100)
      let authority = 60;
      const authorityIndicators = [
        { phrase: 'need to ask', value: -20 },
        { phrase: 'talk to my', value: -20 },
        { phrase: 'my wife', value: -10 },
        { phrase: 'my husband', value: -10 },
        { phrase: 'let me think', value: 10 },
        { phrase: 'i can decide', value: 20 },
        { phrase: "i'll do", value: 15 },
      ];
      authorityIndicators.forEach(({ phrase, value }) => {
        if (lowerText.includes(phrase)) authority += value;
      });
      authority = Math.max(0, Math.min(100, authority));

      // Analyze structure understanding (0-100)
      let structure = 50;
      const structureIndicators = [
        { phrase: "haven't heard", value: -20 },
        { phrase: "don't understand", value: -15 },
        { phrase: 'what does that mean', value: -20 },
        { phrase: 'slowly', value: -10 },
        { phrase: 'heard that', value: 10 },
        { phrase: 'i know about', value: 15 },
        { phrase: 'understand how', value: 20 },
        { phrase: 'makes sense', value: 15 },
      ];
      structureIndicators.forEach(({ phrase, value }) => {
        if (lowerText.includes(phrase)) structure += value;
      });
      structure = Math.max(0, Math.min(100, structure));

      // Calculate lubometer (overall readiness)
      const lubometer = Math.round((urgency * 0.4 + trust * 0.3 + authority * 0.2 + structure * 0.1));

      const analysis = {
        prospectType,
        lubometer,
        dials: {
          urgency: Math.round(urgency),
          trust: Math.round(trust),
          authority: Math.round(authority),
          structure: Math.round(structure),
        },
      };

      onAnalysisComplete(analysis);
      setSuccess('Conversation analyzed successfully! Metrics updated.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to analyze conversation. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const text = await extractTextFromPDF(file);
      setExtractedText(text);
      setSuccess('PDF processed successfully!');

      // Auto-analyze after extraction
      setTimeout(() => {
        analyzeConversation(text);
      }, 500);
    } catch (err) {
      setError('Failed to process PDF. Please try again.');
      console.error('PDF extraction error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextAnalysis = () => {
    if (!extractedText) {
      setError('No conversation text to analyze');
      return;
    }
    analyzeConversation(extractedText);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Compact Top Section - Split Layout */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* PDF Upload Section - Primary Method */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Upload A PDF</h3>
          </div>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300 mb-1">
                {isProcessing ? 'Processing...' : 'Upload PDF'}
              </p>
              <p className="text-xs text-gray-500">Click to browse</p>
            </label>
          </div>
        </div>

        {/* Paste Transcript Section - Testing Method */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Paste Your Transcript</h3>
          </div>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Paste text here..."
            className="w-full h-24 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          {extractedText && (
            <button
              onClick={handleTextAnalysis}
              disabled={isAnalyzing}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div className="px-4 pb-4">
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-700 rounded-lg text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
