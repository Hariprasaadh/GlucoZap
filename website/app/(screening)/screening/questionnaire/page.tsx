'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight,
  FileText, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Target,
  Shield,
  Heart,
  Activity,
  User,
  Scale,
  Utensils,
  Moon,
  Brain,
  Cigarette,
  Wine,
  Droplets
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useScreeningStore } from '@/lib/store'

interface FormData {
  Age: string
  Gender: string
  Height: string
  Weight: string
  'Waist Circumference': string
  'Hip Circumference': string
  'Family History': string
  Hypertension: string
  'Heart Disease': string
  Smoking: string
  'Physical Activity': string
  Diet: string
  Alcohol: string
  Sleep: string
  Stress: string
  'Skin/Neck Features': string
  'Foot Health': string
  'Facial/Skin': string
  'Breathing Patterns': string
  'Blood Glucose': string
  HbA1c: string
}

export default function DiabetesQuestionnaire() {
  const router = useRouter()
  const { updateScreeningData } = useScreeningStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    Age: '',
    Gender: '',
    Height: '',
    Weight: '',
    'Waist Circumference': '',
    'Hip Circumference': '',
    'Family History': '',
    Hypertension: '',
    'Heart Disease': '',
    Smoking: '',
    'Physical Activity': '',
    Diet: '',
    Alcohol: '',
    Sleep: '',
    Stress: '',
    'Skin/Neck Features': '',
    'Foot Health': '',
    'Facial/Skin': '',
    'Breathing Patterns': '',
    'Blood Glucose': '',
    HbA1c: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const totalSteps = 5
  const progressValue = (currentStep / totalSteps) * 100

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Validate required fields
      const requiredFields = ['Age', 'Gender', 'Height', 'Weight', 'Blood Glucose', 'HbA1c']
      const missingFields = requiredFields.filter(field => !formData[field as keyof FormData])
      
      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.join(', ')}`)
        setIsSubmitting(false)
        return
      }

      // Prepare data for API
      const apiData = {
        Age: parseInt(formData.Age) || 30,
        Gender: formData.Gender || 'Male',
        Height: parseInt(formData.Height) || 170,
        Weight: parseInt(formData.Weight) || 70,
        'Waist Circumference': parseInt(formData['Waist Circumference']) || 80,
        'Hip Circumference': parseInt(formData['Hip Circumference']) || 90,
        'Family History': formData['Family History'] || 'No',
        Hypertension: formData.Hypertension || 'No',
        'Heart Disease': formData['Heart Disease'] || 'No',
        Smoking: formData.Smoking || 'Never',
        'Physical Activity': formData['Physical Activity'] || 'Moderate',
        Diet: formData.Diet || 'Average',
        Alcohol: formData.Alcohol || 'Never',
        Sleep: formData.Sleep || 'Good',
        Stress: formData.Stress || 'Low',
        'Skin/Neck Features': formData['Skin/Neck Features'] || 'Normal',
        'Foot Health': formData['Foot Health'] || 'Normal',
        'Facial/Skin': formData['Facial/Skin'] || 'Normal',
        'Breathing Patterns': formData['Breathing Patterns'] || 'Normal',
        'Blood Glucose': parseInt(formData['Blood Glucose']) || 100,
        HbA1c: parseFloat(formData.HbA1c) || 5.5
      }

      // Call diabetes prediction API
      const response = await fetch(`${process.env.NEXT_PUBLIC_QUESTIONNAIRE_API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setResults(result)
      setShowResults(true)
      updateScreeningData({ questionnaire: result })
      
    } catch (error) {
      console.error('Risk assessment failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze risk assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score < 0.3) {
      return { level: 'Low Risk', color: 'text-green-300', bg: 'bg-green-500/20', description: 'Low probability of diabetes' }
    } else if (score < 0.7) {
      return { level: 'Moderate Risk', color: 'text-yellow-300', bg: 'bg-yellow-500/20', description: 'Moderate risk - monitor closely' }
    } else {
      return { level: 'High Risk', color: 'text-red-300', bg: 'bg-red-500/20', description: 'High risk - consult healthcare provider' }
    }
  }

  const resetAssessment = () => {
    setShowResults(false)
    setResults(null)
    setCurrentStep(1)
    setFormData({
      Age: '',
      Gender: '',
      Height: '',
      Weight: '',
      'Waist Circumference': '',
      'Hip Circumference': '',
      'Family History': '',
      Hypertension: '',
      'Heart Disease': '',
      Smoking: '',
      'Physical Activity': '',
      Diet: '',
      Alcohol: '',
      Sleep: '',
      Stress: '',
      'Skin/Neck Features': '',
      'Foot Health': '',
      'Facial/Skin': '',
      'Breathing Patterns': '',
      'Blood Glucose': '',
      HbA1c: ''
    })
    setError(null)
  }

  const finishTest = () => {
    router.push('/screening');
  };

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
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                Health Assessment
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Comprehensive diabetes risk evaluation questionnaire
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold">Assessment Progress</span>
              </div>
              <span className="text-sm text-white/60 font-mono">Step {currentStep} of {totalSteps}</span>
            </div>
            <Progress value={progressValue} className="h-3 bg-white/10 rounded-full">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"></div>
            </Progress>
            <div className="flex justify-between text-xs text-white/50 mt-2">
              <span>Basic Info</span>
              <span>Health History</span>
              <span>Lifestyle</span>
              <span>Clinical Data</span>
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

        {!showResults ? (
          <>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-blue-400" />
                      <CardTitle className="text-white">Basic Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Age */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Age (years)</label>
                      <input
                        type="number"
                        value={formData.Age}
                        onChange={(e) => handleInputChange('Age', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-blue-400 focus:outline-none"
                        placeholder="Enter your age"
                        min="1"
                        max="150"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Gender</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Male', 'Female'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Gender', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData.Gender === option
                                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Height & Weight */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 font-medium mb-2">Height (cm)</label>
                        <input
                          type="number"
                          value={formData.Height}
                          onChange={(e) => handleInputChange('Height', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-blue-400 focus:outline-none"
                          placeholder="170"
                          min="100"
                          max="250"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 font-medium mb-2">Weight (kg)</label>
                        <input
                          type="number"
                          value={formData.Weight}
                          onChange={(e) => handleInputChange('Weight', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-blue-400 focus:outline-none"
                          placeholder="70"
                          min="30"
                          max="300"
                        />
                      </div>
                    </div>

                    {/* Waist & Hip Circumference */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 font-medium mb-2">Waist Circumference (cm)</label>
                        <input
                          type="number"
                          value={formData['Waist Circumference']}
                          onChange={(e) => handleInputChange('Waist Circumference', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-blue-400 focus:outline-none"
                          placeholder="80"
                          min="50"
                          max="200"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 font-medium mb-2">Hip Circumference (cm)</label>
                        <input
                          type="number"
                          value={formData['Hip Circumference']}
                          onChange={(e) => handleInputChange('Hip Circumference', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-blue-400 focus:outline-none"
                          placeholder="90"
                          min="60"
                          max="200"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Health History */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Heart className="w-6 h-6 text-red-400" />
                      <CardTitle className="text-white">Health History</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Family History */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Family History of Diabetes</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Yes', 'No'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Family History', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData['Family History'] === option
                                ? 'bg-red-500/20 border-red-400 text-red-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hypertension */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Do you have Hypertension?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Yes', 'No'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Hypertension', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData.Hypertension === option
                                ? 'bg-red-500/20 border-red-400 text-red-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Heart Disease */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Do you have Heart Disease?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Yes', 'No'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Heart Disease', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData['Heart Disease'] === option
                                ? 'bg-red-500/20 border-red-400 text-red-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Physical Symptoms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/80 font-medium mb-2">Skin/Neck Features</label>
                        <select
                          value={formData['Skin/Neck Features']}
                          onChange={(e) => handleInputChange('Skin/Neck Features', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Normal">Normal</option>
                          <option value="Dark patches">Dark patches</option>
                          <option value="Skin tags">Skin tags</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 font-medium mb-2">Foot Health</label>
                        <select
                          value={formData['Foot Health']}
                          onChange={(e) => handleInputChange('Foot Health', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Normal">Normal</option>
                          <option value="Numbness">Numbness</option>
                          <option value="Tingling">Tingling</option>
                          <option value="Pain">Pain</option>
                          <option value="Multiple symptoms">Multiple symptoms</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/80 font-medium mb-2">Facial/Skin Changes</label>
                        <select
                          value={formData['Facial/Skin']}
                          onChange={(e) => handleInputChange('Facial/Skin', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Normal">Normal</option>
                          <option value="Dry skin">Dry skin</option>
                          <option value="Slow healing">Slow healing</option>
                          <option value="Frequent infections">Frequent infections</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 font-medium mb-2">Breathing Patterns</label>
                        <select
                          value={formData['Breathing Patterns']}
                          onChange={(e) => handleInputChange('Breathing Patterns', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Normal">Normal</option>
                          <option value="Shortness of breath">Shortness of breath</option>
                          <option value="Sleep apnea">Sleep apnea</option>
                          <option value="Irregular breathing">Irregular breathing</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Lifestyle Factors */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-green-400" />
                      <CardTitle className="text-white">Lifestyle Factors</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Smoking */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        <Cigarette className="w-4 h-4 inline mr-2" />
                        Smoking Status
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Never', 'Former', 'Current'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Smoking', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData.Smoking === option
                                ? 'bg-green-500/20 border-green-400 text-green-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Physical Activity */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        <Activity className="w-4 h-4 inline mr-2" />
                        Physical Activity Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Low', 'Moderate', 'High'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Physical Activity', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData['Physical Activity'] === option
                                ? 'bg-green-500/20 border-green-400 text-green-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Diet */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        <Utensils className="w-4 h-4 inline mr-2" />
                        Diet Quality
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Poor', 'Average', 'Good'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Diet', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData.Diet === option
                                ? 'bg-green-500/20 border-green-400 text-green-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alcohol */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        <Wine className="w-4 h-4 inline mr-2" />
                        Alcohol Consumption
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Never', 'Occasional', 'Regular'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleInputChange('Alcohol', option)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData.Alcohol === option
                                ? 'bg-green-500/20 border-green-400 text-green-300'
                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sleep & Stress */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/80 font-medium mb-2">
                          <Moon className="w-4 h-4 inline mr-2" />
                          Sleep Quality
                        </label>
                        <select
                          value={formData.Sleep}
                          onChange={(e) => handleInputChange('Sleep', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Poor">Poor (&lt; 6 hours)</option>
                          <option value="Average">Average (6-7 hours)</option>
                          <option value="Good">Good (7-9 hours)</option>
                          <option value="Excellent">Excellent (&gt; 8 hours)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 font-medium mb-2">
                          <Brain className="w-4 h-4 inline mr-2" />
                          Stress Level
                        </label>
                        <select
                          value={formData.Stress}
                          onChange={(e) => handleInputChange('Stress', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High</option>
                          <option value="Very High">Very High</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Clinical Data */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Droplets className="w-6 h-6 text-purple-400" />
                      <CardTitle className="text-white">Clinical Data</CardTitle>
                    </div>
                    <CardDescription className="text-white/60">
                      Please provide recent test results if available
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Blood Glucose */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        Blood Glucose Level (mg/dL)
                        <span className="text-white/50 text-sm ml-2">(Fasting: Normal &lt; 100)</span>
                      </label>
                      <input
                        type="number"
                        value={formData['Blood Glucose']}
                        onChange={(e) => handleInputChange('Blood Glucose', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none"
                        placeholder="100"
                        min="50"
                        max="500"
                      />
                      <p className="text-xs text-white/50 mt-1">
                        Enter recent blood glucose reading or estimated value
                      </p>
                    </div>

                    {/* HbA1c */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        HbA1c Level (%)
                        <span className="text-white/50 text-sm ml-2">(Normal &lt; 5.7%)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.HbA1c}
                        onChange={(e) => handleInputChange('HbA1c', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none"
                        placeholder="5.5"
                        min="3.0"
                        max="15.0"
                      />
                      <p className="text-xs text-white/50 mt-1">
                        Enter recent HbA1c test result or estimated value based on symptoms
                      </p>
                    </div>

                    {/* Clinical Guidelines */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
                      <h4 className="text-blue-300 font-semibold mb-2">Reference Ranges:</h4>
                      <div className="text-sm text-blue-200/80 space-y-1">
                        <p><strong>Blood Glucose (Fasting):</strong> Normal &lt; 100 mg/dL, Pre-diabetes 100-125 mg/dL, Diabetes ≥ 126 mg/dL</p>
                        <p><strong>HbA1c:</strong> Normal &lt; 5.7%, Pre-diabetes 5.7-6.4%, Diabetes ≥ 6.5%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <CardTitle className="text-white">Review & Submit</CardTitle>
                    </div>
                    <CardDescription className="text-white/60">
                      Please review your information before submitting for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(formData).map(([key, value]) => (
                        <div key={key} className="bg-white/5 rounded-lg p-3">
                          <div className="text-white/60 text-xs">{key}</div>
                          <div className="text-white font-medium">{value || 'Not provided'}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center mt-8">
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold px-8 py-3"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Target className="w-5 h-5 mr-2" />
                            Get Risk Assessment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                variant="outline"
                className="border-white/20 text-white bg-black hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          /* Results Display */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-purple-400" />
                    <CardTitle className="text-white">Diabetes Risk Assessment Results</CardTitle>
                  </div>
                  <Button
                    onClick={resetAssessment}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    New Assessment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {results && (
                  <>
                    {/* Risk Score */}
                    <div className="text-center">
                      <div className={`inline-flex items-center px-6 py-3 rounded-full ${getRiskLevel(results['Diabetes Risk Confidence Score']).bg} mb-4`}>
                        <Target className="w-5 h-5 mr-2" />
                        <span className={`font-bold text-lg ${getRiskLevel(results['Diabetes Risk Confidence Score']).color}`}>
                          {getRiskLevel(results['Diabetes Risk Confidence Score']).level}
                        </span>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-6 mb-6">
                        <div className="text-4xl font-black text-white mb-2">
                          {(results['Diabetes Risk Confidence Score'] * 100).toFixed(1)}%
                        </div>
                        <div className="text-white/60">Risk Confidence Score</div>
                        <div className={`text-sm mt-2 ${getRiskLevel(results['Diabetes Risk Confidence Score']).color}`}>
                          {getRiskLevel(results['Diabetes Risk Confidence Score']).description}
                        </div>
                      </div>
                    </div>

                    {/* Risk Level Visualization */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">Risk Scale</h4>
                      <div className="relative">
                        <div className="w-full bg-white/10 rounded-full h-4">
                          <div 
                            className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full"
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                        <div 
                          className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2"
                          style={{ left: `${results['Diabetes Risk Confidence Score'] * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-white/50 mt-2">
                        <span>Low Risk</span>
                        <span>Moderate Risk</span>
                        <span>High Risk</span>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h4 className="text-blue-300 font-semibold mb-2">Immediate Actions</h4>
                        <ul className="text-sm text-blue-200/80 space-y-1">
                          <li>• Monitor blood glucose regularly</li>
                          <li>• Maintain healthy diet and exercise</li>
                          <li>• Schedule regular health checkups</li>
                          <li>• Track weight and blood pressure</li>
                        </ul>
                      </div>
                      
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <h4 className="text-purple-300 font-semibold mb-2">Lifestyle Recommendations</h4>
                        <ul className="text-sm text-purple-200/80 space-y-1">
                          <li>• Follow balanced, low-sugar diet</li>
                          <li>• Engage in regular physical activity</li>
                          <li>• Maintain healthy sleep schedule</li>
                          <li>• Manage stress effectively</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-center mt-8">
                      <Button
                        onClick={finishTest}
                        className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white font-bold px-8 py-3"
                      >
                        Finish
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-yellow-300">Important Notice</h3>
                </div>
                <p className="text-yellow-200/80 text-sm">
                  This assessment provides an AI-generated risk estimate based on the information provided. 
                  It is not a medical diagnosis and should not replace professional medical consultation. 
                  Please consult with a healthcare provider for proper diagnosis and treatment recommendations.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-4xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Health assessment for screening purposes only. Consult healthcare providers for diagnosis.
          </p>
        </div>
      </footer>
    </div>
  )
}
