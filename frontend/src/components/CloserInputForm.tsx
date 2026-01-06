import { Save, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CloserProfile } from '../types';

interface CloserInputFormProps {
  profile: CloserProfile;
  onSave: (profile: CloserProfile) => void;
  onCancel: () => void;
}

const FRUSTRATION_OPTIONS = [
  '"I need to think about it" stalls (decision-making avoidance)',
  'It\'s too expensive / budget concerns',
  'I need to talk to my spouse/partner before deciding',
  '"I\'ve tried something similar and it didn\'t work" (burned in the past)',
  'Nervous / scared / concerned (fear-based hesitation)',
  '"I need more information" / proposal / research',
  '"Money is not available now" / funds need to be transferred'
];

const PAINFUL_PROBLEMS = [
  'Financial / business stagnation',
  'Lack of clarity or direction',
  'Overwhelm, inconsistency, procrastination',
  'Confidence / identity issues',
  'Fear-based avoidance'
];

const DECISION_STYLES = [
  'Slow, analytical thinkers (need to process and research)',
  'Emotion-first buyers (need to feel it\'s right)',
  '"Let me talk to my spouse/partner" buyers',
  'Buyers needing external validation (proof, testimonials, references)',
  'Logic-first buyers (need ROI calculations and guarantees)'
];

export default function CloserInputForm({ profile, onSave, onCancel }: CloserInputFormProps) {
  const [formData, setFormData] = useState<CloserProfile>(profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addPriceTier = () => {
    setFormData({
      ...formData,
      offer: {
        ...formData.offer,
        priceTiers: [
          ...formData.offer.priceTiers,
          { name: '', price: 0, description: '', deliverables: [] }
        ]
      }
    });
  };

  const removePriceTier = (index: number) => {
    setFormData({
      ...formData,
      offer: {
        ...formData.offer,
        priceTiers: formData.offer.priceTiers.filter((_, i) => i !== index)
      }
    });
  };

  const updatePriceTier = (index: number, field: string, value: any) => {
    const newTiers = [...formData.offer.priceTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({
      ...formData,
      offer: { ...formData.offer, priceTiers: newTiers }
    });
  };

  const toggleFrustration = (frustration: string) => {
    const current = formData.biggestFrustrations;
    const updated = current.includes(frustration)
      ? current.filter(f => f !== frustration)
      : [...current, frustration];
    setFormData({ ...formData, biggestFrustrations: updated });
  };

  const togglePainfulProblem = (problem: string) => {
    const current = formData.offer.painfulProblems;
    const updated = current.includes(problem)
      ? current.filter(p => p !== problem)
      : [...current, problem];
    setFormData({
      ...formData,
      offer: { ...formData.offer, painfulProblems: updated }
    });
  };

  const toggleDecisionStyle = (style: string) => {
    const current = formData.decisionMakingStyles;
    const updated = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style];
    setFormData({ ...formData, decisionMakingStyles: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Closer Profile Input</h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-white font-semibold transition-all"
            >
              <Save className="w-5 h-5" />
              Save Profile
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Photo URL</label>
                <input
                  type="text"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Biggest Frustrations on Calls</h2>
            <p className="text-gray-400 text-sm mb-6">Select all that apply</p>
            <div className="space-y-2">
              {FRUSTRATION_OPTIONS.map((frustration) => (
                <label key={frustration} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg cursor-pointer hover:bg-gray-800/60 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.biggestFrustrations.includes(frustration)}
                    onChange={() => toggleFrustration(frustration)}
                    className="mt-1 w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-gray-300 text-sm">{frustration}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Core Transformation</h2>
            <p className="text-gray-400 text-sm mb-4">One-sentence before → after transformation</p>
            <textarea
              value={formData.offer.coreTransformation}
              onChange={(e) => setFormData({
                ...formData,
                offer: { ...formData.offer, coreTransformation: e.target.value }
              })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              placeholder="From [current state] → [desired state]"
            />
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Painful Problems This Offer Solves</h2>
            <div className="space-y-2">
              {PAINFUL_PROBLEMS.map((problem) => (
                <label key={problem} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg cursor-pointer hover:bg-gray-800/60 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.offer.painfulProblems.includes(problem)}
                    onChange={() => togglePainfulProblem(problem)}
                    className="mt-1 w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-gray-300 text-sm">{problem}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Target Audience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Demographics</label>
                <input
                  type="text"
                  value={formData.offer.targetAudience.demographics}
                  onChange={(e) => setFormData({
                    ...formData,
                    offer: {
                      ...formData.offer,
                      targetAudience: { ...formData.offer.targetAudience, demographics: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Ages, Income, Occupation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Decision-Making Behavior</label>
                <textarea
                  value={formData.offer.targetAudience.decisionMakingBehavior}
                  onChange={(e) => setFormData({
                    ...formData,
                    offer: {
                      ...formData.offer,
                      targetAudience: { ...formData.offer.targetAudience, decisionMakingBehavior: e.target.value }
                    }
                  })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Price Tiers</h2>
              <button
                type="button"
                onClick={addPriceTier}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Tier
              </button>
            </div>
            <div className="space-y-4">
              {formData.offer.priceTiers.map((tier, index) => (
                <div key={index} className="p-4 bg-gray-800/40 border border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Tier {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removePriceTier(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tier Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updatePriceTier(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => updatePriceTier(index, 'price', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        value={tier.description}
                        onChange={(e) => updatePriceTier(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Payment Options</h2>
            <textarea
              value={formData.offer.paymentOptions.join('\n')}
              onChange={(e) => setFormData({
                ...formData,
                offer: { ...formData.offer, paymentOptions: e.target.value.split('\n').filter(o => o.trim()) }
              })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              placeholder="One option per line"
            />
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Delivery Timeline</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                <input
                  type="text"
                  value={formData.offer.deliveryTimeline.startTime}
                  onChange={(e) => setFormData({
                    ...formData,
                    offer: {
                      ...formData.offer,
                      deliveryTimeline: { ...formData.offer.deliveryTimeline, startTime: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <input
                  type="text"
                  value={formData.offer.deliveryTimeline.duration}
                  onChange={(e) => setFormData({
                    ...formData,
                    offer: {
                      ...formData.offer,
                      deliveryTimeline: { ...formData.offer.deliveryTimeline, duration: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Result Milestone</label>
                <input
                  type="text"
                  value={formData.offer.deliveryTimeline.firstResultMilestone}
                  onChange={(e) => setFormData({
                    ...formData,
                    offer: {
                      ...formData.offer,
                      deliveryTimeline: { ...formData.offer.deliveryTimeline, firstResultMilestone: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Decision-Making Styles</h2>
            <div className="space-y-2">
              {DECISION_STYLES.map((style) => (
                <label key={style} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg cursor-pointer hover:bg-gray-800/60 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.decisionMakingStyles.includes(style)}
                    onChange={() => toggleDecisionStyle(style)}
                    className="mt-1 w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-gray-300 text-sm">{style}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-white font-semibold transition-all"
          >
            <Save className="w-5 h-5" />
            Save Profile
          </button>
        </div>
      </div>
    </form>
  );
}