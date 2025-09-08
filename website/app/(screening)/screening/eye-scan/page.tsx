'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Camera, 
  Upload, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  RefreshCw,
  Download,
  Info,
  Heart,
  Shield,
  Zap
} from 'lucide-react'

// API Configuration - Change this to match your FastAPI server
const RETINOPATHY_API_BASE = process.env.NEXT_PUBLIC_EYE_SCAN_API_URL

interface RetinopathyResult {
  predicted_class: string
  confidence: number
  class_probabilities: Record<string, number>
  severity_level: string
  recommendations: string[]
}

interface AnalysisResponse {
  status: string
  timestamp: string
  filename: string
  analysis: {
    prediction: string
    confidence: number
    severity_level: string
    class_probabilities: Record<string, number>
  }
  recommendations: string[]
  image_info: {
    original_size: string
    processed_size: string
    format: string
  }
  model_info: {
    model_type: string
    device: string
    classes: string[]
  }
}

// Updated to match FastAPI class names exactly
const CLASS_INFO = {
  "No_DR": {
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    icon: CheckCircle,
    severity: "Normal",
    description: "No diabetic retinopathy detected"
  },
  "Mild": {
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", 
    icon: Info,
    severity: "Mild",
    description: "Mild diabetic retinopathy detected"
  },
  "Moderate": {
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    icon: AlertTriangle,
    severity: "Moderate", 
    description: "Moderate diabetic retinopathy detected"
  },
  "Severe": {
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: AlertCircle,
    severity: "Severe",
    description: "Severe diabetic retinopathy detected"
  },
  "Proliferate_DR": {
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: AlertCircle,
    severity: "Very Severe",
    description: "Proliferative diabetic retinopathy detected"
  }
}

