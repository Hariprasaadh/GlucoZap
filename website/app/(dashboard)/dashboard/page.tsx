'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RiskChart from '@/components/dashboard/RiskChart'
import StatsCards from '@/components/dashboard/StatsCards'
import { Mic, MicOff, Stethoscope, AlertCircle } from 'lucide-react'

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
  const [data, setData] = useState<MockData>(mockData)
  const [vapi, setVapi] = useState<any>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Initialize Vapi
  useEffect(() => {
    const initVapi = async () => {
      try {
        // Check if API key exists
        const apiKey = process.env.NEXT_PUBLIC_VAPI_KEY
        if (!apiKey) {
          console.warn('Vapi API key not found. Please add NEXT_PUBLIC_VAPI_KEY to your .env.local file')
          setError('Voice assistant not configured')
          return
        }

        // Dynamically import Vapi to avoid SSR issues
        const { Vapi } = await import('@vapi-ai/web')
        const vapiInstance = new Vapi(apiKey)
        
        // Set up event listeners
        vapiInstance.on('call-start', () => {
          console.log('Call started')
          setCallStatus('connected')
          setError(null)
        })

        vapiInstance.on('call-end', () => {
          console.log('Call ended')
          setCallStatus('ended')
        })

        vapiInstance.on('speech-start', (event: any) => {
          if (event.type === 'user') {
            setCallStatus('user-speaking')
          } else {
            setCallStatus('assistant-speaking')
          }
        })

        vapiInstance.on('speech-end', () => {
          setCallStatus('connected')
        })

        vapiInstance.on('error', (error: any) => {
          console.error('Vapi error:', error)
          setError(error?.message || 'An error occurred with the voice assistant')
          setCallStatus('error')
        })

        setVapi(vapiInstance)
      } catch (err: unknown) {
        console.error('Failed to initialize Vapi:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize voice assistant'
        setError(errorMessage)
      }
    }

    initVapi()

    // Cleanup on unmount
    return () => {
      if (vapi) {
        vapi.stop()
      }
    }
  }, [])

  const startConversation = useCallback(async () => {
    if (!vapi) {
      setError('Voice assistant not initialized')
      return
    }

    try {
      setCallStatus('connecting')
      setError(null)
      
      // Start the call with the assistant configuration
      await vapi.start(
        healthAssistantConfig.name,
        healthAssistantConfig.firstMessage,
        healthAssistantConfig.transcriber,
        healthAssistantConfig.voice,
        healthAssistantConfig.model
      )
      
    } catch (err: unknown) {
      console.error('Failed to start conversation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start conversation'
      setError(errorMessage)
      setCallStatus('error')
    }
  }, [vapi])

  const stopConversation = useCallback(async () => {
    if (!vapi) return

    try {
      await vapi.stop()
      setCallStatus('idle')
    } catch (err: unknown) {
      console.error('Failed to stop conversation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop conversation'
      setError(errorMessage)
      setCallStatus('error')
    }
  }, [vapi])

  // Get button state and styling
  const getButtonState = () => {
    if (callStatus === 'connecting') return { icon: Mic, text: 'Connecting...', disabled: true }
    if (callStatus === 'connected' || callStatus === 'user-speaking' || callStatus === 'assistant-speaking') 
      return { icon: MicOff, text: 'End Call', disabled: false }
    if (callStatus === 'error') return { icon: AlertCircle, text: 'Error', disabled: true }
    return { icon: Stethoscope, text: 'Start Assistant', disabled: false }
  }

  const buttonState = getButtonState()
  const isCallActive = callStatus !== 'idle' && callStatus !== 'ended' && callStatus !== 'error'

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/screening">New Assessment</Link>
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>Voice Assistant Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Component */}
      <StatsCards 
        riskScore={data.riskScore} 
        riskLevel={data.riskLevel} 
        lastScreening={data.lastScreening} 
      />

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend</CardTitle>
            <CardDescription>Your diabetes risk over time</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskChart data={data.history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Personalized health suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your screening history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Risk Score</th>
                  <th className="text-left p-4">Level</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">{item.score}/100</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.score < 30 ? 'bg-green-100 text-green-800' :
                        item.score < 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.score < 30 ? 'Low' : item.score < 70 ? 'Moderate' : 'High'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/reports/${index}`}>View Details</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Floating AI Assistant button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={isCallActive ? stopConversation : startConversation}
          disabled={buttonState.disabled}
          className={`p-4 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
            buttonState.disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : isCallActive
              ? 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700'
              : 'bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700'
          } text-white`}
          title={buttonState.text}
        >
          <buttonState.icon size={24} className={callStatus === 'connecting' ? 'animate-pulse' : ''} />
        </button>
        
        {/* Status indicator */}
        {callStatus !== 'idle' && (
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white">
            <div className={`w-full h-full rounded-full ${
              callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              callStatus === 'user-speaking' ? 'bg-blue-500 animate-pulse' :
              callStatus === 'assistant-speaking' ? 'bg-green-500 animate-pulse' :
              callStatus === 'connected' ? 'bg-green-500' :
              'bg-gray-500'
            }`} />
          </div>
        )}
      </div>
    </div>
  )
}