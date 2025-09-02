'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import  {vapi}  from '@/lib/vapi.sdk'

export default function AIAssistant() {
  const [vapi, setVapi] = useState<any>(null)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'user-speaking' | 'assistant-speaking' | 'ended' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initVapi = async () => {
      try {
        const webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID

        if (!webToken || !workflowId) {
          console.warn('Vapi credentials not found. Please check your environment variables.')
          setError('Voice assistant not configured')
          return
        }

        const vapiInstance = new Vapi({
          webToken,
          workflowId
        })
        
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

        vapiInstance.on('speech-start', () => {
          setCallStatus('assistant-speaking')
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
        
        // Start the conversation automatically when the component mounts
        try {
          setCallStatus('connecting')
          await vapiInstance.start()
        } catch (err: unknown) {
          console.error('Failed to start conversation:', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to start conversation'
          setError(errorMessage)
          setCallStatus('error')
        }
      } catch (err: unknown) {
        console.error('Failed to initialize Vapi:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize voice assistant'
        setError(errorMessage)
      }
    }

    initVapi()

    return () => {
      if (vapi) {
        vapi.stop()
      }
    }
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Voice Assistant</h1>
      </div>

      <Card className="max-w-4xl mx-auto bg-navy-900 text-white p-8">
        <CardContent>
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">
                {callStatus === 'idle' ? 'Starting voice assistant...' :
                 callStatus === 'connecting' ? 'Connecting...' :
                 callStatus === 'connected' ? 'Listening...' :
                 callStatus === 'user-speaking' ? 'Listening to you...' :
                 callStatus === 'assistant-speaking' ? 'Assistant is speaking...' :
                 callStatus === 'error' ? 'Error' :
                 'Call ended'}
              </h2>
              <p className="text-gray-300">
                {callStatus === 'idle' || callStatus === 'connecting' 
                  ? 'Please wait while we connect you to the assistant...'
                  : 'Speak naturally with the assistant about your health questions'}
              </p>
            </div>

            {error && (
              <div className="flex items-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                <AlertCircle className="mr-2 h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-center space-x-8">
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center 
                  ${callStatus === 'user-speaking' ? 'bg-blue-500 animate-pulse' : 'bg-blue-500/20'}`}>
                  <span className="text-2xl">👤</span>
                </div>
                <span>You</span>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center
                  ${callStatus === 'assistant-speaking' ? 'bg-green-500 animate-pulse' : 'bg-green-500/20'}`}>
                  <span className="text-2xl">🤖</span>
                </div>
                <span>Assistant</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}