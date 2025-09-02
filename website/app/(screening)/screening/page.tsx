'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, ChevronRight, Shield, Zap, Star, Award } from 'lucide-react'

const screeningSteps = [
  { 
    id: 'questionnaire', 
    title: 'Health Questionnaire', 
    description: 'Comprehensive assessment of your lifestyle, medical history, and family background',
    duration: 5,
    icon: '📋',
    status: 'Required',
    color: 'from-blue-500 to-cyan-500',
    priority: 'high',
    accuracy: '95%'
  },
  { 
    id: 'skin-scan', 
    title: 'Skin Analysis', 
    description: 'Advanced AI-powered analysis of neck and skin fold patterns',
    duration: 3,
    icon: '🔍',
    status: 'Recommended',
    color: 'from-purple-500 to-pink-500',
    priority: 'medium',
    accuracy: '88%'
  },
  { 
    id: 'face-scan', 
    title: 'Facial Analysis', 
    description: 'Deep learning assessment of facial features and textures',
    duration: 2,
    icon: '👤',
    status: 'Optional',
    color: 'from-green-500 to-emerald-500',
    priority: 'low',
    accuracy: '82%'
  },
  { 
    id: 'foot-scan', 
    title: 'Foot Assessment', 
    description: 'Detailed examination of foot health and early wound detection',
    duration: 3,
    icon: '🦶',
    status: 'Recommended',
    color: 'from-orange-500 to-red-500',
    priority: 'medium',
    accuracy: '91%'
  },
  { 
    id: 'pose-scan', 
    title: 'Body Composition', 
    description: 'AI-powered analysis of body shape and fat distribution patterns',
    duration: 2,
    icon: '🧍',
    status: 'Optional',
    color: 'from-indigo-500 to-purple-500',
    priority: 'low',
    accuracy: '85%'
  },
  { 
    id: 'breathing-test', 
    title: 'Breathing Test', 
    description: 'Advanced respiratory pattern analysis using acoustic AI',
    duration: 4,
    icon: '🫁',
    status: 'Recommended',
    color: 'from-teal-500 to-green-500',
    priority: 'medium',
    accuracy: '89%'
  },
]

export default function ScreeningHub() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const startScreening = (stepId: string) => {
    router.push(`/screening/${stepId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Required':
        return <Shield className="w-4 h-4" />
      case 'Recommended':
        return <Star className="w-4 h-4" />
      default:
        return <Award className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Required':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Recommended':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const totalDuration = screeningSteps.reduce((acc, step) => acc + step.duration, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto py-16 px-4 relative z-10">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">AI-Powered Health Assessment</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent leading-tight">
            Diabetes Risk
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Assessment
            </span>
          </h1>
          
          <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Get your comprehensive health evaluation through our advanced AI screening system. 
            Early detection leads to better outcomes.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Total time: ~{totalDuration} minutes</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">HIPAA Compliant</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Section */}
        <motion.div 
          className="mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-white">Assessment Progress</span>
              </div>
              <span className="text-sm text-gray-400 font-mono">0% complete</span>
            </div>
            <Progress value={0} className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"></div>
            </Progress>
            <p className="text-xs text-gray-500 mt-2">Complete all required tests for the most accurate assessment</p>
          </div>
        </motion.div>

        {/* Screening Steps Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {screeningSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={index === 0 ? 'lg:col-span-2' : ''}
            >
              <Card className="group hover:bg-zinc-900/80 transition-all duration-500 border border-zinc-800/50 backdrop-blur-sm bg-zinc-900/40 hover:border-zinc-700 hover:shadow-2xl hover:shadow-cyan-500/10 relative overflow-hidden">
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Animated border */}
                <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                          <span className="text-2xl">{step.icon}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge
                            className={`w-fit ${getStatusColor(step.status)} border font-medium`}
                          >
                            <span className="mr-1">{getStatusIcon(step.status)}</span>
                            {step.status}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-mono">Accuracy: {step.accuracy}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <CardTitle className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform duration-300 ${step.color}`}>
                          {step.title}
                        </CardTitle>
                        <CardDescription className="text-gray-300 mt-2 text-base leading-relaxed">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2 text-gray-400 bg-zinc-800/50 rounded-lg px-3 py-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.duration} min</span>
                      </div>
                      {index === 0 && (
                        <div className="text-xs text-orange-400 font-medium">
                          Start here
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative pt-0">
                  <Button 
                    onClick={() => startScreening(step.id)}
                    className={`group w-full h-14 bg-gradient-to-r transition-all duration-500 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${step.color} text-white font-semibold text-lg relative overflow-hidden`}
                  >
                    {/* Button background animation */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                    
                    <span className="relative mr-3">
                      {index === 0 ? 'Start Your Assessment' : `Begin ${step.title}`}
                    </span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300 relative" />
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  </Button>
                  
                  {/* Additional info for first card */}
                  {index === 0 && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-300 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Recommended starting point for accurate assessment</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 max-w-4xl mx-auto backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Why Choose Our AI Assessment?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mx-auto flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-lg">Lightning Fast</h4>
                <p className="text-gray-400 text-sm">Get results in minutes, not days</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-lg">Clinically Validated</h4>
                <p className="text-gray-400 text-sm">Backed by medical research</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mx-auto flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-lg">Highly Accurate</h4>
                <p className="text-gray-400 text-sm">Up to 95% accuracy rate</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <p className="text-gray-400 text-sm mb-4">
            Ready to take control of your health? Start with our comprehensive questionnaire.
          </p>
          <Button 
            onClick={() => startScreening('questionnaire')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Begin Assessment Now
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}