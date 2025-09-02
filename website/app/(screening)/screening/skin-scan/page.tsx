'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Target,
  Shield,
  X,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function SkinScanPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [detections, setDetections] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // **FIX 1: Auto-start video when stream changes**
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err)
        setError('Failed to start video playback')
      })
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // **FIX 2: Improved camera start function**
  const startCamera = async () => {
    try {
      setError(null)
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false // **FIX: Don't request audio for skin scanning**
      })
      
      setStream(mediaStream)
      setShowCamera(true)
      
    } catch (err) {
      console.error('Error accessing camera:', err)
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Unable to access camera. Please check permissions or use file upload instead.')
      }
    }
  }

  // Stop webcam
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        stopCamera()
        setStep(2)
      }
    }
  }, [stream])

  // Convert base64 to blob for file upload
  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64)
    return response.blob()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string)
      setStep(2)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!capturedImage) return
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Convert base64 to blob
      const blob = await base64ToBlob(capturedImage)
      
      // Create form data
      const formData = new FormData()
      formData.append('file', blob, 'skin-image.jpg')

      // Call FastAPI backend
      const response = await fetch('http://172.16.45.171:8000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get detections from headers
      const detectionsHeader = response.headers.get('detections')
      if (detectionsHeader) {
        try {
          const parsedDetections = JSON.parse(detectionsHeader.replace(/'/g, '"'))
          setDetections(parsedDetections)
        } catch (parseError) {
          console.error('Failed to parse detections:', parseError)
          setDetections([])
        }
      }

      // Get the processed image with annotations
      const imageBlob = await response.blob()
      const processedImageUrl = URL.createObjectURL(imageBlob)
      setProcessedImage(processedImageUrl)
      
      setStep(3)
    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze image')
    } finally {
      setIsProcessing(false)
    }
  }

  const getRiskLevel = () => {
    if (detections.length === 0) return { level: 'No Detection', color: 'text-green-300', bg: 'bg-green-500/20' }
    
    const highConfDetections = detections.filter(d => d.confidence > 0.7)
    if (highConfDetections.length > 0) {
      return { level: 'High Risk', color: 'text-red-300', bg: 'bg-red-500/20' }
    }
    
    const medConfDetections = detections.filter(d => d.confidence > 0.5)
    if (medConfDetections.length > 0) {
      return { level: 'Moderate Risk', color: 'text-yellow-300', bg: 'bg-yellow-500/20' }
    }
    
    return { level: 'Low Risk', color: 'text-green-300', bg: 'bg-green-500/20' }
  }

  const resetToStep1 = () => {
    setStep(1)
    setCapturedImage(null)
    setProcessedImage(null)
    setDetections([])
    setError(null)
    setIsProcessing(false)
    stopCamera()
  }

  const progressValue = (step / 3) * 100

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
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                Skin Analysis
              </h1>
              <p className="text-white/70 text-lg mt-2">
                AI-powered detection of Acanthosis Nigricans
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold">Analysis Progress</span>
              </div>
              <span className="text-sm text-white/60 font-mono">Step {step} of 3</span>
            </div>
            <Progress value={progressValue} className="h-3 bg-white/10 rounded-full">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"></div>
            </Progress>
            <div className="flex justify-between text-xs text-white/50 mt-2">
              <span>Capture</span>
              <span>Analyze</span>
              <span>Results</span>
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
                <span className="font-medium">Error: {error}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1: Capture Options */}
        {step === 1 && !showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Camera Option */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Use Camera</h3>
                  <p className="text-sm text-white/70 mb-4">Take a photo directly with your device camera</p>
                </div>
                <Button
                  onClick={startCamera}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold"
                >
                  Open Camera
                </Button>
              </div>
            </div>

            {/* File Upload Option */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Upload Photo</h3>
                  <p className="text-sm text-white/70 mb-4">Choose an existing photo from your device</p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold"
                >
                  Select Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* **FIX 3: Camera Interface with proper video element** */}
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="relative bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Camera</h3>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-black/90 text-white hover:bg-white/10 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
              
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-lg"></div>
                </div>
                
                {stream && !videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white">Starting camera...</div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={capturePhoto}
                  disabled={!stream}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Capture Photo
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Image Preview & Analysis */}
        {step === 2 && capturedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Image Preview</h3>
                <Button
                  onClick={resetToStep1}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </div>
              
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                <img
                  src={capturedImage}
                  alt="Captured skin image"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
                <Button
                  onClick={resetToStep1}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  New Scan
                </Button>
              </div>
              
              {/* Risk Level */}
              <div className="mb-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${getRiskLevel().bg}`}>
                  <Target className="w-4 h-4 mr-2" />
                  <span className={`font-semibold ${getRiskLevel().color}`}>
                    {getRiskLevel().level}
                  </span>
                </div>
              </div>
              
              {/* Processed Image */}
              {processedImage && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                  <img
                    src={processedImage}
                    alt="Analyzed skin image with annotations"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              {/* Detections */}
              {detections.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/80">Detections:</h4>
                  {detections.map((detection, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Detection {index + 1}</span>
                        <Badge variant="secondary" className="bg-white/10 text-white">
                          {(detection.confidence * 100).toFixed(1)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {detections.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                  <p className="text-white/70">No signs of Acanthosis Nigricans detected</p>
                </div>
              )}
            </div>
            
            {/* Information Card */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">About This Analysis</h3>
                </div>
                <p className="text-white/70 text-sm">
                  This AI model detects Acanthosis Nigricans, a skin condition that can be associated with insulin resistance and diabetes risk. 
                  The analysis provides preliminary screening results and should not replace professional medical diagnosis.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-4xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Not medical advice. Consult healthcare providers.
          </p>
        </div>
      </footer>
    </div>
  )
}
