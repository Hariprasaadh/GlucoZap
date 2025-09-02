'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useVapi } from '@/hooks/useVapi'

export default function AIAssistant() {
  const [isActive, setIsActive] = useState(false)
  const [callStatus, setCallStatus] = useState('inactive')
  const { startCall, stopCall, callState } = useVapi()

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

  const toggleCall = async () => {
    if (isActive) {
      stopCall()
      setIsActive(false)
    } else {
      try {
        await startCall(healthAssistantConfig)
        setIsActive(true)
      } catch (error) {
        console.error('Failed to start call:', error)
      }
    }
  }

  useEffect(() => {
    setCallStatus(callState.status)
  }, [callState])

  return (
    <div className="container mx-auto py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Health Assistant</h1>
      <p className="text-gray-400 mb-8">
        Talk to our AI health assistant for guidance on diabetes risk factors, screening results, and lifestyle recommendations.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Voice Assistant</CardTitle>
            <CardDescription className="text-gray-400">
              Speak with our AI health assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="flex justify-center space-x-12 mb-8">
                {/* User Icon */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-2 ${
                      callStatus === 'user-speaking' ? 'animate-pulse ring-4 ring-blue-400' : ''
                    }`}
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">You</span>
                </div>

                {/* Assistant Icon */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-2 ${
                      callStatus === 'assistant-speaking' ? 'animate-pulse ring-4 ring-green-400' : ''
                    }`}
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">Assistant</span>
                </div>
              </div>

              <Button 
                onClick={toggleCall}
                className={`w-32 h-32 rounded-full ${
                  isActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isActive ? (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path>
                  </svg>
                )}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Status: <span className="font-medium capitalize">{callStatus.replace('-', ' ')}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Common Questions</CardTitle>
            <CardDescription className="text-gray-400">
              Topics you can ask about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-white mb-2">Diabetes Risk Factors</h3>
                <p className="text-sm text-gray-300">Ask about genetic, lifestyle, and metabolic risk factors</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-white mb-2">Screening Results</h3>
                <p className="text-sm text-gray-300">Get help understanding your Glucozap assessment results</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-white mb-2">Lifestyle Recommendations</h3>
                <p className="text-sm text-gray-300">Learn about diet, exercise, and other preventive measures</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-white mb-2">Platform Guidance</h3>
                <p className="text-sm text-gray-300">Get help using Glucozap features and understanding next steps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Conversation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Speak clearly and at a normal pace</li>
            <li>Ask one question at a time for best results</li>
            <li>Feel free to ask for clarification if needed</li>
            <li>Remember this is for informational purposes only</li>
            <li>For personal medical advice, always consult your doctor</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}