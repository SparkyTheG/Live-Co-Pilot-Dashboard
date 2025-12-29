import { useState } from 'react';
import { ProspectType, prospectTypeData } from '../data/coPilotData';
import { comprehensiveObjections } from '../data/objectionsData';
import ProspectTypeToggle from './coPilot/ProspectTypeToggle';
import LubometerComponent from './coPilot/LubometerComponent';
import DialsComponent from './coPilot/DialsComponent';
import ObjectionWhisperComponent from './coPilot/ObjectionWhisperComponent';
import TruthIndexComponent from './coPilot/TruthIndexComponent';
import ConversationUpload from './coPilot/ConversationUpload';
import DiagnosticQuestions from './coPilot/DiagnosticQuestions';

interface CreativeCloserCoPilotScreenProps {
  onOpenDebrief: (data: {
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
  }) => void;
}

export default function CreativeCloserCoPilotScreen({ onOpenDebrief }: CreativeCloserCoPilotScreenProps) {
  const [prospectType, setProspectType] = useState<ProspectType>('creative-seller-financing');
  const [lubometerValue, setLubometerValue] = useState(50);
  const [dialValues, setDialValues] = useState({
    urgency: 8,
    trust: 6,
    authority: 4,
    structure: 7
  });

  const currentData = prospectTypeData[prospectType];

  // Map prospect type to seller type for objections
  const getSellerType = (type: ProspectType): 'foreclosure' | 'tired-landlord' | 'probate-inherited' => {
    if (type === 'foreclosure') return 'foreclosure';
    if (type === 'distressed-landlord' || type === 'performing-tired-landlord') return 'tired-landlord';
    // Default to probate-inherited for other types
    return 'probate-inherited';
  };

  const handleAnalysisComplete = (analysis: {
    prospectType: string;
    lubometer: number;
    dials: {
      urgency: number;
      trust: number;
      authority: number;
      structure: number;
    };
  }) => {
    setProspectType(analysis.prospectType as ProspectType);
    setLubometerValue(analysis.lubometer);
    // Convert from 0-100 scale to 0-10 scale for dials
    setDialValues({
      urgency: Math.round(analysis.dials.urgency / 10),
      trust: Math.round(analysis.dials.trust / 10),
      authority: Math.round(analysis.dials.authority / 10),
      structure: Math.round(analysis.dials.structure / 10),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[1900px] mx-auto p-6">
        <div className="mb-6">
          <ConversationUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>

        <div className="mb-6">
          <ProspectTypeToggle
            selectedType={prospectType}
            onTypeChange={setProspectType}
          />
        </div>

        <div className="mb-6">
          <DiagnosticQuestions prospectType={prospectType} />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-1">
            <LubometerComponent
              interpretation={currentData.lubometer}
              value={lubometerValue}
              onChange={setLubometerValue}
            />
          </div>
          <div className="col-span-2">
            <ObjectionWhisperComponent prospectType={getSellerType(prospectType)} />
          </div>
        </div>

        <div className="mb-6">
          <DialsComponent
            quotes={currentData.prospectQuotes}
          />
        </div>

        <div>
          <TruthIndexComponent
            truthIndex={currentData.truthIndex}
            currentDialValues={dialValues}
            lubometer={lubometerValue}
            prospectType={prospectType}
            onOpenDebrief={() => {
              const sellerType = getSellerType(prospectType);
              const predictedObjections = comprehensiveObjections
                .filter(obj => obj.sellerType === sellerType)
                .slice(0, 5)
                .map(obj => ({
                  objectionText: obj.objectionText,
                  rebuttalScript: obj.rebuttalScript,
                  probability: obj.probability
                }));
              onOpenDebrief({
                currentDialValues: dialValues,
                lubometer: lubometerValue,
                prospectType,
                predictedObjections
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
