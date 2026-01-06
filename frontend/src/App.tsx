import { useState } from 'react';
import { Users, FileText, Activity, Settings } from 'lucide-react';
import CustomerProfile from './components/CustomerProfile';
import SalesManagerDashboard from './components/SalesManagerDashboard';
import PricingPage from './components/PricingPage';
import FoundingMemberPage from './components/FoundingMemberPage';
import CreativeCloserCoPilotScreen from './components/CreativeCloserCoPilotScreen';
import CreativeCloserScreen from './components/CreativeCloserScreen';
import EightPillarDebriefPage from './components/EightPillarDebriefPage';
import LiveCoPilotDashboard from './components/LiveCoPilotDashboard';
import AdminPanel from './components/AdminPanel';
import ConversationSummaryPage from './components/ConversationSummaryPage';
import {
  CUSTOMER_NAME,
  customerProfile,
} from './data/mockData';
import { salesManagerProfile } from './data/managerData';

function App() {
  const [view, setView] = useState<'copilot' | 'profile' | 'manager-dashboard' | 'creative-closer' | 'debrief' | 'live-dashboard' | 'admin' | 'summaries'>('live-dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [showFoundingMember, setShowFoundingMember] = useState(false);
  const [debriefData, setDebriefData] = useState<{
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
  } | null>(null);

  const handleSelectCall = () => {
    setView('copilot');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDebrief = (data: {
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
  }) => {
    setDebriefData(data);
    setView('debrief');
  };

  // Admin Panel view
  if (view === 'admin') {
    return <AdminPanel onBack={() => setView('live-dashboard')} onViewSummaries={() => setView('summaries')} />;
  }

  // Conversation Summaries view
  if (view === 'summaries') {
    return <ConversationSummaryPage onBack={() => setView('admin')} />;
  }

  if (view === 'debrief' && debriefData) {
    return (
      <EightPillarDebriefPage
        onBack={() => setView('copilot')}
        initialData={debriefData}
      />
    );
  }

  if (view === 'profile') {
    return (
      <CustomerProfile
        profile={customerProfile}
        onBack={() => setView('copilot')}
        onSelectCall={handleSelectCall}
      />
    );
  }

  if (view === 'manager-dashboard') {
    return (
      <SalesManagerDashboard
        profile={salesManagerProfile}
        onCloserClick={(closerId) => {
          console.log('Clicked closer:', closerId);
        }}
        onBack={() => setView('copilot')}
      />
    );
  }

  if (view === 'creative-closer') {
    return (
      <CreativeCloserScreen onBack={() => setView('copilot')} />
    );
  }

  if (view === 'live-dashboard') {
    return (
      <>
        <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gradient-to-r from-gray-900 via-black to-gray-900">
          <div className="max-w-[2000px] mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPricing(true)}
                  className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-300 transition-all cursor-pointer"
                  title="God Mode 😉"
                >
                  Zero-Stress Sales™
                </button>
                <div className="text-sm text-gray-400">Live Co-Pilot Dashboard</div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView('admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 border border-purple-500/50 rounded-lg transition-all group"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Admin</span>
                </button>
                <button
                  onClick={() => setView('copilot')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all group"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 text-sm font-medium">Standard Co-Pilot</span>
                </button>
                <button
                  onClick={() => setView('creative-closer')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all group"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 text-sm font-medium">Creative Closer Profile</span>
                </button>
                <button
                  onClick={() => setView('manager-dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all group"
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 text-sm font-medium">Manager Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        <LiveCoPilotDashboard />
        {showPricing && <PricingPage onClose={() => setShowPricing(false)} />}
        {showFoundingMember && <FoundingMemberPage onClose={() => setShowFoundingMember(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/40">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPricing(true)}
                className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-300 transition-all cursor-pointer"
                title="God Mode 😉"
              >
                Zero-Stress Sales™
              </button>
              <div className="text-sm text-gray-400">Creative Closer Co-Pilot</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('admin')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 border border-purple-500/50 rounded-lg transition-all group"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">Admin</span>
              </button>
              <button
                onClick={() => setView('live-dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-500/50 rounded-lg transition-all group"
              >
                <Activity className="w-4 h-4 text-teal-400" />
                <span className="text-teal-300 text-sm font-medium">Live Dashboard</span>
              </button>
              <button
                onClick={() => setView('creative-closer')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all group"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 text-sm font-medium">Creative Closer Profile</span>
              </button>
              <button
                onClick={() => setView('manager-dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all group"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 text-sm font-medium">Manager Dashboard</span>
              </button>
              <button
                onClick={() => setView('profile')}
                className="flex items-center gap-4 hover:opacity-80 transition-opacity"
              >
                <div className="text-right">
                  <div className="text-white font-semibold">{CUSTOMER_NAME}</div>
                  <div className="text-sm text-teal-400">Prospect</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5">
                  <img
                    src={customerProfile.photo}
                    alt={CUSTOMER_NAME}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CreativeCloserCoPilotScreen onOpenDebrief={handleOpenDebrief} />

      {showPricing && <PricingPage onClose={() => setShowPricing(false)} />}
      {showFoundingMember && <FoundingMemberPage onClose={() => setShowFoundingMember(false)} />}

      <footer className="border-t border-gray-800/50 mt-12">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="text-gray-400 text-sm text-center">
            © 2024 Zero-Stress Sales™. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
