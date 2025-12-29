import { ArrowLeft, User, Building2, Briefcase, FileText, Target, Users, DollarSign, Calendar, AlertCircle, CheckCircle2, TrendingUp, Shield, Edit, Phone, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CloserProfile } from '../types';
import CloserInputForm from './CloserInputForm';
import IntroCallQuestions from './IntroCallQuestions';
import CallDebrief from './CallDebrief';
import { supabase, isSupabaseAvailable } from '../lib/supabase';

interface CloserProfileViewProps {
  profile: CloserProfile;
  onBack: () => void;
}

type TabType = 'overview' | 'intro-questions';

export default function CloserProfileView({ profile: initialProfile, onBack }: CloserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [profile, setProfile] = useState<CloserProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [showDebrief, setShowDebrief] = useState(false);

  useEffect(() => {
    loadProfileFromDB();
  }, []);

  const loadProfileFromDB = async () => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not configured, skipping profile load');
      return;
    }
    
    try {
      const { data, error } = await supabase!
        .from('closer_profiles')
        .select('*')
        .eq('closer_id', 'marcus-reynolds')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const loadedProfile: CloserProfile = {
          name: data.name,
          photo: data.photo,
          company: data.company,
          title: data.title,
          successCallCount: profile.successCallCount,
          difficultCallCount: profile.difficultCallCount,
          biggestFrustrations: data.biggest_frustrations,
          offer: {
            coreTransformation: data.core_transformation,
            painfulProblems: data.painful_problems,
            commonSymptoms: data.common_symptoms,
            targetAudience: data.target_audience,
            buyerBeliefs: data.buyer_beliefs,
            differentiation: data.differentiation,
            falseBeliefsLimitingStories: data.false_beliefs,
            priceTiers: data.price_tiers,
            discountsAndBonuses: data.discounts_bonuses,
            paymentOptions: data.payment_options,
            deliveryTimeline: data.delivery_timeline,
          },
          truthIndexInsights: profile.truthIndexInsights,
          decisionMakingStyles: data.decision_making_styles,
        };
        setProfile(loadedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async (updatedProfile: CloserProfile) => {
    if (!isSupabaseAvailable()) {
      alert('Supabase is not configured. Cannot save profile. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable this feature.');
      return;
    }
    
    setLoading(true);
    try {
      const { data: existing } = await supabase!
        .from('closer_profiles')
        .select('id')
        .eq('closer_id', 'marcus-reynolds')
        .maybeSingle();

      const profileData = {
        closer_id: 'marcus-reynolds',
        name: updatedProfile.name,
        photo: updatedProfile.photo,
        company: updatedProfile.company,
        title: updatedProfile.title,
        biggest_frustrations: updatedProfile.biggestFrustrations,
        core_transformation: updatedProfile.offer.coreTransformation,
        painful_problems: updatedProfile.offer.painfulProblems,
        common_symptoms: updatedProfile.offer.commonSymptoms,
        target_audience: updatedProfile.offer.targetAudience,
        buyer_beliefs: updatedProfile.offer.buyerBeliefs,
        differentiation: updatedProfile.offer.differentiation,
        false_beliefs: updatedProfile.offer.falseBeliefsLimitingStories,
        price_tiers: updatedProfile.offer.priceTiers,
        discounts_bonuses: updatedProfile.offer.discountsAndBonuses,
        payment_options: updatedProfile.offer.paymentOptions,
        delivery_timeline: updatedProfile.offer.deliveryTimeline,
        decision_making_styles: updatedProfile.decisionMakingStyles,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase!
          .from('closer_profiles')
          .update(profileData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase!
          .from('closer_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCall = () => {
    const newCount = callCount + 1;
    setCallCount(newCount);

    if (newCount % 2 === 0) {
      setShowDebrief(true);
    }
  };

  const handleDebriefComplete = () => {
    setShowDebrief(false);
  };

  if (isEditing) {
    return (
      <CloserInputForm
        profile={profile}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCompleteCall}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-semibold transition-all"
            >
              <PhoneCall className="w-5 h-5" />
              Complete Call
            </button>
            {activeTab === 'overview' && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-semibold transition-all"
              >
                <Edit className="w-5 h-5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="relative mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-teal-500/20 blur-2xl"></div>
          <div className="relative backdrop-blur-xl bg-gradient-to-r from-purple-900/60 via-blue-900/60 to-teal-900/60 border-2 border-purple-400/40 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 via-blue-400 to-teal-400 flex items-center justify-center shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">Zero-Stress Sales Training Call</h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/50 rounded-full text-purple-200 text-sm font-semibold">
                      FREE
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold">Every Tuesday</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold">2:00 PM EST</span>
                    </div>
                  </div>
                </div>
              </div>
              <a
                href="https://zoom.us/j/your-meeting-id"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 hover:from-purple-600 hover:via-blue-600 hover:to-teal-600 rounded-xl text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.5 4.5v15l11.25-7.5z" />
                </svg>
                <span>Join Training Call</span>
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-purple-400/20">
              <p className="text-gray-300 text-sm">
                Weekly group training session where we break down real sales calls, handle objections together, and level up your closing skills. Come with your questions, leave with answers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <User className="w-5 h-5" />
            Profile Overview
          </button>
          <button
            onClick={() => setActiveTab('intro-questions')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'intro-questions'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Phone className="w-5 h-5" />
            Intro Call Questions
          </button>
        </div>

        {activeTab === 'intro-questions' ? (
          <IntroCallQuestions />
        ) : (
          <>
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 p-1">
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-full h-full rounded-xl object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
              <div className="flex items-center gap-3 text-gray-300 mb-4">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span className="font-medium">{profile.company}</span>
                <span className="text-gray-500">•</span>
                <Briefcase className="w-5 h-5 text-cyan-400" />
                <span>{profile.title}</span>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-teal-500/10 border border-teal-400/30 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Successful Calls</div>
                  <div className="text-2xl font-bold text-teal-400">{profile.successCallCount}</div>
                </div>
                <div className="px-4 py-2 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Training Calls</div>
                  <div className="text-2xl font-bold text-orange-400">{profile.difficultCallCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Biggest Frustrations on Calls</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {profile.biggestFrustrations.map((frustration, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300 text-sm">{frustration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-white">Core Transformation</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">{profile.offer.coreTransformation}</p>
            </div>

            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold text-white">Painful Problems Solved</h2>
              </div>
              <div className="space-y-2">
                {profile.offer.painfulProblems.map((problem, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-300">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span className="text-sm">{problem}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Common Symptoms Before Buying</h2>
              </div>
              <div className="space-y-2">
                {profile.offer.commonSymptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-300">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">{symptom}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Target Audience</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Demographics</div>
                  <p className="text-gray-300 text-sm">{profile.offer.targetAudience.demographics}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Identity Traits</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.offer.targetAudience.identityTraits.map((trait, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/10 border border-blue-400/30 rounded-full text-blue-300 text-xs">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Decision-Making Behavior</div>
                  <p className="text-gray-300 text-sm">{profile.offer.targetAudience.decisionMakingBehavior}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Emotional Triggers</div>
                  <div className="space-y-1">
                    {profile.offer.targetAudience.emotionalTriggers.map((trigger, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        {trigger}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl font-bold text-white">Buyer Beliefs</h2>
              </div>
              <div className="space-y-2">
                {profile.offer.buyerBeliefs.map((belief, index) => (
                  <div key={index} className="p-3 bg-teal-500/5 border border-teal-400/20 rounded-lg">
                    <p className="text-gray-300 text-sm italic">"{belief}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-teal-400" />
                <h2 className="text-2xl font-bold text-white">What Makes This Offer Different</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {profile.offer.differentiation.map((item, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-400/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200 text-sm font-medium">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Price Tiers</h2>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {profile.offer.priceTiers.map((tier, index) => (
                  <div key={index} className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-6 hover:border-emerald-400/50 transition-all">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                      <div className="text-4xl font-bold text-emerald-400 mb-2">
                        ${tier.price.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-400">{tier.description}</p>
                    </div>
                    <div className="border-t border-gray-700/40 pt-4 space-y-2">
                      {tier.deliverables.map((deliverable, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Payment Options</h2>
              </div>
              <div className="space-y-2">
                {profile.offer.paymentOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Delivery Timeline</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">Start Time</div>
                  <div className="text-white font-medium">{profile.offer.deliveryTimeline.startTime}</div>
                </div>
                <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">Duration</div>
                  <div className="text-white font-medium">{profile.offer.deliveryTimeline.duration}</div>
                </div>
                <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">First Results</div>
                  <div className="text-white font-medium">{profile.offer.deliveryTimeline.firstResultMilestone}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Discounts & Bonuses</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fast-Action Bonuses</div>
                  <div className="space-y-2">
                    {profile.offer.discountsAndBonuses.fastActionBonuses.map((bonus, index) => (
                      <div key={index} className="p-2 bg-purple-500/10 border border-purple-400/30 rounded text-gray-300 text-sm">
                        {bonus}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Discount Types</div>
                  <div className="space-y-2">
                    {profile.offer.discountsAndBonuses.discountTypes.map((discount, index) => (
                      <div key={index} className="p-2 bg-emerald-500/10 border border-emerald-400/30 rounded text-gray-300 text-sm">
                        {discount}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold text-white">False Beliefs & Limiting Stories</h2>
              </div>
              <div className="space-y-2">
                {profile.offer.falseBeliefsLimitingStories.map((belief, index) => (
                  <div key={index} className="p-3 bg-orange-500/5 border border-orange-400/20 rounded-lg">
                    <p className="text-gray-300 text-sm italic">"{belief}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Truth Index: Pleaser Signals</h2>
              </div>
              <div className="space-y-2">
                {profile.truthIndexInsights.pleaserSignals.map((signal, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-400/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold text-white">Truth Index: Red Flags</h2>
              </div>
              <div className="space-y-2">
                {profile.truthIndexInsights.redFlags.map((flag, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-400/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12">
            <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Common Decision-Making Styles</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {profile.decisionMakingStyles.map((style, index) => (
                  <div key={index} className="p-4 bg-cyan-500/5 border border-cyan-400/20 rounded-lg">
                    <p className="text-gray-300 text-sm">{style}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {showDebrief && (
          <CallDebrief callNumber={callCount} onComplete={handleDebriefComplete} />
        )}
      </div>
    </div>
  );
}
