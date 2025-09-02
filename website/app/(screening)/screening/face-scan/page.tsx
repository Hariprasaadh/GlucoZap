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
  User, 
  Zap,
  Target,
  Shield,
  RefreshCw,
  AlertTriangle,
  ImageIcon,
  X,
  Info,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function FacialAnalysis() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'instructions' | 'camera' | 'results'>('instructions')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bmiResults, setBmiResults] = useState<any>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analysisAreas = [
    {
      name: 'Facial Structure',
      description: 'Bone structure and facial proportions',
      icon: Target,
      progress: 25
    },
    {
      name: 'Skin Analysis',
      description: 'Texture and complexion assessment',
      icon: User,
      progress: 25
    },
    {
      name: 'Feature Detection',
      description: 'Facial landmarks and measurements',
      icon: Camera,
      progress: 25
    },
    {
      name: 'BMI Estimation',
      description: 'Weight category classification',
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
      }
      reader.readAsDataURL(file)
    } else {
      setError('Please select a valid image file')
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

  // Enhanced function to parse BMI prediction header with better error handling
  const parseBMIPrediction = (headerValue: string) => {
    try {
      console.log('Raw BMI header:', headerValue)
      
      // Clean up the header string to make it valid JSON
      let jsonString = headerValue
        .replace(/'/g, '"')           // Replace single quotes with double quotes
        .replace(/True/g, 'true')     // Replace Python True with JSON true
        .replace(/False/g, 'false')   // Replace Python False with JSON false
        .replace(/None/g, 'null')     // Replace Python None with JSON null
      
      console.log('Cleaned JSON string:', jsonString)
      
      const parsed = JSON.parse(jsonString)
      console.log('Parsed BMI data:', parsed)
      
      return parsed
    } catch (error) {
      console.error('Failed to parse BMI prediction header:', error)
      console.error('Original header value:', headerValue)
      return null
    }
  }

  const handleAnalyze = async () => {
    if (!capturedImage) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // Convert base64 to blob
      const blob = await base64ToBlob(capturedImage)
      
      // Create form data
      const formData = new FormData()
      formData.append('file', blob, 'face-image.jpg')

      // Call BMI FastAPI backend
      const response = await fetch('http://172.16.45.171:8000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      // Log all response headers for debugging
      console.log('All response headers:')
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`)
      })

      // Get BMI prediction from headers
      const bmiPredictionHeader = response.headers.get('bmi-prediction')
      console.log('BMI prediction header found:', bmiPredictionHeader)
      
      if (bmiPredictionHeader) {
        const parsedBMI = parseBMIPrediction(bmiPredictionHeader)
        if (parsedBMI) {
          console.log('Successfully parsed BMI results:', parsedBMI)
          setBmiResults(parsedBMI)
        } else {
          console.warn('Failed to parse BMI prediction from headers')
          setError('Failed to parse analysis results')
          setBmiResults(null)
        }
      } else {
        console.warn('No bmi-prediction header found in response')
        setError('No analysis data received from server')
        setBmiResults(null)
      }

      // Get the processed image with face mesh
      const imageBlob = await response.blob()
      const processedImageUrl = URL.createObjectURL(imageBlob)
      setProcessedImage(processedImageUrl)
      
      setCurrentView('results')
    } catch (error) {
      console.error('BMI Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getBmiRiskLevel = () => {
    if (!bmiResults?.bmi_prediction?.bmi_category) {
      return { level: 'No Data', color: 'text-gray-300', bg: 'bg-gray-500/20', icon: '❓' }
    }
    
    const category = bmiResults.bmi_prediction.bmi_category.toLowerCase()
    
    if (category.includes('severe')) {
      return { level: 'High Risk', color: 'text-red-300', bg: 'bg-red-500/20', icon: '🚨' }
    } else if (category.includes('moderate-obesity')) {
      return { level: 'High Risk', color: 'text-orange-300', bg: 'bg-orange-500/20', icon: '⚠️' }
    } else if (category.includes('mild-obesity')) {
      return { level: 'Moderate Risk', color: 'text-yellow-300', bg: 'bg-yellow-500/20', icon: '⚡' }
    } else if (category.includes('overweight')) {
      return { level: 'Mild Risk', color: 'text-yellow-300', bg: 'bg-yellow-500/20', icon: '📊' }
    } else if (category.includes('normal')) {
      return { level: 'Normal Weight', color: 'text-green-300', bg: 'bg-green-500/20', icon: '✅' }
    }
    
    return { level: 'Unknown', color: 'text-gray-300', bg: 'bg-gray-500/20', icon: '❓' }
  }

  const resetAnalysis = () => {
    setCurrentView('instructions')
    setBmiResults(null)
    setProcessedImage(null)
    setError(null)
    setIsAnalyzing(false)
    // Clean up the blob URL to prevent memory leaks
    if (processedImage) {
      URL.revokeObjectURL(processedImage)
    }
  }

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString()
    } catch {
      return 'Unknown time'
    }
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
            </div>
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
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white">
                    Facial Analysis
                  </h1>
                  <p className="text-white/70 text-lg mt-2">
                    AI-powered BMI estimation using facial features
                  </p>
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
                    Capture or Upload Image
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Take a photo with your camera or upload an existing image for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Preview */}
                  <div className="bg-black/50 h-80 rounded-lg flex items-center justify-center border border-white/10 relative overflow-hidden">
                    {capturedImage ? (
                      <>
                        <img 
                          src={capturedImage} 
                          alt="Captured face"
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
                        <Camera className="w-16 h-16 text-white/30 mx-auto mb-4" />
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
                <h2 className="text-2xl font-bold text-white">Analysis Focus Areas</h2>
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

            {/* Action Button */}
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
                    Analyzing Features...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Analyze Facial Features
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
                        <li>• Good lighting conditions</li>
                        <li>• Clear, unobstructed face view</li>
                        <li>• Look straight at the camera</li>
                        <li>• Neutral facial expression</li>
                        <li>• Remove glasses if possible</li>
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
                      Your privacy is protected: Images are processed locally and not stored permanently.
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
            instructions="Position your face in the center of the frame and look straight at the camera"
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
                <h3 className="text-lg font-semibold text-white">BMI Analysis Results</h3>
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  New Analysis
                </Button>
              </div>
              
              {/* Analysis Summary Card */}
              {bmiResults && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getBmiRiskLevel().icon}</span>
                      <div>
                        <h4 className="text-lg font-bold text-white">{bmiResults.bmi_prediction.bmi_category}</h4>
                        <p className={`text-sm ${getBmiRiskLevel().color}`}>{getBmiRiskLevel().level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {(bmiResults.bmi_prediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/60">Confidence</div>
                    </div>
                  </div>
                  
                  {/* Analysis Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>File: {bmiResults.filename}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Size: {bmiResults.image_info?.original_size}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Status: {bmiResults.status}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Processed Image with Face Mesh */}
              {processedImage && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Facial Landmark Analysis
                  </h4>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={processedImage}
                      alt="Face analysis with mesh overlay"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Health Status */}
              {bmiResults?.bmi_prediction?.health_status && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Health Assessment:</h4>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-white/90">{bmiResults.bmi_prediction.health_status}</p>
                  </div>
                </div>
              )}

              {/* Probabilities Distribution */}
              {bmiResults?.probabilities && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Category Probabilities:</h4>
                  <div className="space-y-3">
                    {Object.entries(bmiResults.probabilities)
                      .sort(([,a], [,b]) => (b as number) - (a as number)) // Sort by probability descending
                      .map(([category, probability]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-white/70 text-sm flex-1">{category.replace('-', ' ')}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-full bg-white/10 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-1000 ${
                                category === bmiResults.bmi_prediction.bmi_category 
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                                  : 'bg-white/30'
                              }`}
                              style={{ width: `${(probability as number) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-white text-sm font-mono w-16 text-right">
                          {((probability as number) * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Recommendations */}
              {bmiResults?.analysis?.recommendations && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Health Recommendations:
                  </h4>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <ul className="space-y-3">
                      {bmiResults.analysis.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-white/80 text-sm flex items-start gap-3">
                          <span className="text-purple-400 mt-1 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Detection Metrics */}
              {bmiResults?.face_mesh && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Detection Metrics:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-white/60 text-xs mb-1">Face Detection</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        {bmiResults.face_mesh.face_detected ? (
                          <>
                            <span className="text-green-400">●</span>
                            <span>Detected</span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-400">●</span>
                            <span>Not Detected</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-white/60 text-xs mb-1">Landmarks</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        {bmiResults.face_mesh.landmarks_drawn ? (
                          <>
                            <span className="text-green-400">●</span>
                            <span>Mapped</span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-400">●</span>
                            <span>Not Mapped</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Details */}
              {bmiResults?.analysis && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Analysis Details:</h4>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Most Likely Category:</span>
                        <p className="text-white font-medium">{bmiResults.analysis.most_likely}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Confidence Level:</span>
                        <p className="text-white font-medium">{bmiResults.analysis.confidence_level}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!bmiResults && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
                  <p className="text-white/70">No BMI analysis results available</p>
                  <p className="text-white/50 text-sm mt-2">
                    The analysis may have failed or the response format was unexpected.
                  </p>
                </div>
              )}
            </div>
            
            {/* Information Card */}
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">About This Analysis</h3>
                </div>
                <div className="space-y-3 text-sm text-white/70">
                  <p>
                    This AI model analyzes facial features to estimate BMI category using computer vision and facial landmarks. 
                    The face mesh overlay shows detected facial landmarks used in the analysis.
                  </p>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      <strong>Disclaimer:</strong> Results are preliminary estimates and should not replace professional medical assessment or BMI measurements.
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
            © 2025 GlucoZap. Facial analysis for health screening purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}
  