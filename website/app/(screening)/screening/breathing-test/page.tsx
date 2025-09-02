'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Mic, 
  CheckCircle, 
  Wind, 
  Zap,
  Shield,
  RefreshCw,
  AlertTriangle,
  Heart,
  Activity,
  TrendingUp,
  Volume2,
  Pause,
  Play
} from 'lucide-react'
import Link from 'next/link'

export default function BreathingTest() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const analysisMetrics = [
    {
      name: 'Respiratory Rate',
      description: 'Breaths per minute analysis',
      icon: Wind,
      value: '16 BPM',
      status: 'normal'
    },
    {
      name: 'Heart Rate Variability',
      description: 'Stress response indicators',
      icon: Heart,
      value: 'Moderate',
      status: 'moderate'
    },
    {
      name: 'Breathing Pattern',
      description: 'Rhythm consistency',
      icon: Activity,
      value: 'Regular',
      status: 'good'
    }
  ]

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 29) { // Auto-stop at 30 seconds
            stopRecording()
            return 30
          }
          return prev + 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        console.log('Audio recording complete', audioBlob)
        
        // Start analysis
        setIsAnalyzing(true)
        setTimeout(() => {
          setIsAnalyzing(false)
          setAnalysisComplete(true)
        }, 3000)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Unable to access microphone. Please check permissions and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const resetTest = () => {
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    setRecordingTime(0)
    setError(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => (recordingTime / 30) * 100

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/screening" className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Assessment</span>
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Wind className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                Breathing Pattern Analysis
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Cardio-metabolic stress assessment through respiratory patterns
              </p>
            </div>
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
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Recording Interface */}
        <motion.div 
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl">Breathing Assessment</CardTitle>
              <CardDescription className="text-white/60 text-lg">
                30-second respiratory pattern recording
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 min-h-[400px]">
              {/* Recording States */}
              {analysisComplete ? (
                <motion.div 
                  className="flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-400 mb-4">Analysis Complete!</h3>
                  <p className="text-white/70 mb-6">Your breathing patterns have been analyzed</p>
                  <Button 
                    onClick={resetTest}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Again
                  </Button>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div 
                  className="flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                    <RefreshCw className="w-16 h-16 text-white animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">Analyzing...</h3>
                  <p className="text-white/70">Processing respiratory data</p>
                </motion.div>
              ) : isRecording ? (
                <motion.div 
                  className="flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="relative mb-6">
                    <div className="w-40 h-40 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                      <div className="text-center">
                        <Volume2 className="w-12 h-12 text-white mx-auto mb-2" />
                        <span className="text-white text-2xl font-mono font-bold">
                          {formatTime(recordingTime)}
                        </span>
                      </div>
                    </div>
                    {/* Animated rings */}
                    <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping"></div>
                    <div className="absolute inset-4 rounded-full border-2 border-red-400/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full max-w-xs mb-6">
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress()}%` }}
                      ></div>
                    </div>
                    <p className="text-red-400 mt-2 font-semibold">Recording in progress...</p>
                  </div>
                  
                  <Button 
                    onClick={stopRecording} 
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold px-8"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    className="w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-transform cursor-pointer"
                    onClick={startRecording}
                  >
                    <Mic className="w-20 h-20 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Ready to Begin</h3>
                  <p className="text-white/70 mb-6">Click the microphone to start recording</p>
                  <Button 
                    onClick={startRecording}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Analysis Results */}
        {analysisComplete && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {analysisMetrics.map((metric, index) => {
                const IconComponent = metric.icon
                const getStatusColor = (status: string) => {
                  switch(status) {
                    case 'good': return 'from-green-500 to-emerald-500'
                    case 'moderate': return 'from-yellow-500 to-orange-500'
                    case 'normal': return 'from-blue-500 to-cyan-500'
                    default: return 'from-purple-500 to-pink-500'
                  }
                }
                
                return (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getStatusColor(metric.status)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">{metric.name}</h3>
                        <p className="text-sm text-white/60 mb-3">{metric.description}</p>
                        <div className="text-xl font-bold text-white mb-2">{metric.value}</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            metric.status === 'good' ? 'border-green-500/30 text-green-300' :
                            metric.status === 'moderate' ? 'border-yellow-500/30 text-yellow-300' :
                            'border-blue-500/30 text-blue-300'
                          }`}
                        >
                          {metric.status.toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Recording Instructions</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-white/70">
                <div>
                  <h4 className="font-medium text-white mb-3">📱 Setup Requirements:</h4>
                  <ul className="space-y-1">
                    <li>• Find a quiet environment</li>
                    <li>• Hold device 12 inches from mouth</li>
                    <li>• Sit comfortably and relaxed</li>
                    <li>• Ensure microphone permissions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-3">🫁 Breathing Guidelines:</h4>
                  <ul className="space-y-1">
                    <li>• Breathe naturally and normally</li>
                    <li>• Don't force deep or shallow breaths</li>
                    <li>• Stay relaxed during recording</li>
                    <li>• Recording lasts exactly 30 seconds</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-4xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Respiratory analysis for metabolic health assessment.
          </p>
        </div>
      </footer>
    </div>
  )
}
