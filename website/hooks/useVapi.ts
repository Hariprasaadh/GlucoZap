'use client'

import { useState, useCallback, useEffect } from 'react'

interface CallState {
  status: 'inactive' | 'connecting' | 'connected' | 'user-speaking' | 'assistant-speaking' | 'error'
  error?: string
}

interface VapiConfig {
  name: string
  firstMessage: string
  transcriber: {
    provider: string
    model: string
    language: string
  }
  voice: {
    provider: string
    voiceId: string
    stability: number
    similarityBoost: number
    speed: number
    style: number
    useSpeakerBoost: boolean
  }
  model: {
    provider: string
    model: string
    messages: Array<{
      role: string
      content: string
    }>
  }
}

export const useVapi = () => {
  const [callState, setCallState] = useState<CallState>({ status: 'inactive' })
  const [vapi, setVapi] = useState<any>(null)

  useEffect(() => {
    // Dynamically import Vapi to avoid SSR issues
    const loadVapi = async () => {
      if (typeof window !== 'undefined') {
        const  Vapi  = await import('@vapi-ai/web')
        const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY!)
        setVapi(vapiInstance)
      }
    }

    loadVapi()
  }, [])

  useEffect(() => {
    if (!vapi) return

    const handleCallStart = () => {
      setCallState({ status: 'connected' })
    }

    const handleCallEnd = () => {
      setCallState({ status: 'inactive' })
    }

    const handleSpeechStart = (e: any) => {
      if (e.type === 'user') {
        setCallState({ status: 'user-speaking' })
      } else {
        setCallState({ status: 'assistant-speaking' })
      }
    }

    const handleSpeechEnd = (e: any) => {
      setCallState({ status: 'connected' })
    }

    const handleError = (e: any) => {
      setCallState({ status: 'error', error: e.error?.message || 'Unknown error' })
    }

    vapi.on('call-start', handleCallStart)
    vapi.on('call-end', handleCallEnd)
    vapi.on('speech-start', handleSpeechStart)
    vapi.on('speech-end', handleSpeechEnd)
    vapi.on('error', handleError)

    return () => {
      vapi.off('call-start', handleCallStart)
      vapi.off('call-end', handleCallEnd)
      vapi.off('speech-start', handleSpeechStart)
      vapi.off('speech-end', handleSpeechEnd)
      vapi.off('error', handleError)
    }
  }, [vapi])

  const startCall = useCallback(async (assistantConfig: VapiConfig) => {
    if (!vapi) {
      throw new Error('Vapi not initialized')
    }

    setCallState({ status: 'connecting' })

    try {
      await vapi.start(
        assistantConfig.name,
        assistantConfig.firstMessage,
        assistantConfig.transcriber,
        assistantConfig.voice,
        assistantConfig.model
      )
    } catch (error) {
      setCallState({ status: 'error', error: (error as Error).message })
      throw error
    }
  }, [vapi])

  const stopCall = useCallback(() => {
    if (vapi) {
      vapi.stop()
    }
    setCallState({ status: 'inactive' })
  }, [vapi])

  return {
    startCall,
    stopCall,
    callState,
  }
}