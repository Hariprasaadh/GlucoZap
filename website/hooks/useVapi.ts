'use client'

import { useState, useCallback, useEffect } from 'react'
import { Vapi } from '@vapi-ai/web'

interface CallState {
  status: 'inactive' | 'connecting' | 'connected' | 'user-speaking' | 'assistant-speaking' | 'error'
  error?: string
}

// Health Assistant System Message
const HEALTH_ASSISTANT_PROMPT = `You are a knowledgeable and empathetic health assistant for Glucozap, a diabetes risk assessment platform. Your goal is to help users understand their diabetes risk factors and guide them on how to use the platform.

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

export const useVapi = () => {
  const [callState, setCallState] = useState<CallState>({ status: 'inactive' })
  const [vapi, setVapi] = useState<any>(null)

  useEffect(() => {
    const loadVapi = async () => {
      if (typeof window === 'undefined') return

      try {
        const webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID

        if (!webToken || !workflowId) {
          console.error('Missing VAPI credentials')
          setCallState({ 
            status: 'error', 
            error: 'Voice assistant configuration missing' 
          })
          return
        }

        const vapiInstance = new Vapi({
          webToken,
          workflowId
        })

        setVapi(vapiInstance)
      } catch (error) {
        console.error('Failed to initialize VAPI:', error)
        setCallState({ 
          status: 'error', 
          error: 'Failed to initialize voice assistant' 
        })
      }
    }

    loadVapi()
  }, [])

  useEffect(() => {
    if (!vapi) return

    const handleCallStart = () => {
      console.log('Call started')
      setCallState({ status: 'connected' })
    }

    const handleCallEnd = () => {
      console.log('Call ended')
      setCallState({ status: 'inactive' })
    }

    const handleSpeechStart = (event: any) => {
      setCallState({ 
        status: event.type === 'user' ? 'user-speaking' : 'assistant-speaking' 
      })
    }

    const handleSpeechEnd = () => {
      setCallState({ status: 'connected' })
    }

    const handleError = (error: any) => {
      console.error('VAPI error:', error)
      setCallState({ 
        status: 'error', 
        error: error.message || 'An error occurred with the voice assistant' 
      })
    }

    // Attach event listeners
    vapi.on('call-start', handleCallStart)
    vapi.on('call-end', handleCallEnd)
    vapi.on('speech-start', handleSpeechStart)
    vapi.on('speech-end', handleSpeechEnd)
    vapi.on('error', handleError)

    // Cleanup event listeners
    return () => {
      vapi.off('call-start', handleCallStart)
      vapi.off('call-end', handleCallEnd)
      vapi.off('speech-start', handleSpeechStart)
      vapi.off('speech-end', handleSpeechEnd)
      vapi.off('error', handleError)
    }
  }, [vapi])

  const startCall = useCallback(async () => {
    if (!vapi) {
      throw new Error('Vapi not initialized')
    }

    setCallState({ status: 'connecting' })

    try {
      await vapi.start()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call'
      setCallState({ status: 'error', error: errorMessage })
      throw error
    }
  }, [vapi])

  const stopCall = useCallback(async () => {
    if (!vapi) return

    try {
      await vapi.stop()
      setCallState({ status: 'inactive' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop call'
      setCallState({ status: 'error', error: errorMessage })
      throw error
    }
  }, [vapi])

  return {
    startCall,
    stopCall,
    callState,
  }
}