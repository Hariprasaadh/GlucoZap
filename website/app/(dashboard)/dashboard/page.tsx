'use client'

import { useRouter } from 'next/navigation'  // Add this import at the top
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RiskChart from '@/components/dashboard/RiskChart'
import StatsCards from '@/components/dashboard/StatsCards'
import { Stethoscope, Plus, TrendingUp, FileText, Calendar, Activity, Sparkles, Users } from 'lucide-react'
import Vapi from '@vapi-ai/web'
import styles from './dashboard.module.css'

// Types
interface HistoryItem {
  date: string;
  score: number;
}

interface MockData {
  riskScore: number;
  riskLevel: string;
  lastScreening: string;
  recommendations: string[];
  history: HistoryItem[];
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'user-speaking' | 'assistant-speaking' | 'ended' | 'error';

// Mock data - would come from API in real implementation
const mockData: MockData = {
  riskScore: 42,
  riskLevel: 'Moderate',
  lastScreening: '2023-10-15',
  recommendations: [
    'Consider dietary changes to reduce sugar intake',
    'Increase physical activity to 150 minutes per week',
    'Schedule follow-up screening in 3 months'
  ],
  history: [
    { date: '2023-10-15', score: 42 },
    { date: '2023-07-10', score: 38 },
    { date: '2023-04-05', score: 45 },
  ]
}

// Health Assistant Configuration
const healthAssistantConfig = {
  name: "Glucozap Health Assistant",
  firstMessage: "Hello! I'm your Glucozap health assistant. I'm here to help answer your questions about diabetes risk factors, screening results, and lifestyle recommendations.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a knowledgeable and empathetic health assistant for Glucozap, a diabetes risk assessment platform. Your goal is to help users understand their diabetes risk factors and guide them on how to use the platform.

Guidelines:
- Be professional, yet warm and welcoming
- Keep responses concise and to the point
- Explain medical terms in simple language
- Focus on diabetes risk factors, prevention, and management
- Help users interpret their screening results
- Provide lifestyle recommendations based on established medical guidelines
- If asked about specific medical advice, always recommend consulting with a healthcare professional
- Be supportive and encouraging

Areas of expertise:
- Diabetes risk factors (diet, exercise, genetics, etc.)
- Explanation of screening methods used by Glucozap
- Interpretation of risk assessment results
- Lifestyle modifications to reduce diabetes risk
- General information about prediabetes and diabetes
- Guidance on using the Glucozap platform

Remember: You are not a replacement for professional medical advice. Always encourage users to consult with their doctor for personalized medical guidance.`
      },
    ],
  },
}

export default function Dashboard() {
  const router = useRouter()  // Add this hook
  const [data, setData] = useState<MockData>(mockData)
  const [isLoaded, setIsLoaded] = useState(false)

  // Simulate loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Get button state and styling
  const getButtonState = () => {
    return { icon: Stethoscope, text: 'Open AI Assistant', disabled: false }
  }

  const buttonState = getButtonState()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)`
        }} />
      </div>

      {/* Header Section with Glassmorphism Effect */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
        <div className="container mx-auto py-6 px-4">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isLoaded ? styles.fadeInUp : 'opacity-0'}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white ${styles.floatingElement}`}>
                  <Sparkles size={24} />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Health Dashboard
                </h1>
              </div>
              <p className="text-gray-400 text-lg ml-14">Monitor your diabetes risk and health insights</p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Link href="/patient-dashboard" className="flex items-center gap-2">
                  <Users size={20} />
                  Patient Dashboard
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg"
                className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 ${styles.pulseGlow}`}
              >
                <Link href="/screening" className="flex items-center gap-2">
                  <Plus size={20} />
                  New Assessment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 space-y-8 relative">
        {/* Enhanced Stats Cards Component */}
        <div className={`transform transition-all duration-500 hover:scale-[1.01] ${isLoaded ? styles.fadeInUpDelay1 : 'opacity-0'}`}>
          <StatsCards 
            riskScore={data.riskScore} 
            riskLevel={data.riskLevel} 
            lastScreening={data.lastScreening} 
          />
        </div>

        {/* Main Content Grid */}
        <div className={`grid lg:grid-cols-3 gap-8 ${isLoaded ? styles.fadeInUpDelay2 : 'opacity-0'}`}>
          {/* Risk Trend Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 ${styles.shimmer}`} />
              <CardHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white">Risk Trend Analysis</CardTitle>
                    <CardDescription className="text-gray-400">Track your diabetes risk progression over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <RiskChart data={data.history} />
              </CardContent>
            </Card>
          </div>

          {/* Recommendations - Takes 1 column */}
          <div className="space-y-6">
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 ${styles.shimmer}`} />
              <CardHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
                    <Activity size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Health Recommendations</CardTitle>
                    <CardDescription className="text-gray-400">Personalized suggestions for you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {data.recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-gray-700/70 hover:to-gray-600/70 transition-all duration-200 border border-gray-600/30 hover:border-blue-500/30 group cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-200" />
                    <span className="text-gray-300 leading-relaxed group-hover:text-white transition-colors duration-200">{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats Mini Card with animated background */}
            <Card className="bg-gradient-to-br from-amber-900/50 to-orange-900/50 border-amber-700/50 shadow-lg hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-300">Next Screening</p>
                    <p className="text-2xl font-bold text-amber-100">Due Soon</p>
                    <p className="text-xs text-amber-400 mt-1">Schedule in 2 weeks</p>
                  </div>
                  <Calendar className={`h-8 w-8 text-amber-400 ${styles.floatingElement}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Recent Reports Table */}
        <Card className={`bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 group overflow-hidden ${isLoaded ? styles.fadeInUpDelay3 : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-gray-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-gray-500 ${styles.shimmer}`} />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg text-white">
                  <FileText size={24} />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Recent Health Reports</CardTitle>
                  <CardDescription className="text-gray-400">Your comprehensive screening history</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-800/50 to-slate-800/50 border-b border-gray-700/50">
                    <th className="text-left p-6 font-semibold text-gray-300">Date</th>
                    <th className="text-left p-6 font-semibold text-gray-300">Risk Score</th>
                    <th className="text-left p-6 font-semibold text-gray-300">Level</th>
                    <th className="text-right p-6 font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((item, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-700/30 last:border-0 hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-indigo-900/20 transition-all duration-200 group"
                    >
                      <td className="p-6 text-gray-300 font-medium">{item.date}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">{item.score}</span>
                          <span className="text-gray-500">/100</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${
                          item.score < 30 
                            ? 'bg-gradient-to-r from-emerald-900/50 to-green-900/50 text-emerald-300 border border-emerald-700/50 hover:shadow-emerald-500/20' :
                          item.score < 70 
                            ? 'bg-gradient-to-r from-amber-900/50 to-yellow-900/50 text-amber-300 border border-amber-700/50 hover:shadow-amber-500/20' :
                            'bg-gradient-to-r from-red-900/50 to-rose-900/50 text-red-300 border border-red-700/50 hover:shadow-red-500/20'
                        }`}>
                          {item.score < 30 ? 'Low Risk' : item.score < 70 ? 'Moderate' : 'High Risk'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-blue-900/30 hover:border-blue-500/50 hover:text-blue-300 transition-all duration-200 hover:shadow-md"
                        >
                          <Link href={`/report`} className="flex items-center gap-2">
                            <FileText size={16} />
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Floating AI Assistant button with enhanced styling */}
        <div className="fixed bottom-8 right-8 z-50">
          <div className="relative group">
            {/* Multiple pulse rings */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-green-600 rounded-full opacity-20 group-hover:opacity-40 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-green-600 rounded-full opacity-30 group-hover:opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            
            <button
              onClick={() => router.push('/ai-assistant')}
              className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95
                bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700
                text-white group ${styles.floatingElement}`}
              title="Open AI Health Assistant"
            >
              <Stethoscope size={28} className="transition-transform duration-300 group-hover:rotate-12" />
              
              {/* Enhanced Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-slate-800/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  AI Health Assistant
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/95"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}