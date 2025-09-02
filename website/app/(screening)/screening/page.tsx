'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, ChevronRight, Shield, Zap, Star, Award, Watch, ArrowLeft } from 'lucide-react'

const screeningSteps = [
  { 
    id: 'questionnaire', 
    title: 'Health Questionnaire', 
    description: 'Comprehensive assessment of your lifestyle, medical history, and family background',
    duration: 5,
    icon: '📋',
    status: 'Required',
    accuracy: '95%'
  },
  { 
    id: 'wearable-analysis', 
    title: 'Wearable Data Analysis', 
    description: 'Import and analyze data from your smartwatch, fitness tracker, or health apps',
    duration: 2,
    icon: '⌚',
    status: 'Recommended',
    accuracy: '93%'
  },
  { 
    id: 'skin-scan', 
    title: 'Skin Analysis', 
    description: 'Advanced AI-powered analysis of neck and skin fold patterns',
    duration: 3,
    icon: '🔍',
    status: 'Recommended',
    accuracy: '88%'
  },
  { 
    id: 'face-scan', 
    title: 'Facial Analysis', 
    description: 'Deep learning assessment of facial features and textures',
    duration: 2,
    icon: '👤',
    status: 'Optional',
    accuracy: '82%'
  },
  { 
    id: 'foot-scan', 
    title: 'Foot Assessment', 
    description: 'Detailed examination of foot health and early wound detection',
    duration: 3,
    icon: '🦶',
    status: 'Recommended',
    accuracy: '91%'
  },
  { 
    id: 'pose-scan', 
    title: 'Body Composition', 
    description: 'AI-powered analysis of body shape and fat distribution patterns',
    duration: 2,
    icon: '🧍',
    status: 'Optional',
    accuracy: '85%'
  },
  { 
    id: 'breathing-test', 
    title: 'Breathing Test', 
    description: 'Advanced respiratory pattern analysis using acoustic AI',
    duration: 4,
    icon: '🫁',
    status: 'Recommended',
    accuracy: '89%'
  },
]

export default function ScreeningHub() {
  const router = useRouter()

  const startScreening = (stepId: string) => {
    router.push(`/screening/${stepId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Required':
        return <Shield className="w-3 h-3" />
      case 'Recommended':
        return <Star className="w-3 h-3" />
      default:
        return <Award className="w-3 h-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Required':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'Recommended':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/GlucoZap.png" alt="GlucoZap Logo" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold">GlucoZap</span>
            </Link>
            
            <Link href="/">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Diabetes Risk
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Assessment
            </span>
          </h1>
          
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Get your comprehensive health evaluation through our advanced AI screening system.
            <span className="block mt-2 text-white font-semibold">
              Early detection leads to better outcomes.
            </span>
          </p>

        </motion.div>

        {/* Progress Section */}
        <motion.div 
          className="mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold">Assessment Progress</span>
              </div>
              <span className="text-sm text-white/60 font-mono">0% complete</span>
            </div>
            <Progress value={0} className="h-3 bg-white/10 rounded-full">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"></div>
            </Progress>
            <p className="text-xs text-white/50 mt-2">Complete all required tests for the most accurate assessment</p>
          </div>
        </motion.div>

        {/* Screening Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {screeningSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={index === 0 ? 'md:col-span-2 lg:col-span-3' : ''}
            >
              <Card className="group hover:bg-white/10 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                        <span className="text-2xl">{step.icon}</span>
                      </div>
                      <div className="space-y-2">
                       
                       
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/60 bg-white/10 rounded-lg px-3 py-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">{step.duration}m</span>
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Button 
                    onClick={() => startScreening(step.id)}
                    className="group w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="mr-2">
                      {index === 0 ? 'Start Assessment' : 'Begin Test'}
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                 

                  {step.id === 'wearable-analysis' && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-300 text-sm">
                        <Watch className="w-4 h-4" />
                        <span>Apple Health, Fitbit, Google Fit</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <motion.div 
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            Why Choose Our AI Assessment?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl mx-auto flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg">Lightning Fast</h4>
              <p className="text-white/70 text-sm">Get results in minutes, not days</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg">Clinically Validated</h4>
              <p className="text-white/70 text-sm">Backed by medical research</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl mx-auto flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg">Highly Accurate</h4>
              <p className="text-white/70 text-sm">Up to 95% accuracy rate</p>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <p className="text-white/70 mb-6">
            Ready to take control of your health? Start with our comprehensive questionnaire.
          </p>
          <Button 
            onClick={() => startScreening('questionnaire')}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold px-8 py-4 text-lg rounded-2xl shadow-2xl shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02]"
          >
            Begin Assessment Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5">
        <div className="max-w-4xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Not medical advice. Consult healthcare providers.
          </p>
        </div>
      </footer>
    </div>
  )
}
