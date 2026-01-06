import { useState } from 'react';
import { X, Star, Brain, Target, Zap, Trophy, Award, Crown, CheckCircle2, AlertCircle, Rocket, Users } from 'lucide-react';

interface FoundingMemberPageProps {
  onClose: () => void;
}

export default function FoundingMemberPage({ onClose }: FoundingMemberPageProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    timezone: '',
    preferredComm: '',
    salesExperience: '',
    closingRole: '',
    markets: [] as string[],
    callTypes: '',
    averagePrice: '',
    dailyCalls: '',
    monthlyCalls: '',
    call1and2: '',
    uploadWillingness: '',
    callPlatform: '',
    uploadCapability: '',
    transcriptAccess: '',
    whyJoin: '',
    biggestChallenge: [] as string[],
    hopeToImprove: [] as string[],
    closerAttitude: '',
    openToFeedback: '',
    weeklySession: '',
    feedbackForms: '',
    testimonial: '',
    understandCommitment: '',
    openToAlternatives: [] as string[],
    nicheSpecialist: '',
    categorySpecialist: '',
    commitmentLevel: '',
    canStartSoon: '',
    linkedIn: '',
    socialMedia: '',
    referralName: '',
    referralEmail: '',
    referralPhone: '',
    additionalInfo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCheckboxChange = (field: string, value: string) => {
    const currentValues = formData[field as keyof typeof formData] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData({ ...formData, [field]: newValues });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const emailBody = `
NEW FOUNDING MEMBER APPLICATION
================================

BASIC INFORMATION
-----------------
Full Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Country/Time Zone: ${formData.country} / ${formData.timezone}
Preferred Communication: ${formData.preferredComm}

SOCIAL PROFILES
---------------
LinkedIn: ${formData.linkedIn}
Social Media: ${formData.socialMedia}

EXPERIENCE
----------
Sales Experience: ${formData.salesExperience}
Closing Role: ${formData.closingRole}
Markets: ${formData.markets.join(', ')}
Call Types: ${formData.callTypes}
Average Price: ${formData.averagePrice}

CALL VOLUME
-----------
Daily Calls: ${formData.dailyCalls}
Monthly Calls (Last 30 Days): ${formData.monthlyCalls}
Takes Call 1 & 2: ${formData.call1and2}
Upload Willingness (50-60/month): ${formData.uploadWillingness}

TECH REQUIREMENTS
-----------------
Platform: ${formData.callPlatform}
Upload Capability: ${formData.uploadCapability}
Transcript Access: ${formData.transcriptAccess}

MOTIVATION & FIT
----------------
Why Join: ${formData.whyJoin}

Biggest Challenges: ${formData.biggestChallenge.join(', ')}

Hope to Improve: ${formData.hopeToImprove.join(', ')}

Closer Attitude: ${formData.closerAttitude}
Open to Feedback: ${formData.openToFeedback}

COMMITMENT
----------
Weekly Session: ${formData.weeklySession}
Feedback Forms: ${formData.feedbackForms}
Testimonial: ${formData.testimonial}
Understands Commitment: ${formData.understandCommitment}

Commitment Level (1-10): ${formData.commitmentLevel}
Can Start in 7 Days: ${formData.canStartSoon}

FUTURE OPTIONS
--------------
Open to Alternatives: ${formData.openToAlternatives.join(', ')}
Niche Specialist Info: ${formData.nicheSpecialist}
Category Specialist: ${formData.categorySpecialist}

REFERRAL
--------
Referral Name: ${formData.referralName}
Referral Email: ${formData.referralEmail}
Referral Phone: ${formData.referralPhone}

ADDITIONAL INFO
---------------
${formData.additionalInfo}
    `.trim();

    const mailtoLink = `mailto:luba.evans@gmail.com?subject=Founding Member Application - ${formData.fullName}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1000);
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 z-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 text-lg mb-8">
              Your email client should have opened with your application. If not, please check your email application.
              We'll review your application and respond within 48 hours.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 z-50 overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Star className="w-12 h-12 text-amber-400" />
              <h1 className="text-5xl font-bold text-white">
                Founding Member Beta
              </h1>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-pink-500/20 backdrop-blur-xl border-2 border-amber-400/30 rounded-3xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              The World's First Emotional-Intelligence Co-Pilot for High-Ticket Closers
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Zero-Stress Sales™ is an AI-driven Co-Pilot built to decode the REAL psychology of buyers: their fears, desires,
              contradictions, money trauma, hidden objections, partner dynamics, emotional decision styles, and truthfulness.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="text-white/60 text-sm font-medium mb-2">NOT A</div>
              <div className="text-white text-lg line-through">Script Generator</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="text-white/60 text-sm font-medium mb-2">NOT A</div>
              <div className="text-white text-lg line-through">CRM Plugin</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="text-white/60 text-sm font-medium mb-2">NOT A</div>
              <div className="text-white text-lg line-through">AI Summary Tool</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl border-2 border-teal-400/30 rounded-3xl p-8 mb-8">
            <div className="text-center mb-8">
              <Brain className="w-16 h-16 text-teal-300 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-white mb-3">Your Second Brain on Every Call</h2>
              <p className="text-white/90 text-xl">
                A system that reveals exactly what is happening inside the buyer's mind — while you are speaking to them.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">What Zero-Stress Sales™ Does</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Target, title: 'Readiness Score', desc: 'Likelihood they will buy — and at which price tier' },
                { icon: CheckCircle2, title: 'Truth Index', desc: 'Are they telling truth, avoiding, pleasing, or hiding?' },
                { icon: AlertCircle, title: 'Objection Radar', desc: 'Predicts objections BEFORE they are spoken' },
                { icon: Brain, title: 'Dial Builder', desc: 'Extracts core emotional drivers in their own words' },
                { icon: Zap, title: 'Closer Instructions', desc: 'What to say, what NOT to say, and which direction to take' },
                { icon: Rocket, title: 'Whisper Engine', desc: 'Real-time prompts, questions, and pivots' },
                { icon: Users, title: 'Follow-Up Sequencer', desc: 'AI-generated follow-up based on emotional profile' },
                { icon: Star, title: 'Persona Detection', desc: 'Identifies buyer type, avoidance pattern, decision style' },
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <feature.icon className="w-6 h-6 text-cyan-400 mb-3" />
                  <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-2 border-green-400/30 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-bold text-white">The Founding Member Opportunity</h2>
            </div>
            <p className="text-white/90 text-lg mb-6">
              This beta is open to <strong className="text-white">25 experienced closers</strong> who want a permanent competitive advantage.
              You get <strong className="text-white">2 months of full, unrestricted access</strong> during development.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 text-center">
                <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PERFORMERS</h3>
                <div className="text-green-600 font-bold text-xl mb-3">FREE FOR LIFE</div>
                <p className="text-gray-700 text-sm">
                  Hit the quota and complete participation. Lifetime free access - never offered again!
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 text-center">
                <Award className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PARTICIPANTS</h3>
                <div className="text-blue-600 font-bold text-xl mb-3">$97/MONTH FOREVER</div>
                <p className="text-gray-700 text-sm">
                  Participated but didn't hit full quota. Founding rate locked in (vs $297-$497/month public price)
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">NON-PARTICIPANTS</h3>
                <div className="text-red-600 font-bold text-xl mb-3">REMOVED</div>
                <p className="text-gray-700 text-sm">
                  No uploads or participation = Beta access ends, lose Founder status, can't rejoin at discount
                </p>
              </div>
            </div>

            <div className="bg-amber-400 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <Trophy className="w-10 h-10 text-amber-900" />
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-1">$500 BONUS: Most Active Member</h3>
                  <p className="text-amber-900/80">
                    The founding member who uploads the most calls wins $500 cash prize!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-pink-400 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <Users className="w-10 h-10 text-pink-900" />
                <div>
                  <h3 className="text-xl font-bold text-pink-900 mb-1">$500 REFERRAL BONUS</h3>
                  <p className="text-pink-900/80">
                    Refer someone who becomes the most active member? You get an additional $500!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-bold text-white">Your Commitment for 2 Months</h2>
            </div>
            <div className="space-y-3">
              {[
                'Upload 50–60 sales calls per month (Call 1 and Call 2 both count)',
                'Upload calls within 24 hours of completion',
                'Complete short feedback forms',
                'Attend weekly calibration and training sessions',
                'Provide final testimonial (written + short video)',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-2 border-purple-400/30 rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">What Makes Zero-Stress Different</h2>
            </div>
            <p className="text-white/90 text-lg mb-4">
              This system is not built on business logic (like Gong, Clari, or Salesforce). It is built on:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Emotional intelligence',
                'Trauma psychology',
                'Decision-making neuroscience',
                'Linguistic incongruency analysis',
                'Identity-based influence models',
                'NLP + relational linguistics',
                'Human emotional pattern recognition',
                'Real-time buyer psychology mapping',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-8">
              <Rocket className="w-10 h-10 text-teal-600" />
              <h2 className="text-4xl font-bold text-gray-900">Apply to Join the 25 Founding Members</h2>
            </div>

            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 rounded-2xl p-6 mb-8">
              <p className="text-gray-900 font-bold text-lg text-center">
                You will never see this offer again. Once the first cohort is selected, the door closes permanently.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">1</div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Communication *</label>
                    <select
                      required
                      value={formData.preferredComm}
                      onChange={(e) => setFormData({ ...formData, preferredComm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="Email">Email</option>
                      <option value="Telegram">Telegram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., EST, PST, GMT+2"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedIn}
                      onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Social Media (Instagram, Twitter, etc.)</label>
                    <input
                      type="text"
                      placeholder="@yourhandle or profile URL"
                      value={formData.socialMedia}
                      onChange={(e) => setFormData({ ...formData, socialMedia: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">2</div>
                  Experience as a Closer
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">How long have you been doing sales? *</label>
                    <select
                      required
                      value={formData.salesExperience}
                      onChange={(e) => setFormData({ ...formData, salesExperience: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="0-6 months">0–6 months</option>
                      <option value="6-12 months">6–12 months</option>
                      <option value="1-2 years">1–2 years</option>
                      <option value="2-5 years">2–5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Role *</label>
                    <select
                      required
                      value={formData.closingRole}
                      onChange={(e) => setFormData({ ...formData, closingRole: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="High-ticket closer">High-ticket closer ($3K–$30K offers)</option>
                      <option value="Transformation/coaching">Transformation / coaching / personal development</option>
                      <option value="Done-for-you agency">Done-for-you agency offers</option>
                      <option value="SaaS sales">SaaS sales / product sales</option>
                      <option value="Real estate/investing">Real estate / investing offers</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Markets you close for (check all) *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Business coaching', 'Life/relationship coaching', 'Spiritual/transformation', 'Fitness/health', 'Done-for-you service', 'Marketing/agency', 'SaaS', 'Real estate', 'Other'].map(market => (
                        <label key={market} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.markets.includes(market)}
                            onChange={() => handleCheckboxChange('markets', market)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{market}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Call Types *</label>
                    <select
                      required
                      value={formData.callTypes}
                      onChange={(e) => setFormData({ ...formData, callTypes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Setter → Closer Call 1">Setter → Closer Call 1</option>
                      <option value="Closer → Call 1 + Call 2">Closer → Call 1 + Call 2</option>
                      <option value="One-call close">One-call close</option>
                      <option value="Two-call close">Two-call close</option>
                      <option value="Qual call only">Qual call only</option>
                      <option value="Mixture">Mixture</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Price Point *</label>
                    <select
                      required
                      value={formData.averagePrice}
                      onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Under $1K">Under $1K</option>
                      <option value="$1K–$3K">$1K–$3K</option>
                      <option value="$3K–$7K">$3K–$7K</option>
                      <option value="$7K–$15K">$7K–$15K</option>
                      <option value="$15K–$30K">$15K–$30K</option>
                      <option value="$30K+">$30K+</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">3</div>
                  Call Volume (Critical Selection Data)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily calls on average *</label>
                    <select
                      required
                      value={formData.dailyCalls}
                      onChange={(e) => setFormData({ ...formData, dailyCalls: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="1–2">1–2</option>
                      <option value="3–4">3–4</option>
                      <option value="5–6">5–6</option>
                      <option value="6+">6+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calls in last 30 days *</label>
                    <select
                      required
                      value={formData.monthlyCalls}
                      onChange={(e) => setFormData({ ...formData, monthlyCalls: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Under 20">Under 20</option>
                      <option value="20–40">20–40</option>
                      <option value="40–60">40–60</option>
                      <option value="60–90">60–90</option>
                      <option value="90–150">90–150</option>
                      <option value="150+">150+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Do you take both Call 1 and Call 2? *</label>
                    <select
                      required
                      value={formData.call1and2}
                      onChange={(e) => setFormData({ ...formData, call1and2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Sometimes">Sometimes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Can you upload 50–60 calls/month? *</label>
                    <select
                      required
                      value={formData.uploadWillingness}
                      onChange={(e) => setFormData({ ...formData, uploadWillingness: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes, easily">Yes, easily</option>
                      <option value="Yes, but it will stretch me">Yes, but it will stretch me</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">4</div>
                  Tech Requirements
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Call Platform *</label>
                    <select
                      required
                      value={formData.callPlatform}
                      onChange={(e) => setFormData({ ...formData, callPlatform: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Close.com">Close.com</option>
                      <option value="HighLevel">HighLevel</option>
                      <option value="Phone (recorded)">Phone (recorded)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Can you upload within 24 hours? *</label>
                    <select
                      required
                      value={formData.uploadCapability}
                      onChange={(e) => setFormData({ ...formData, uploadCapability: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="I need guidance">I need guidance</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transcript Access *</label>
                    <select
                      required
                      value={formData.transcriptAccess}
                      onChange={(e) => setFormData({ ...formData, transcriptAccess: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes, automatic">Yes, automatic</option>
                      <option value="Yes, manual upload">Yes, manual upload</option>
                      <option value="Not yet (we can set you up)">Not yet (we can set you up)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">5</div>
                  Motivation & Psychological Fit
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to be a Founding Member? *</label>
                    <textarea
                      required
                      value={formData.whyJoin}
                      onChange={(e) => setFormData({ ...formData, whyJoin: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Tell us your motivation..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biggest challenges in closing (select 2-3) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Emotional buyers', 'Avoidant buyers', 'Price objections', 'Partner objections', 'Money trauma + guilt', 'People pleasing + dishonesty', 'Buyers who ghost', 'My inconsistency', 'My follow-up gaps', 'I lack a system', 'Other'].map(challenge => (
                        <label key={challenge} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.biggestChallenge.includes(challenge)}
                            onChange={() => handleCheckboxChange('biggestChallenge', challenge)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{challenge}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What do you hope to improve? *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Higher close rate', 'Less stress', 'More clarity', 'Better handling of objections', 'Understanding buyer psychology', 'Better follow-up', 'More income', 'All of the above'].map(hope => (
                        <label key={hope} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.hopeToImprove.includes(hope)}
                            onChange={() => handleCheckboxChange('hopeToImprove', hope)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{hope}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your closer attitude *</label>
                      <select
                        required
                        value={formData.closerAttitude}
                        onChange={(e) => setFormData({ ...formData, closerAttitude: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select...</option>
                        <option value="Calm & analytical">Calm & analytical</option>
                        <option value="Direct & bold">Direct & bold</option>
                        <option value="Empathetic & intuitive">Empathetic & intuitive</option>
                        <option value="Strategic & structured">Strategic & structured</option>
                        <option value="Emotional & reactive">Emotional & reactive</option>
                        <option value="Curious & coachable">Curious & coachable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Open to feedback? *</label>
                      <select
                        required
                        value={formData.openToFeedback}
                        onChange={(e) => setFormData({ ...formData, openToFeedback: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Depends on the situation">Depends on the situation</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">6</div>
                  Commitment & Reliability
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekly 30-min calibration session? *</label>
                    <select
                      required
                      value={formData.weeklySession}
                      onChange={(e) => setFormData({ ...formData, weeklySession: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Depends on the day">Depends on the day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick feedback forms after calls? *</label>
                    <select
                      required
                      value={formData.feedbackForms}
                      onChange={(e) => setFormData({ ...formData, feedbackForms: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Final testimonial if it helps? *</label>
                    <select
                      required
                      value={formData.testimonial}
                      onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Understand losing status if non-participant? *</label>
                    <select
                      required
                      value={formData.understandCommitment}
                      onChange={(e) => setFormData({ ...formData, understandCommitment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes, I understand">Yes, I understand</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commitment level (1-10) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.commitmentLevel}
                      onChange={(e) => setFormData({ ...formData, commitmentLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Can you start within 7 days? *</label>
                    <select
                      required
                      value={formData.canStartSoon}
                      onChange={(e) => setFormData({ ...formData, canStartSoon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">7</div>
                  Classification & Future Options
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">If not selected, open to:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Later Beta Waves', 'Paid Early Access', 'Paid Full Product', 'Being notified when launches', 'Referral partnerships', 'All of the above'].map(option => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.openToAlternatives.includes(option)}
                            onChange={() => handleCheckboxChange('openToAlternatives', option)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Close in a niche we should build models for?</label>
                    <textarea
                      value={formData.nicheSpecialist}
                      onChange={(e) => setFormData({ ...formData, nicheSpecialist: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., fitness for women over 50, real estate investing..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Consider you as category specialist later?</label>
                    <select
                      value={formData.categorySpecialist}
                      onChange={(e) => setFormData({ ...formData, categorySpecialist: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-300 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-8 h-8 text-pink-600" />
                  Referral Section - Earn $500!
                </h3>
                <p className="text-gray-700 mb-4">
                  Know another closer who'd be perfect? Refer them! If they become the <strong>Most Active Champion</strong> (uploads the most calls),
                  you get an additional <strong className="text-pink-600">$500 bonus</strong>!
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Referral Name</label>
                    <input
                      type="text"
                      value={formData.referralName}
                      onChange={(e) => setFormData({ ...formData, referralName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Referral Email</label>
                    <input
                      type="email"
                      value={formData.referralEmail}
                      onChange={(e) => setFormData({ ...formData, referralEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Referral Phone</label>
                    <input
                      type="tel"
                      value={formData.referralPhone}
                      onChange={(e) => setFormData({ ...formData, referralPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Anything else we should know?</h3>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Tell us anything else that would help us understand why you're a great fit..."
                />
              </div>

              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-5 bg-white text-teal-700 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit My Application'}
                </button>
                <p className="text-white/90 mt-4 text-sm">
                  We'll review your application and respond within 48 hours
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
