'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  MessageCircle, 
  Send, 
  RefreshCw,
  Bot,
  User,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Settings,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTranscript?: boolean
}

export default function AIAssistantPage() {
  const router = useRouter()
  const [vapi, setVapi] = useState<any>(null)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'user-speaking' | 'assistant-speaking' | 'ended' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [lastFinalTranscript, setLastFinalTranscript] = useState('')
  const [transcriptTimeout, setTranscriptTimeout] = useState<NodeJS.Timeout | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  const addDebugInfo = (info: string) => {
    console.log('[DEBUG]', info)
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`])
  }

  // Create a unique ID generator to avoid duplicate keys
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string, isTranscript = false) => {
    // Prevent duplicate messages with same content within 1 second
    const now = new Date()
    const isDuplicate = messages.some(msg => 
      msg.content === content && 
      msg.role === role && 
      (now.getTime() - msg.timestamp.getTime()) < 1000
    )
    
    if (isDuplicate) {
      console.log('Preventing duplicate message:', content)
      return
    }
    
    const newMessage: Message = {
      id: generateUniqueId(),
      role,
      content,
      timestamp: now,
      isTranscript
    }
    setMessages(prev => [...prev, newMessage])
  }

  const checkBrowserCompatibility = () => {
    const issues = []
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('Browser does not support microphone access')
    }
    
    if (!window.WebSocket) {
      issues.push('Browser does not support WebSocket connections')
    }
    
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      issues.push('Browser does not support Web Audio API')
    }
    
    return issues
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const initVapi = async () => {
      try {
        addDebugInfo('Starting Vapi initialization...')
        
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
        if (!publicKey) {
          setError('Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in environment variables')
          addDebugInfo('ERROR: Missing public key')
          return
        }
        
        addDebugInfo(`Public key found: ${publicKey.substring(0, 10)}...`)

        if (typeof window !== 'undefined') {
          try {
            const { default: Vapi } = await import('@vapi-ai/web')
            addDebugInfo('Loaded Vapi via dynamic import')
            setupVapi(Vapi, publicKey)
          } catch (importError) {
            addDebugInfo('Dynamic import failed, trying CDN...')
            console.error('Import error:', importError)
            setError('Failed to load VAPI SDK. Please check your internet connection.')
            setCallStatus('error')
            return
            loadVapiFromCDN(publicKey)
          }
        }
      } catch (err: unknown) {
        console.error('Failed to initialize Vapi:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize voice assistant'
        setError(errorMessage)
        addDebugInfo(`Initialization error: ${errorMessage}`)
        setCallStatus('error')
      }
    }

    const loadVapiFromCDN = (publicKey: string) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js'
      script.onload = () => {
        addDebugInfo('CDN script loaded')
        if ((window as any).Vapi) {
          setupVapi((window as any).Vapi, publicKey)
        } else {
          setError('Vapi SDK not found on window object')
          addDebugInfo('ERROR: Vapi not found on window')
        }
      }
      script.onerror = () => {
        setError('Failed to load Vapi SDK from CDN')
        addDebugInfo('ERROR: CDN script failed to load')
      }
      document.head.appendChild(script)
    }

    const setupVapi = (VapiClass: any, publicKey: string) => {
      try {
        addDebugInfo('Setting up Vapi instance...')
        console.log('🔧 Creating Vapi instance with key:', publicKey.substring(0, 10) + '...')
        
        const vapiInstance = new VapiClass(publicKey)
        console.log('✅ Vapi instance created successfully')
        
        vapiInstance.on('call-start', () => {
          addDebugInfo('✅ Call started successfully')
          setCallStatus('connected')
          setIsCallActive(true)
          setError(null)
          addMessage('system', 'Voice call started. You can now speak with the assistant.')
        })

        vapiInstance.on('call-end', () => {
          addDebugInfo('📞 Call ended normally')
          setCallStatus('ended')
          setIsCallActive(false)
          addMessage('system', 'Voice call ended.')
        })

        vapiInstance.on('speech-start', () => {
          addDebugInfo('🎤 User speaking detected')
          setCallStatus('user-speaking')
        })

        vapiInstance.on('speech-end', () => {
          addDebugInfo('🎤 User stopped speaking')
          setCallStatus('connected')
        })

        vapiInstance.on('message', (message: any) => {
          addDebugInfo(`Message: ${message.type}`)
          console.log('Vapi message:', message)
          
          if (message.type === 'transcript') {
            if (message.transcriptType === 'partial') {
              // Clear any existing timeout when we get a new partial transcript
              if (transcriptTimeout) {
                clearTimeout(transcriptTimeout)
                setTranscriptTimeout(null)
              }
              setCurrentTranscript(message.transcript)
            } else if (message.transcriptType === 'final') {
              addMessage('user', message.transcript, true)
              setLastFinalTranscript(message.transcript)
              setCurrentTranscript(message.transcript)
              
              // Keep the final transcript visible for 3 seconds
              const timeout = setTimeout(() => {
                setCurrentTranscript('')
                setLastFinalTranscript('')
              }, 3000)
              setTranscriptTimeout(timeout)
            }
          } else if (message.type === 'function-call') {
            addMessage('system', `Function called: ${message.functionCall.name}`)
          } else if (message.type === 'assistant-message') {
            addMessage('assistant', message.content)
          }
        })

        vapiInstance.on('error', (error: any) => {
          // Handle empty error objects
          let errorMsg = 'Unknown connection error'
          let errorDetails = 'No specific error details provided'
          let type, stage, innerError, context, totalDuration, timestamp
          
          if (error) {
            // Extract specific VAPI error properties
            ({ type, stage, error: innerError, totalDuration, timestamp, context } = error)
            
            if (typeof error === 'string') {
              errorMsg = error
              errorDetails = error
            } else if (error.message) {
              errorMsg = error.message
              errorDetails = error.message
            } else if (type || stage || innerError) {
              // Build detailed error message from VAPI error structure
              const errorParts = []
              if (type) errorParts.push(`Type: ${type}`)
              if (stage) errorParts.push(`Stage: ${stage}`)
              if (innerError) {
                if (typeof innerError === 'string') {
                  errorParts.push(`Error: ${innerError}`)
                } else if (innerError.message) {
                  errorParts.push(`Error: ${innerError.message}`)
                } else {
                  errorParts.push(`Error: ${JSON.stringify(innerError)}`)
                }
              }
              if (context) errorParts.push(`Context: ${JSON.stringify(context)}`)
              
              errorMsg = errorParts.length > 0 ? errorParts.join(' | ') : 'VAPI connection failed'
              errorDetails = `VAPI Error Details - ${errorParts.join(', ')}`
              
              if (error.totalDuration) {
                errorDetails += ` (Duration: ${error.totalDuration}ms)`
              }
            } else if (error.toString && error.toString() !== '[object Object]') {
              errorMsg = error.toString()
              errorDetails = error.toString()
            } else {
              // Try to extract any meaningful information from the error object
              const errorKeys = Object.keys(error)
              if (errorKeys.length > 0) {
                errorDetails = `Error object contains: ${errorKeys.join(', ')}`
                errorMsg = `Connection error (${errorKeys.length} properties)`
                
                // Try to get more specific info
                const values = errorKeys.map(key => `${key}: ${JSON.stringify(error[key])}`).join(', ')
                errorDetails = `VAPI Error - ${values}`
              } else {
                errorDetails = 'Empty error object - likely a connection failure'
                errorMsg = 'Connection failed - please try again'
              }
            }
          }
          
          addDebugInfo(`❌ Error: ${errorMsg}`)
          
          // Log detailed error information for debugging
          console.group('🔴 Vapi Error Details')
          console.error('Raw error object:', error)
          console.log('Error type:', typeof error)
          console.log('Error keys:', error ? Object.keys(error) : 'null/undefined')
          if (error) {
            console.log('VAPI type:', error.type)
            console.log('VAPI stage:', error.stage)
            console.log('VAPI inner error:', error.error)
            console.log('VAPI context:', error.context)
            console.log('VAPI timestamp:', error.timestamp)
            console.log('VAPI duration:', error.totalDuration)
          }
          console.log('Processed message:', errorMsg)
          console.groupEnd()
          
          // Handle specific error types based on VAPI error structure
          if (stage === 'connecting' || type === 'connection-failed') {
            setError('Failed to establish voice connection. Please check your internet connection and try again.')
          } else if (stage === 'microphone' || type === 'microphone-error') {
            setError('Microphone access failed. Please allow microphone permissions and refresh the page.')
          } else if (type === 'start-method-error' && errorMsg.includes('Bad Request')) {
            setError('Voice assistant configuration error. Please try again or contact support if the issue persists.')
          } else if (errorMsg.includes('Meeting has ended') || errorMsg.includes('WASM_OR_WORKER_NOT_READY')) {
            setError('Voice connection failed due to Daily.co WebRTC issues. Please refresh the page and try a different browser.')
          } else if (errorMsg.includes('permission') || errorMsg.includes('Permission')) {
            setError('Microphone permission required. Please allow microphone access and try again.')
          } else if (errorMsg.includes('Connection failed') || errorMsg.includes('connection error')) {
            setError('Connection failed. Please check your internet connection and try again.')
          } else if (errorDetails.includes('Empty error object')) {
            setError('Connection failed unexpectedly. This might be a network issue. Please refresh the page and try again.')
          } else {
            setError(`Voice assistant error: ${errorMsg}`)
          }
          
          setCallStatus('error')
          setIsCallActive(false)
          addMessage('system', `Error: ${errorMsg}`)
        })

        vapiInstance.on('volume-level', (volume: number) => {
          if (Math.random() < 0.1) {
            addDebugInfo(`Volume: ${Math.round(volume * 100)}%`)
          }
        })

        setVapi(vapiInstance)
        addDebugInfo('✅ Vapi setup complete')
        addMessage('system', 'Voice assistant initialized and ready to use.')
        
        // Test Vapi instance
        console.log('🧪 Testing Vapi instance methods...')
        console.log('Vapi methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(vapiInstance)))
        
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to setup Vapi'
        setError(errorMessage)
        addDebugInfo(`Setup error: ${errorMessage}`)
        setCallStatus('error')
        console.error('🔴 Vapi setup failed:', err)
      }
    }

    initVapi()

    return () => {
      if (vapi) {
        try {
          if (isCallActive) {
            vapi.stop()
          }
          // Clean up any remaining connections
          addDebugInfo('Cleaning up Vapi instance')
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError)
        }
      }
      
      // Clear transcript timeout on unmount
      if (transcriptTimeout) {
        clearTimeout(transcriptTimeout)
      }
    }
  }, [])

  const startCall = async () => {
    if (!vapi) {
      setError('Voice assistant not initialized')
      addDebugInfo('❌ Cannot start: Vapi not initialized')
      return
    }

    try {
      setCallStatus('connecting')
      setError(null)
      addDebugInfo('Starting call...')
      
      // Check browser compatibility
      const compatibilityIssues = checkBrowserCompatibility()
      if (compatibilityIssues.length > 0) {
        setError(`Browser compatibility issues: ${compatibilityIssues.join(', ')}`)
        setCallStatus('error')
        return
      }
      
      // Check microphone permissions first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        addDebugInfo('✅ Microphone permission granted')
      } catch (permError) {
        console.error('Microphone permission error:', permError)
        setError('Microphone permission required. Please allow microphone access and refresh the page.')
        setCallStatus('error')
        return
      }
      
      const assistant = {
        name: "Health Assistant",
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: "You are GlucoZap's AI health assistant. You specialize in diabetes management, blood sugar monitoring, and general health guidance. Keep responses concise, friendly, and always recommend consulting healthcare professionals for medical decisions. You can help with meal planning, exercise tips, medication reminders, and interpreting health data."
            }
          ]
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
        },
        firstMessage: "Hello! I'm your GlucoZap health assistant. I'm here to help you with diabetes management, health questions, and wellness guidance. How can I assist you today?",
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US"
        }
      }

      await vapi.start(assistant)
      addDebugInfo('✅ Call start request sent successfully')
    } catch (err: unknown) {
      console.group('🔴 Start Call Error')
      console.error('Raw error:', err)
      console.log('Error type:', typeof err)
      console.log('Error instanceof Error:', err instanceof Error)
      console.log('Error keys:', err ? Object.keys(err as object) : 'null/undefined')
      console.groupEnd()
      
      let errorMessage = 'Failed to start conversation'
      let errorDetails = 'Unknown error occurred'
      
      if (err instanceof Error) {
        errorMessage = err.message
        errorDetails = err.stack || err.message
      } else if (typeof err === 'string') {
        errorMessage = err
        errorDetails = err
      } else if (err && typeof err === 'object') {
        const errorObj = err as any
        errorMessage = errorObj.message || errorObj.error || 'Connection failed'
        errorDetails = JSON.stringify(err, null, 2)
      }
      
      addDebugInfo(`❌ Start call error: ${errorMessage}`)
      
      // Handle specific error types with more detailed guidance
      if (errorMessage.includes('Meeting has ended') || errorMessage.includes('WASM_OR_WORKER_NOT_READY')) {
        setError('Voice connection failed due to Daily.co WebRTC issues. Please refresh the page and try a different browser (Chrome/Firefox recommended).')
      } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        setError('Microphone permission denied. Please click the microphone icon in your address bar, allow access, and refresh the page.')
      } else if (errorMessage.includes('network') || errorMessage.includes('Network') || errorMessage.includes('connect')) {
        setError('Network connection failed. Please check your internet connection and try again.')
      } else if (errorMessage.includes('Failed to start conversation')) {
        setError('Unable to connect to voice assistant. Please check your VAPI configuration and try again.')
      } else {
        setError(`Connection failed: ${errorMessage}. Please try refreshing the page.`)
      }
      
      setCallStatus('error')
    }
  }

  const endCall = () => {
    if (vapi && isCallActive) {
      try {
        vapi.stop()
        addDebugInfo('Call ended by user')
        setCallStatus('ended')
        setIsCallActive(false)
      } catch (endError) {
        console.error('Error ending call:', endError)
        addDebugInfo('Error ending call, forcing cleanup')
        setCallStatus('ended')
        setIsCallActive(false)
      }
    }
  }

  const toggleMute = () => {
    if (vapi) {
      const newMutedState = !isMuted
      vapi.setMuted(newMutedState)
      setIsMuted(newMutedState)
      addMessage('system', newMutedState ? 'Microphone muted' : 'Microphone unmuted')
    }
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    
    addMessage('user', chatInput)
    
    if (vapi && isCallActive) {
      vapi.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: chatInput
        }
      })
    }
    
    setChatInput('')
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendChatMessage()
  }

  const resetAssistant = () => {
    // Stop any active call first
    if (vapi && isCallActive) {
      try {
        vapi.stop()
      } catch (stopError) {
        console.warn('Error stopping call during reset:', stopError)
      }
    }
    
    setError(null)
    setCallStatus('idle')
    setIsCallActive(false)
    setMessages([])
    setCurrentTranscript('')
    setLastFinalTranscript('')
    setDebugInfo([])
    setIsMuted(false)
    
    // Clear any pending transcript timeout
    if (transcriptTimeout) {
      clearTimeout(transcriptTimeout)
      setTranscriptTimeout(null)
    }
    
    addMessage('system', 'Assistant reset. Ready to start a new conversation.')
    addDebugInfo('🔄 Assistant reset by user')
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connected': return 'bg-green-500'
      case 'user-speaking': return 'bg-blue-500'
      case 'assistant-speaking': return 'bg-purple-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'idle': return 'Ready to start'
      case 'connecting': return 'Connecting...'
      case 'connected': return 'Connected - Listening'
      case 'user-speaking': return 'You are speaking'
      case 'assistant-speaking': return 'Assistant is speaking'
      case 'error': return 'Error occurred'
      case 'ended': return 'Call ended'
      default: return 'Unknown status'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/GlucoZap.png" alt="GlucoZap Logo" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold">GlucoZap</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                AI Health Assistant
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Voice-powered diabetes and health guidance
              </p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor()}`}></div>
                <span className="text-lg font-semibold">{getStatusText()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowChat(!showChat)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </Button>
                <Button
                  onClick={resetAssistant}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
            
            {currentTranscript && (
              <div className={`border rounded-lg p-3 mb-4 ${
                currentTranscript === lastFinalTranscript 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <div className={`flex items-center gap-2 text-sm ${
                  currentTranscript === lastFinalTranscript 
                    ? 'text-green-300' 
                    : 'text-blue-300'
                }`}>
                  <Mic className="w-4 h-4" />
                  <span>
                    {currentTranscript === lastFinalTranscript 
                      ? `You said: "${currentTranscript}"` 
                      : `Listening: "${currentTranscript}"`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
              
              {/* Troubleshooting Tips */}
              <div className="mt-3 text-sm text-red-200/80">
                <strong>Troubleshooting tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {error.includes('Microphone') || error.includes('permission') ? (
                    <>
                      <li className="text-yellow-300">🎤 Click the microphone icon in your browser's address bar</li>
                      <li className="text-yellow-300">🔓 Allow microphone access for this website</li>
                      <li className="text-yellow-300">🔄 Refresh the page after granting permissions</li>
                    </>
                  ) : error.includes('connection') || error.includes('Connection') ? (
                    <>
                      <li className="text-blue-300">🌐 Check your internet connection stability</li>
                      <li className="text-blue-300">🔄 Try refreshing the page</li>
                      <li className="text-blue-300">📡 Move closer to your WiFi router if using wireless</li>
                    </>
                  ) : error.includes('Daily.co') || error.includes('WebRTC') ? (
                    <>
                      <li className="text-purple-300">🌐 Use Chrome or Firefox for best WebRTC support</li>
                      <li className="text-purple-300">🔌 Disable VPN if you're using one</li>
                      <li className="text-purple-300">🛡️ Temporarily disable browser extensions</li>
                    </>
                  ) : (
                    <>
                      <li>Ensure microphone permissions are enabled for this website</li>
                      <li>Try refreshing the page and connecting again</li>
                      <li>Check your internet connection</li>
                      <li>Try using a different browser (Chrome or Firefox recommended)</li>
                      <li>Disable browser extensions that might block audio</li>
                    </>
                  )}
                </ul>
                
                {/* Additional debug info button */}
                <div className="mt-2">
                  <button 
                    onClick={() => console.log('Debug info:', debugInfo)}
                    className="text-xs text-red-300/60 hover:text-red-300 underline"
                  >
                    Show debug info in console
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className={`grid gap-6 ${showChat ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Voice Controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-semibold text-white mb-4">Voice Controls</h3>
                
                {/* Main Voice Button */}
                <div className="flex justify-center">
                  <button
                    onClick={isCallActive ? endCall : startCall}
                    disabled={callStatus === 'connecting'}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 
                      ${isCallActive 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
                      } 
                      ${callStatus === 'connecting' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl`}
                  >
                    {callStatus === 'connecting' ? (
                      <RefreshCw className="w-12 h-12 text-white animate-spin" />
                    ) : isCallActive ? (
                      <PhoneOff className="w-12 h-12 text-white" />
                    ) : (
                      <Phone className="w-12 h-12 text-white" />
                    )}
                  </button>
                </div>
                
                <p className="text-white/70">
                  {isCallActive ? 'Tap to end the voice call' : 'Tap to start talking with your health assistant'}
                </p>

                {/* Voice Controls */}
                {isCallActive && (
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                  </div>
                )}

                {/* Speaking Indicators */}
                <div className="flex justify-center space-x-8">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                      ${callStatus === 'user-speaking' ? 'bg-blue-500 animate-pulse scale-110' : 'bg-blue-500/20'}`}>
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm text-white/70">You</span>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                      ${callStatus === 'assistant-speaking' ? 'bg-purple-500 animate-pulse scale-110' : 'bg-purple-500/20'}`}>
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm text-white/70">Assistant</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chat Interface */}
          {showChat && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white/5 rounded-xl border border-white/10 flex flex-col h-[600px]">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat & Transcript
                  </h3>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                              : message.role === 'assistant'
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.role === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : message.role === 'assistant' ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <Settings className="w-4 h-4" />
                            )}
                            <span className="text-xs opacity-70">
                              {message.isTranscript ? 'Transcript' : message.role}
                            </span>
                            <span className="text-xs opacity-50">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-white/10">
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border-white/20 text-white placeholder-white/50"
                    />
                    <Button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">How It Works</h3>
              </div>
              <p className="text-white/70 text-sm">
                Start a voice conversation or use the chat to get personalized health guidance. 
                The AI assistant can help with diabetes management, meal planning, exercise tips, 
                and general health questions. All conversations are transcribed for your reference.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Privacy & Safety</h3>
              </div>
              <p className="text-white/70 text-sm">
                Your conversations are processed securely and not stored permanently. 
                This AI provides general guidance and should not replace professional medical advice. 
                Always consult your healthcare provider for medical decisions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Debug Information */}
        {debugInfo.length > 0 && (
          <div className="mt-8">
            <details className="bg-white/5 rounded-lg p-4 border border-white/10">
              <summary className="cursor-pointer text-sm font-semibold mb-2 text-white/80">
                Debug Information ({debugInfo.length} events)
              </summary>
              <div className="space-y-1 text-xs font-mono text-gray-300">
                {debugInfo.map((info, index) => (
                  <div key={index} className="border-l-2 border-gray-600 pl-2">
                    {info}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-6xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. AI Health Assistant - Not medical advice. Consult healthcare providers.
          </p>
        </div>
      </footer>
    </div>
  )
}