export default function EyeScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentStep, setCurrentStep] = useState<'instruction' | 'capture' | 'upload' | 'analyzing' | 'results'>('instruction')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  useEffect(() => {
    checkApiHealth()
  }, [])

  useEffect(() => {
    if (currentStep === 'capture') {
      initializeCamera()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [currentStep, facingMode])

  const checkApiHealth = async () => {
    setApiStatus('checking')
    try {
      const response = await fetch(`${RETINOPATHY_API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiStatus(data.model_loaded ? 'online' : 'offline')
      } else {
        setApiStatus('offline')
      }
    } catch (error) {
      console.error('API health check failed:', error)
      setApiStatus('offline')
    }
  }

  const initializeCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Unable to access camera. Please ensure camera permissions are granted.')
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        setCurrentStep('analyzing')
        analyzeImage(imageData)
        
        // Stop camera stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          setStream(null)
        }
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size (matching FastAPI validation)
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, etc.)')
        return
      }
      
      if (file.size > 20 * 1024 * 1024) { // 20MB limit from FastAPI
        setError('File size too large. Please select an image under 20MB.')
        return
      }
      
      setUploadedFile(file)
      setCurrentStep('analyzing')
      analyzeImageFile(file)
    }
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // Convert base64 to blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      
      // Create form data with proper file naming
      const formData = new FormData()
      formData.append('file', blob, 'captured-retinal-image.jpg')
      
      // Send to FastAPI /analyze endpoint
      const apiResponse = await fetch(`${RETINOPATHY_API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      })
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.text()
        throw new Error(`Analysis failed (${apiResponse.status}): ${errorData}`)
      }
      
      const result: AnalysisResponse = await apiResponse.json()
      setAnalysisResult(result)
      setCurrentStep('results')
      
    } catch (error) {
      console.error('Analysis error:', error)
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setCurrentStep('capture')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeImageFile = async (file: File) => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Send to FastAPI /analyze endpoint
      const apiResponse = await fetch(`${RETINOPATHY_API_BASE}/analyze`, {
        method: 'POST', 
        body: formData,
      })
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.text()
        throw new Error(`Analysis failed (${apiResponse.status}): ${errorData}`)
      }
      
      const result: AnalysisResponse = await apiResponse.json()
      setAnalysisResult(result)
      setCurrentStep('results')
      
    } catch (error) {
      console.error('Analysis error:', error)
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setCurrentStep('upload')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setUploadedFile(null)
    setAnalysisResult(null)
    setError(null)
    setCurrentStep('capture')
  }

  const startNewScan = () => {
    setCapturedImage(null)
    setUploadedFile(null)
    setAnalysisResult(null)
    setError(null)
    setCurrentStep('instruction')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'normal': return 'text-green-400'
      case 'mild': return 'text-yellow-400'
      case 'moderate': return 'text-orange-400'
      case 'severe': return 'text-red-400'
      case 'very severe': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  // Helper function to format class names for display
  const formatClassName = (className: string) => {
    return className.replace('_', ' ').replace('DR', 'Diabetic Retinopathy')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/screening" className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Screening</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Badge 
                className={`${
                  apiStatus === 'online' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                  apiStatus === 'offline' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                }`}
              >
                {apiStatus === 'checking' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {apiStatus === 'online' && <CheckCircle className="w-3 h-3 mr-1" />}
                {apiStatus === 'offline' && <AlertCircle className="w-3 h-3 mr-1" />}
                API {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Online' : 'Offline'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkApiHealth}
                disabled={apiStatus === 'checking'}
              >
                <RefreshCw className={`w-4 h-4 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Diabetic Retinopathy Screening
            </h1>
          </motion.div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Advanced AI-powered analysis to detect and classify diabetic retinopathy from retinal images
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )} 

        {/* API Offline Warning */}
        {apiStatus === 'offline' && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-300">
              The analysis API is currently offline. Please check your FastAPI server is running on {RETINOPATHY_API_BASE}
            </AlertDescription>
          </Alert>
        )}

        {/* Instruction Step */}
        {currentStep === 'instruction' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>Before You Begin</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-400">✓ Best Practices</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Use good lighting</li>
                      <li>• Keep the camera steady</li>
                      <li>• Ensure the eye fills most of the frame</li>
                      <li>• Focus on the retina/back of the eye</li>
                      <li>• Use high-quality images when uploading</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-400">✗ Avoid</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Blurry or dark images</li>
                      <li>• Images with reflections</li>
                      <li>• Partial eye views</li>
                      <li>• Low resolution images</li>
                      <li>• Images with obstructions</li>
                    </ul>
                  </div>
                </div>
                
                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-blue-300">
                    This is a screening tool and should not replace professional medical diagnosis. 
                    Please consult with a healthcare professional for proper evaluation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800 hover:border-blue-500/50 transition-colors cursor-pointer"
                    onClick={() => apiStatus === 'online' && setCurrentStep('capture')}>
                <CardContent className="p-6 text-center">
                  <Camera className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Take Photo</h3>
                  <p className="text-gray-400 mb-4">Use your device camera to capture a retinal image</p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={apiStatus !== 'online'}
                  >
                    Start Camera
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer"
                    onClick={() => apiStatus === 'online' && setCurrentStep('upload')}>
                <CardContent className="p-6 text-center">
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
                  <p className="text-gray-400 mb-4">Upload an existing retinal image from your device</p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={apiStatus !== 'online'}
                  >
                    Choose File
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Camera Capture Step */}
        {currentStep === 'capture' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-blue-400" />
                  <span>Capture Retinal Image</span>
                </CardTitle>
                <CardDescription>
                  Position the eye in the center of the frame and capture a clear image
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-gray-800"
                    style={{ maxHeight: '400px' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Flip Camera
                    </Button>
                    <Button
                      onClick={captureImage}
                      className="bg-blue-600 hover:bg-blue-700 px-8"
                      disabled={isAnalyzing}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('instruction')}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                    Upload Instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  <span>Upload Retinal Image</span>
                </CardTitle>
                <CardDescription>
                  Select a high-quality retinal image from your device (Max 20MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Click to select an image or drag and drop</p>
                  <p className="text-sm text-gray-500">Supports JPEG, PNG, WEBP (max 20MB)</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('instruction')}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep('capture')}>
                    Use Camera Instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Analyzing Step */}
        {currentStep === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Loader2 className="w-16 h-16 text-blue-400 mx-auto animate-spin" />
                  <h3 className="text-2xl font-semibold">Analyzing Retinal Image...</h3>
                  <p className="text-gray-400">
                    Our AI is processing your image to detect signs of diabetic retinopathy
                  </p>
                  <Progress value={75} className="w-full max-w-md mx-auto" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results Step */}
        {currentStep === 'results' && analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  <span>Analysis Complete</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Result */}
                <div className="text-center p-6 rounded-lg bg-gray-800/50">
                  <div className="space-y-4">
                    <Badge 
                      className={`${CLASS_INFO[analysisResult.analysis.prediction as keyof typeof CLASS_INFO]?.color || 'bg-gray-500/20 text-gray-300'} text-lg px-4 py-2`}
                    >
                      {formatClassName(analysisResult.analysis.prediction)}
                    </Badge>
                    <div>
                      <p className="text-2xl font-bold mb-2">
                        Confidence: {(analysisResult.analysis.confidence * 100).toFixed(1)}%
                      </p>
                      <p className={`text-lg font-semibold ${getSeverityColor(analysisResult.analysis.severity_level)}`}>
                        Severity: {analysisResult.analysis.severity_level}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Class Probabilities */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Detailed Analysis</h4>
                  <div className="space-y-2">
                    {Object.entries(analysisResult.analysis.class_probabilities).map(([className, probability]) => (
                      <div key={className} className="flex items-center justify-between">
                        <span className="text-gray-300">{formatClassName(className)}</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={probability * 100} 
                            className="w-32"
                          />
                          <span className="text-sm text-gray-400 w-12">
                            {(probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span>Health Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-red-500/50 bg-red-500/10 mb-4">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-red-300">
                    <strong>Medical Disclaimer:</strong> This is an AI screening tool, not a medical diagnosis. 
                    Always consult qualified healthcare professionals for proper evaluation.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-300">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Image Info */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>Analysis Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Analyzed: <span className="text-white">{new Date(analysisResult.timestamp).toLocaleString()}</span></p>
                    <p className="text-gray-400">Image Size: <span className="text-white">{analysisResult.image_info.original_size}</span></p>
                    <p className="text-gray-400">Format: <span className="text-white">{analysisResult.image_info.format}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-400">Model: <span className="text-white">{analysisResult.model_info.model_type}</span></p>
                    <p className="text-gray-400">Device: <span className="text-white">{analysisResult.model_info.device}</span></p>
                    <p className="text-gray-400">Classes: <span className="text-white">{analysisResult.model_info.classes.length}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={startNewScan} className="bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                New Scan
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Save Report
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
