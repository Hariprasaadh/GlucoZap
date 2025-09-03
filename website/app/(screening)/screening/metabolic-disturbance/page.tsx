'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import CameraCapture from '@/components/screening/CameraCapture'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle, 
  Upload, 
  Eye, 
  Zap,
  Target,
  Shield,
  RefreshCw,
  AlertTriangle,
  ImageIcon,
  X,
  Info,
  Clock,
  Search
} from 'lucide-react'
import Link from 'next/link'

// Configuration - match your FastAPI server
const API_BASE_URL = 'http://172.16.45.171:8002' // Changed from 8002 to 8002

export default function DarkCirclesAnalysis() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'instructions' | 'camera' | 'results'>('instructions')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectionResults, setDetectionResults] = useState<any>(null)
  const [simpleResults, setSimpleResults] = useState<any>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addDebugInfo = (info: string) => {
    console.log('[DEBUG]', info)
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${info}`])
  }

  const analysisAreas = [
    {
      name: 'Dark Circles Detection',
      description: 'AI-powered detection of under-eye darkness',
      icon: Eye,
      progress: 25
    },
    {
      name: 'Severity Assessment',
      description: 'Confidence scoring and intensity measurement',
      icon: Target,
      progress: 25
    },
    {
      name: 'Bounding Box Analysis',
      description: 'Precise localization of affected areas',
      icon: Search,
      progress: 25
    },
    {
      name: 'Health Insights',
      description: 'Possible causes and recommendations',
      icon: Shield,
      progress: 25
    }
  ]

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData)
    setCurrentView('instructions')
  }

  const handleStartCapture = () => {
    setCurrentView('camera')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCapturedImage(result)
        setError(null)
      }
      reader.readAsDataURL(file)
    } else {
      setError('Please select a valid image file (JPEG, PNG, WebP)')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setCapturedImage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Convert base64 to blob for file upload
  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64)
    return response.blob()
  }

  // Improved header parsing with better error handling
  const parseDetectionData = (headerValue: string) => {
    try {
      addDebugInfo('Parsing detection header...')
      
      // Clean and normalize the header string
      let cleanedString = headerValue
        .trim()
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null')
      
      // Handle potential encoding issues
      if (cleanedString.startsWith('b"') || cleanedString.startsWith("b'")) {
        cleanedString = cleanedString.slice(2, -1)
      }
      
      const parsed = JSON.parse(cleanedString)
      addDebugInfo('✅ Detection data parsed successfully')
      console.log('Parsed detection data:', parsed)
      return parsed
    } catch (error) {
      addDebugInfo(`❌ Detection parsing failed: ${error}`)
      console.error('Failed to parse detection data:', error, 'Original:', headerValue)
      return null
    }
  }

  // Call analyze endpoint for simple JSON response
  const analyzeSimple = async (imageBlob: Blob) => {
    addDebugInfo('Calling /analyze endpoint...')
    
    const formData = new FormData()
    formData.append('file', imageBlob, 'dark-circles-image.jpg')

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Analysis failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    addDebugInfo('✅ Simple analysis data received')
    console.log('Simple analysis data:', data)
    return data
  }

  // Get processed image with detections using detect endpoint
  const getDetectionResults = async (imageBlob: Blob) => {
    addDebugInfo('Calling /detect endpoint...')
    
    const formData = new FormData()
    formData.append('file', imageBlob, 'dark-circles-image.jpg')

    const response = await fetch(`${API_BASE_URL}/detect`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Detection failed: ${response.status} - ${errorText}`)
    }

    // Get detection data from headers
    const detectionsHeader = response.headers.get('detections')
    let headerData = null
    
    if (detectionsHeader) {
      headerData = parseDetectionData(detectionsHeader)
    } else {
      addDebugInfo('⚠️ No detections header found in response')
    }

    // Get processed image with annotations
    const imageBlob_response = await response.blob()
    const imageUrl = URL.createObjectURL(imageBlob_response)
    addDebugInfo('✅ Detection results received')
    
    return { imageUrl, headerData }
  }

  const handleAnalyze = async () => {
    if (!capturedImage) {
      setError('Please capture or upload an image first')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    setDetectionResults(null)
    setSimpleResults(null)
    setProcessedImage(null)
    setDebugInfo([])
    
    try {
      addDebugInfo('Starting dark circles analysis...')
      
      // Convert base64 to blob
      const blob = await base64ToBlob(capturedImage)
      addDebugInfo(`Image converted to blob (${blob.size} bytes, ${blob.type})`)

      // Call both endpoints with proper error handling
      const analysisPromises = [
        analyzeSimple(blob).catch(err => ({ error: err.message, type: 'simple' })),
        getDetectionResults(blob).catch(err => ({ error: err.message, type: 'detection' }))
      ]

      const [simpleResult, detectionResult] = await Promise.all(analysisPromises)

      // Handle simple analysis results
      if ('error' in simpleResult) {
        addDebugInfo(`❌ Simple analysis failed: ${simpleResult.error}`)
        console.error('Simple analysis error:', simpleResult.error)
      } else {
        setSimpleResults(simpleResult)
        addDebugInfo('✅ Simple analysis complete')
      }

      // Handle detection results
      if ('error' in detectionResult) {
        addDebugInfo(`❌ Detection failed: ${detectionResult.error}`)
        console.error('Detection error:', detectionResult.error)
      } else {
        const { imageUrl, headerData } = detectionResult
        setProcessedImage(imageUrl)
        if (headerData) {
          setDetectionResults(headerData)
          addDebugInfo('✅ Detection analysis complete')
        } else {
          addDebugInfo('⚠️ Detection returned image but no header data')
        }
      }

      // Check if we got at least one successful result
      if ('error' in simpleResult && 'error' in detectionResult) {
        throw new Error('Both analysis endpoints failed. Please check your FastAPI server.')
      }
      
      setCurrentView('results')
      addDebugInfo('Analysis complete, showing results')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addDebugInfo(`❌ Analysis failed: ${errorMessage}`)
      console.error('Dark circles analysis failed:', error)
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityLevel = (hasDetections: boolean, detectionCount: number, avgConfidence?: number) => {
    if (!hasDetections || detectionCount === 0) {
      return { level: 'No Detection', color: 'text-green-300', bg: 'bg-green-500/20', icon: '✅' }
    }
    
    const confidence = avgConfidence || 0
    
    if (detectionCount >= 2 && confidence > 0.8) {
      return { level: 'Severe', color: 'text-red-300', bg: 'bg-red-500/20', icon: '🔴' }
    } else if (detectionCount >= 1 && confidence > 0.6) {
      return { level: 'Moderate', color: 'text-orange-300', bg: 'bg-orange-500/20', icon: '🟡' }
    } else if (detectionCount >= 1) {
      return { level: 'Mild', color: 'text-yellow-300', bg: 'bg-yellow-500/20', icon: '🟨' }
    }
    
    return { level: 'Unknown', color: 'text-gray-300', bg: 'bg-gray-500/20', icon: '❓' }
  }

  const resetAnalysis = () => {
    setCurrentView('instructions')
    setDetectionResults(null)
    setSimpleResults(null)
    setProcessedImage(null)
    setError(null)
    setIsAnalyzing(false)
    setDebugInfo([])
    // Clean up the blob URL to prevent memory leaks
    if (processedImage) {
      URL.revokeObjectURL(processedImage)
    }
  }

  const getHealthRecommendations = (hasDetections: boolean, detectionCount: number) => {
    if (!hasDetections || detectionCount === 0) {
      return [
        "Great! No dark circles detected",
        "Maintain current sleep schedule",
        "Continue healthy skincare routine",
        "Keep staying hydrated"
      ]
    }
    
    if (detectionCount >= 2) {
      return [
        "Prioritize getting 7-9 hours of quality sleep",
        "Use eye creams with caffeine or retinol",
        "Apply cold compresses to reduce puffiness",
        "Stay well-hydrated throughout the day",
        "Manage stress levels with relaxation techniques",
        "Consider consulting a dermatologist if persistent"
      ]
    }
    
    return [
      "Ensure adequate sleep (7-8 hours per night)",
      "Use a gentle eye moisturizer before bed",
      "Apply sunscreen around the eye area daily",
      "Consider getting more rest if feeling fatigued",
      "Stay hydrated and eat antioxidant-rich foods"
    ]
  }

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

      <div className="max-w-6xl mx-auto px-6 py-12">
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
              <p className="text-red-300/70 text-sm mt-2">
                Make sure your FastAPI server is running on {API_BASE_URL}
              </p>
            </div>
          </motion.div>
        )}

        {/* Debug Information Panel */}
        {(isAnalyzing || debugInfo.length > 0) && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-semibold text-white">Analysis Debug Log</h4>
                  <Badge className="text-xs bg-blue-500/20 text-blue-300">
                    API: {API_BASE_URL}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs font-mono text-gray-300 max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="border-l-2 border-gray-600 pl-2">
                      {info}
                    </div>
                  ))}
                  {isAnalyzing && (
                    <div className="border-l-2 border-blue-500 pl-2 text-blue-400">
                      <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'instructions' ? (
          <>
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
                    Dark Circles Detection
                  </h1>
                  <p className="text-white/70 text-lg mt-2">
                    AI-powered analysis of under-eye darkness and fatigue markers
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Important Warning */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-3">Analysis Guidelines</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-300/90">
                      <div>
                        <h4 className="font-medium text-blue-300 mb-2">For Best Results:</h4>
                        <ul className="space-y-1">
                          <li>• Use natural lighting</li>
                          <li>• Look straight at the camera</li>
                          <li>• Remove makeup around eyes</li>
                          <li>• Keep eyes naturally open</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-300 mb-2">What We Detect:</h4>
                        <ul className="space-y-1">
                          <li>• Under-eye discoloration</li>
                          <li>• Severity and extent</li>
                          <li>• Possible fatigue indicators</li>
                          <li>• Recommendations for care</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Image Capture/Upload Section */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-3">
                    <ImageIcon className="w-6 h-6" />
                    Capture or Upload Eye Image
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Take a clear photo of your face or upload an existing image for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Preview */}
                  <div className="bg-black/50 h-80 rounded-lg flex items-center justify-center border border-white/10 relative overflow-hidden">
                    {capturedImage ? (
                      <>
                        <img 
                          src={capturedImage} 
                          alt="Eye image for analysis"
                          className="h-full w-full object-cover rounded-lg"
                        />
                        <Button
                          onClick={handleRemoveImage}
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Eye className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <span className="text-white/50 text-lg">No image captured</span>
                        <p className="text-white/30 text-sm mt-2">Take a photo or upload an image to get started</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleStartCapture}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold h-12"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Take Photo
                    </Button>
                    
                    <Button 
                      onClick={handleUploadClick}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 font-bold h-12"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Image
                    </Button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Image Status */}
                  {capturedImage && (
                    <div className="flex items-center justify-center">
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Image Ready for Analysis
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Analysis Focus Areas */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Analysis Capabilities</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analysisAreas.map((area, index) => {
                  const IconComponent = area.icon
                  return (
                    <motion.div
                      key={area.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-white mb-2">{area.name}</h3>
                          <p className="text-sm text-white/60 mb-3">{area.description}</p>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                              style={{ width: `${area.progress}%` }}
                            ></div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Analysis Button */}
            <motion.div 
              className="flex justify-center items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={handleAnalyze}
                disabled={!capturedImage || isAnalyzing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8 py-4 text-lg disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Eyes...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Detect Dark Circles
                  </>
                )}
              </Button>
            </motion.div>

            {/* Instructions Card */}
            <motion.div
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Image Guidelines</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-white/70">
                    <div>
                      <h4 className="font-medium text-white mb-2">Photo Requirements:</h4>
                      <ul className="space-y-1">
                        <li>• Clear view of both eyes</li>
                        <li>• Good lighting conditions</li>
                        <li>• Face looking straight ahead</li>
                        <li>• No sunglasses or eye makeup</li>
                        <li>• Natural eye position</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-2">Supported Formats:</h4>
                      <ul className="space-y-1">
                        <li>• JPEG (.jpg, .jpeg)</li>
                        <li>• PNG (.png)</li>
                        <li>• WebP (.webp)</li>
                        <li>• Maximum size: 20MB</li>
                        <li>• Minimum resolution: 50x50px</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Your privacy is protected: Images are processed securely and not stored permanently.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : currentView === 'camera' ? (
          <CameraCapture
            type="front-face"
            onCapture={handleCapture}
            onCancel={() => setCurrentView('instructions')}
            instructions="Position your face in the center with both eyes clearly visible"
          />
        ) : currentView === 'results' ? (
          /* Results View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Dark Circles Detection Results</h3>
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  New Analysis
                </Button>
              </div>
              
              {/* Show processed image with detections */}
              {processedImage && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Detection Results
                  </h4>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={processedImage}
                      alt="Dark circles detection analysis"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Simple Analysis Results */}
              {simpleResults && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Quick Assessment
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {getSeverityLevel(simpleResults.has_dark_circles, simpleResults.detection_count).icon}
                        </span>
                        <div>
                          <h5 className="text-white font-bold">
                            {simpleResults.has_dark_circles ? 'Dark Circles Detected' : 'No Dark Circles Detected'}
                          </h5>
                          <p className={`text-sm ${getSeverityLevel(simpleResults.has_dark_circles, simpleResults.detection_count).color}`}>
                            {getSeverityLevel(simpleResults.has_dark_circles, simpleResults.detection_count).level}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {simpleResults.detection_count}
                      </div>
                      <div className="text-sm text-white/60">
                        Detection{simpleResults.detection_count !== 1 ? 's' : ''} Found
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Recommendations */}
              {(simpleResults || detectionResults) && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Health & Wellness Recommendations:
                  </h4>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <ul className="space-y-3">
                      {getHealthRecommendations(
                        simpleResults?.has_dark_circles || detectionResults?.has_dark_circles || false,
                        simpleResults?.detection_count || detectionResults?.detection_count || 0
                      ).map((rec: string, index: number) => (
                        <li key={index} className="text-white/80 text-sm flex items-start gap-3">
                          <span className="text-cyan-400 mt-1 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Detailed Detection Results */}
              {detectionResults && detectionResults.detections && detectionResults.detections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Detailed Detection Analysis
                  </h4>
                  
                  {/* Detection Summary */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{detectionResults.detection_count}</div>
                        <div className="text-sm text-white/60">Total Detections</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{detectionResults.confidence_threshold}</div>
                        <div className="text-sm text-white/60">Confidence Threshold</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{detectionResults.model_type}</div>
                        <div className="text-sm text-white/60">Model Used</div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Detections */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white/80">Individual Detections:</h5>
                    {detectionResults.detections.map((detection: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h6 className="text-white font-medium">Detection #{detection.detection_id}</h6>
                            <p className="text-white/60 text-sm">Class: {detection.class}</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {(detection.confidence * 100).toFixed(1)}% confidence
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/50">
                          <div>X1: {detection.bounding_box.x1}</div>
                          <div>Y1: {detection.bounding_box.y1}</div>
                          <div>X2: {detection.bounding_box.x2}</div>
                          <div>Y2: {detection.bounding_box.y2}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show appropriate message if no results */}
              {!simpleResults && !detectionResults && !processedImage && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
                  <p className="text-white/70">No analysis results available</p>
                  <p className="text-white/50 text-sm mt-2">
                    Both analysis endpoints failed. Please check the debug log above for details.
                  </p>
                </div>
              )}
            </div>
            
            {/* Information Card */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">About Dark Circles Detection</h3>
                </div>
                <div className="space-y-3 text-sm text-white/70">
                  <p>
                    This AI system uses YOLOv11 computer vision to detect dark circles around the eyes, 
                    which can be indicators of fatigue, stress, dehydration, or lack of sleep. 
                    The analysis provides both simple detection results and detailed bounding box information.
                  </p>
                  
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      <strong>Note:</strong> This analysis is for wellness monitoring and should not be used for medical diagnosis. 
                      Consult healthcare professionals for persistent concerns about fatigue or eye health.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-6xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Dark circles detection for wellness monitoring purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}