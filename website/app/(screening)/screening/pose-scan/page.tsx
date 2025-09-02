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
  Users, 
  Scan, 
  Zap,
  Target,
  Shield,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Activity,
  TrendingUp,
  Scale
} from 'lucide-react'
import Link from 'next/link'

export default function BodyScan() {
  const [capturedImages, setCapturedImages] = useState<{ [key: string]: string }>({})
  const [currentView, setCurrentView] = useState<'instructions' | 'camera'>('instructions')
  const [captureType, setCaptureType] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const captureViews = [
    { 
      id: 'front', 
      label: 'Front View', 
      description: 'Stand straight facing the camera with arms at sides',
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'side', 
      label: 'Side Profile', 
      description: 'Turn 90° with your side to the camera',
      icon: Scan,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'back', 
      label: 'Back View', 
      description: 'Turn around with your back to the camera',
      icon: Target,
      color: 'from-green-500 to-emerald-500'
    },
  ]

  const analysisAreas = [
    {
      name: 'Waist-Hip Ratio',
      description: 'Central obesity assessment',
      icon: BarChart3,
      progress: 33,
      risk: 'moderate'
    },
    {
      name: 'Body Fat Distribution',
      description: 'Visceral fat pattern analysis',
      icon: TrendingUp,
      progress: 33,
      risk: 'high'
    },
    {
      name: 'Posture Analysis',
      description: 'Metabolic health indicators',
      icon: Activity,
      progress: 34,
      risk: 'low'
    }
  ]

  const handleCapture = (imageData: string, type: string) => {
    setCapturedImages(prev => ({ ...prev, [type]: imageData }))
    setCurrentView('instructions')
  }

  const handleStartCapture = (type: string) => {
    setCaptureType(type)
    setCurrentView('camera')
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsAnalyzing(false)
    console.log('Body analysis complete', { images: capturedImages })
  }

  const allCaptured = captureViews.every(view => capturedImages[view.id])
  const captureProgress = (Object.keys(capturedImages).length / captureViews.length) * 100

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
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white">
                    Body Composition Analysis
                  </h1>
                  <p className="text-white/70 text-lg mt-2">
                    AI-powered assessment of diabetes risk factors
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold">Capture Progress</span>
                  </div>
                  <span className="text-sm text-white/60 font-mono">
                    {Object.keys(capturedImages).length} of {captureViews.length} captured
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${captureProgress}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>

            {/* Privacy Notice */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-3">Privacy & Comfort Guidelines</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-300/90">
                      <div>
                        <h4 className="font-medium text-blue-300 mb-2">For Best Results:</h4>
                        <ul className="space-y-1">
                          <li>• Wear form-fitting clothes</li>
                          <li>• Stand in good lighting</li>
                          <li>• Maintain natural posture</li>
                          <li>• Remove bulky items/jackets</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-300 mb-2">Privacy Protection:</h4>
                        <ul className="space-y-1">
                          <li>• Images processed locally only</li>
                          <li>• No data stored permanently</li>
                          <li>• HIPAA compliant analysis</li>
                          <li>• Your privacy is our priority</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Capture Views Grid */}
            <motion.div 
              className="grid md:grid-cols-3 gap-6 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {captureViews.map((view, index) => {
                const IconComponent = view.icon
                const isCompleted = capturedImages[view.id]
                
                return (
                  <motion.div
                    key={view.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Card className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${view.color}`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg">{view.label}</CardTitle>
                              <CardDescription className="text-white/60">
                                {view.description}
                              </CardDescription>
                            </div>
                          </div>
                          {isCompleted && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Captured
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-black/50 h-56 mb-4 rounded-lg flex items-center justify-center border border-white/10">
                          {isCompleted ? (
                            <img 
                              src={capturedImages[view.id]} 
                              alt={view.label}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-center">
                              <Camera className="w-12 h-12 text-white/30 mx-auto mb-2" />
                              <span className="text-white/50 text-sm">No image captured</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant={isCompleted ? "outline" : "default"}
                          onClick={() => handleStartCapture(view.id)}
                          className={`w-full ${
                            isCompleted 
                              ? 'border-white/20 text-white hover:bg-white/10' 
                              : `bg-gradient-to-r ${view.color} hover:opacity-90 text-white font-bold`
                          }`}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {isCompleted ? 'Retake Photo' : 'Capture Photo'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysisAreas.map((area, index) => {
                  const IconComponent = area.icon
                  const getRiskColor = (risk: string) => {
                    switch(risk) {
                      case 'high': return 'from-red-500 to-pink-500'
                      case 'moderate': return 'from-yellow-500 to-orange-500'
                      case 'low': return 'from-green-500 to-emerald-500'
                      default: return 'from-purple-500 to-pink-500'
                    }
                  }
                  
                  return (
                    <motion.div
                      key={area.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                        <CardContent className="p-6 text-center">
                          <div className={`w-12 h-12 bg-gradient-to-br ${getRiskColor(area.risk)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-white mb-2">{area.name}</h3>
                          <p className="text-sm text-white/60 mb-3">{area.description}</p>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${getRiskColor(area.risk)} h-2 rounded-full`}
                              style={{ width: `${area.progress}%` }}
                            ></div>
                          </div>
                          <div className="mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                area.risk === 'high' ? 'border-red-500/30 text-red-300' :
                                area.risk === 'moderate' ? 'border-yellow-500/30 text-yellow-300' :
                                'border-green-500/30 text-green-300'
                              }`}
                            >
                              {area.risk.toUpperCase()} RISK
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex justify-center items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              
              
              <Button 
                onClick={handleAnalyze}
                disabled={!allCaptured || isAnalyzing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Body Composition...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Analyze Body Composition
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
                    <h3 className="text-lg font-semibold text-white">Positioning Guidelines</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 text-sm text-white/70">
                    <div>
                      <h4 className="font-medium text-white mb-3">📏 Optimal Positioning:</h4>
                      <ul className="space-y-1">
                        <li>• Stand 6-8 feet from camera</li>
                        <li>• Keep arms relaxed at sides</li>
                        <li>• Maintain natural posture</li>
                        <li>• Look straight ahead</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-3">🔍 Analysis Metrics:</h4>
                      <ul className="space-y-1">
                        <li>• Waist-to-hip ratio calculation</li>
                        <li>• Central adiposity assessment</li>
                        <li>• Posture-related health markers</li>
                        <li>• Body fat distribution patterns</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-3">🎯 Health Indicators:</h4>
                      <ul className="space-y-1">
                        <li>• Visceral fat accumulation</li>
                        <li>• Metabolic syndrome markers</li>
                        <li>• Insulin resistance patterns</li>
                        <li>• Diabetes risk assessment</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <CameraCapture
            type={captureType}
            onCapture={(imageData: string) => handleCapture(imageData, captureType)}
            onCancel={() => setCurrentView('instructions')}
            instructions={
              captureViews.find(v => v.id === captureType)?.description || 
              'Position your body in the frame'
            }
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-6xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Body composition analysis for diabetes risk assessment.
          </p>
        </div>
      </footer>
    </div>
  )
}
