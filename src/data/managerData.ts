import { SalesManagerProfile } from '../types';

export const salesManagerProfile: SalesManagerProfile = {
  name: "Sarah Chen",
  photo: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400",
  company: "Elite Performance Academy",
  teamSize: 4,
  closers: [
    {
      id: "1",
      name: "Marcus Reynolds",
      photo: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
      title: "Senior High-Ticket Closer",
      status: "on-call",
      lastActivity: "Active now",
      activeCalls: 1,
      metrics: {
        callsThisWeek: 18,
        callsThisMonth: 67,
        closeRate: 68,
        avgDealValue: 12450,
        totalRevenue: 834600,
        revenueThisMonth: 186750,
        avgCallDuration: "38:24",
        truthIndexAvg: 76
      },
      strengths: [
        {
          area: "Objection Handling",
          description: "Exceptional at handling price objections and spouse approval concerns. Converts 82% of 'I need to think about it' stalls."
        },
        {
          area: "Truth Detection",
          description: "High truth index accuracy (89%). Quickly identifies pleasers and adjusts approach accordingly."
        },
        {
          area: "Rapport Building",
          description: "Creates strong emotional connection. Prospects feel understood and safe to share vulnerabilities."
        }
      ],
      vulnerabilities: [
        {
          area: "Time Management",
          description: "Calls running 15% longer than team average. May indicate over-explaining or difficulty closing loops.",
          severity: "low"
        },
        {
          area: "High-Urgency Buyers",
          description: "Struggles with fast-action buyers who want quick decisions. Close rate drops to 42% with this segment.",
          severity: "medium"
        }
      ],
      burnoutIndicators: [
        {
          metric: "Call Volume Trend",
          status: "normal",
          value: "+12% vs last month",
          trend: "improving"
        },
        {
          metric: "Energy/Enthusiasm",
          status: "normal",
          value: "Consistent tone quality",
          trend: "stable"
        },
        {
          metric: "Recovery Time Between Calls",
          status: "warning",
          value: "8 min avg (team: 5 min)",
          trend: "declining"
        },
        {
          metric: "Weekend Activity",
          status: "normal",
          value: "2 calls (healthy boundary)",
          trend: "stable"
        }
      ],
      tendency: "evolving"
    },
    {
      id: "2",
      name: "Jessica Morgan",
      photo: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
      title: "High-Ticket Closer",
      status: "active",
      lastActivity: "12 minutes ago",
      activeCalls: 0,
      metrics: {
        callsThisWeek: 22,
        callsThisMonth: 89,
        closeRate: 71,
        avgDealValue: 9850,
        totalRevenue: 621475,
        revenueThisMonth: 156300,
        avgCallDuration: "32:18",
        truthIndexAvg: 81
      },
      strengths: [
        {
          area: "Fast Close Rate",
          description: "Closes 87% of high-urgency buyers. Excellent at creating momentum and guiding quick decisions."
        },
        {
          area: "Volume & Consistency",
          description: "Highest call volume on team. Maintains energy and performance across multiple calls per day."
        },
        {
          area: "Script Adherence",
          description: "Follows proven frameworks while maintaining natural flow. Rarely misses key diagnostic questions."
        }
      ],
      vulnerabilities: [
        {
          area: "Analytical Buyers",
          description: "Close rate drops to 48% with slow, analytical thinkers who need time to process.",
          severity: "high"
        },
        {
          area: "Emotional Depth",
          description: "Sometimes moves too quickly through pain points. May miss deeper emotional drivers.",
          severity: "medium"
        }
      ],
      burnoutIndicators: [
        {
          metric: "Call Volume Trend",
          status: "warning",
          value: "+34% vs last month",
          trend: "improving"
        },
        {
          metric: "Energy/Enthusiasm",
          status: "warning",
          value: "Slight decline in last 5 calls",
          trend: "declining"
        },
        {
          metric: "Recovery Time Between Calls",
          status: "critical",
          value: "2 min avg (team: 5 min)",
          trend: "declining"
        },
        {
          metric: "Weekend Activity",
          status: "critical",
          value: "8 calls (above healthy limit)",
          trend: "declining"
        }
      ],
      tendency: "burning-out"
    },
    {
      id: "3",
      name: "David Park",
      photo: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      title: "High-Ticket Closer",
      status: "offline",
      lastActivity: "2 hours ago",
      activeCalls: 0,
      metrics: {
        callsThisWeek: 15,
        callsThisMonth: 58,
        closeRate: 64,
        avgDealValue: 11200,
        totalRevenue: 415360,
        revenueThisMonth: 129920,
        avgCallDuration: "41:15",
        truthIndexAvg: 72
      },
      strengths: [
        {
          area: "Analytical Buyers",
          description: "Excels with logic-first, analytical thinkers. Close rate of 79% with this segment."
        },
        {
          area: "Technical Explanation",
          description: "Breaks down complex frameworks clearly. Buyers understand exactly what they're getting."
        },
        {
          area: "Guarantee & Risk Reversal",
          description: "Strong at addressing skepticism and proof concerns. Makes buyers feel safe to commit."
        }
      ],
      vulnerabilities: [
        {
          area: "Call Volume",
          description: "Below team average. May indicate confidence issues or avoiding difficult conversations.",
          severity: "medium"
        },
        {
          area: "Emotion-First Buyers",
          description: "Struggles to connect with buyers who make decisions based on feeling vs logic.",
          severity: "high"
        },
        {
          area: "Price Anchoring",
          description: "Apologetic tone when presenting price. Close rate drops 18% on Elite tier.",
          severity: "medium"
        }
      ],
      burnoutIndicators: [
        {
          metric: "Call Volume Trend",
          status: "warning",
          value: "-22% vs last month",
          trend: "declining"
        },
        {
          metric: "Energy/Enthusiasm",
          status: "warning",
          value: "Noticeable energy decline",
          trend: "declining"
        },
        {
          metric: "Recovery Time Between Calls",
          status: "normal",
          value: "5 min avg (team: 5 min)",
          trend: "stable"
        },
        {
          metric: "Weekend Activity",
          status: "normal",
          value: "0 calls (healthy boundary)",
          trend: "stable"
        }
      ],
      tendency: "burning-out"
    },
    {
      id: "4",
      name: "Aisha Williams",
      photo: "https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=400",
      title: "Junior High-Ticket Closer",
      status: "active",
      lastActivity: "5 minutes ago",
      activeCalls: 0,
      metrics: {
        callsThisWeek: 16,
        callsThisMonth: 62,
        closeRate: 58,
        avgDealValue: 8450,
        totalRevenue: 303910,
        revenueThisMonth: 96840,
        avgCallDuration: "44:52",
        truthIndexAvg: 68
      },
      strengths: [
        {
          area: "Coachability",
          description: "Implements feedback rapidly. Close rate improved 23% in last 60 days."
        },
        {
          area: "Empathy & Listening",
          description: "Creates safe space for prospects to share. Strong emotional intelligence."
        },
        {
          area: "Follow-Up Process",
          description: "Excellent at nurturing stalled deals. Converts 31% of 'think-it-overs' on follow-up."
        }
      ],
      vulnerabilities: [
        {
          area: "Objection Confidence",
          description: "Hesitates when facing strong price objections. Needs stronger reframe scripts.",
          severity: "high"
        },
        {
          area: "Call Control",
          description: "Allows prospects to derail conversation. Calls run 38% longer than team average.",
          severity: "medium"
        },
        {
          area: "Closing Mechanics",
          description: "Waits for prospect to suggest next steps vs confidently guiding to decision.",
          severity: "high"
        }
      ],
      burnoutIndicators: [
        {
          metric: "Call Volume Trend",
          status: "normal",
          value: "+8% vs last month",
          trend: "improving"
        },
        {
          metric: "Energy/Enthusiasm",
          status: "normal",
          value: "High engagement & curiosity",
          trend: "improving"
        },
        {
          metric: "Recovery Time Between Calls",
          status: "normal",
          value: "6 min avg (team: 5 min)",
          trend: "stable"
        },
        {
          metric: "Weekend Activity",
          status: "normal",
          value: "1 call (healthy learning)",
          trend: "stable"
        }
      ],
      tendency: "evolving"
    }
  ]
};
