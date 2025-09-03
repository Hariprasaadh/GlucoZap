'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Calendar, 
  Activity, 
  Eye, 
  Brain, 
  Heart, 
  Scale, 
  FileText,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import Vapi from '@vapi-ai/web'

// Types for test results
interface TestResult {
  id: string;
  name: string;
  type: 'diabetes' | 'retinopathy' | 'stress' | 'bmi' | 'acanthosis';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  score?: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  result: string;
  recommendations: string[];
  details: {
    [key: string]: any;
  };
}

interface ReportData {
  id: string;
  patientName: string;
  generatedDate: string;
  overallRiskScore: number;
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'severe';
  testResults: TestResult[];
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
}

// Mock comprehensive report data
const mockReportData: ReportData = {
  id: 'RPT-2024-001',
  patientName: 'John Doe',
  generatedDate: '2024-03-15',
  overallRiskScore: 65,
  overallRiskLevel: 'moderate',
  testResults: [
    {
      id: 'diabetes-001',
      name: 'Diabetes Risk Assessment',
      type: 'diabetes',
      date: '2024-03-15',
      status: 'completed',
      score: 72,
      riskLevel: 'moderate',
      result: 'Moderate risk detected based on lifestyle and health factors',
      recommendations: [
        'Monitor blood glucose levels regularly',
        'Reduce sugar intake in daily diet',
        'Increase physical activity to 150 minutes per week'
      ],
      details: {
        age: 45,
        bmi: 28.5,
        familyHistory: true,
        physicalActivity: 'low',
        diet: 'poor'
      }
    },
    {
      id: 'retinopathy-001',
      name: 'Diabetic Retinopathy Screening',
      type: 'retinopathy',
      date: '2024-03-15',
      status: 'completed',
      score: 25,
      riskLevel: 'low',
      result: 'No signs of diabetic retinopathy detected',
      recommendations: [
        'Continue annual eye examinations',
        'Maintain good blood sugar control',
        'Protect eyes from UV exposure'
      ],
      details: {
        prediction: 'No_DR',
        confidence: 0.89,
        severity: 'Normal'
      }
    },
    {
      id: 'stress-001',
      name: 'Stress Level Analysis',
      type: 'stress',
      date: '2024-03-15',
      status: 'completed',
      score: 78,
      riskLevel: 'high',
      result: 'High stress levels detected through facial analysis',
      recommendations: [
        'Practice stress management techniques',
        'Consider meditation or yoga',
        'Ensure adequate sleep (7-8 hours)'
      ],
      details: {
        stressIndicators: ['facial_tension', 'eye_strain'],
        confidence: 0.82
      }
    },
    {
      id: 'bmi-001',
      name: 'BMI Classification',
      type: 'bmi',
      date: '2024-03-15',
      status: 'completed',
      riskLevel: 'moderate',
      result: 'Overweight - BMI indicates moderate health risk',
      recommendations: [
        'Aim for gradual weight loss of 1-2 lbs per week',
        'Focus on balanced nutrition',
        'Increase daily physical activity'
      ],
      details: {
        bmi: 28.5,
        category: 'overweight',
        idealWeight: '70-75 kg'
      }
    },
    {
      id: 'acanthosis-001',
      name: 'Acanthosis Nigricans Detection',
      type: 'acanthosis',
      date: '2024-03-15',
      status: 'completed',
      riskLevel: 'low',
      result: 'No signs of acanthosis nigricans detected',
      recommendations: [
        'Continue monitoring skin changes',
        'Maintain healthy weight',
        'Regular dermatological checkups'
      ],
      details: {
        prediction: 'normal',
        confidence: 0.91,
        areas_checked: ['neck', 'armpits', 'groin']
      }
    }
  ],
  keyFindings: [
    'Moderate diabetes risk requiring lifestyle modifications',
    'High stress levels may contribute to metabolic dysfunction',
    'BMI indicates overweight status with associated health risks',
    'Eye health appears normal with no retinopathy signs',
    'Skin examination shows no signs of insulin resistance markers'
  ],
  recommendations: [
    'Implement comprehensive lifestyle changes focusing on diet and exercise',
    'Stress management is crucial for overall health improvement',
    'Regular monitoring of blood glucose and blood pressure',
    'Continue annual eye examinations',
    'Consider consulting with healthcare provider for personalized plan'
  ],
  nextSteps: [
    'Schedule follow-up screening in 3 months',
    'Begin stress reduction program',
    'Consult with nutritionist for meal planning',
    'Start supervised exercise program',
    'Monitor progress with regular health checkups'
  ]
};

// VAPI Configuration for report reading
const reportReaderConfig = {
  name: "GlucoZap Report Reader",
  firstMessage: "I'll now read your comprehensive health report summary. Please listen carefully to the key findings and recommendations.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.6,
    similarityBoost: 0.8,
    speed: 0.85,
    style: 0.4,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional medical report reader for GlucoZap health assessments. Your role is to clearly and calmly read health report summaries to patients.

Guidelines:
- Speak in a calm, professional, and reassuring tone
- Clearly articulate medical terms and explain them simply
- Pause appropriately between sections for clarity
- Emphasize important findings and recommendations
- Be encouraging while being factual
- Use a measured pace that's easy to follow

When reading a report:
1. Start with an overview of the assessment date and overall risk level
2. Go through each test result systematically
3. Highlight key findings clearly
4. Read recommendations with emphasis on actionable items
5. End with next steps and encouragement

Remember: You are providing information, not medical advice. Always remind users to consult healthcare providers for medical decisions.`
      },
    ],
  },
}

export default function ReportPage() {
  const [reportData, setReportData] = useState<ReportData>(mockReportData)
  const [isReading, setIsReading] = useState(false)
  const [currentReadingSection, setCurrentReadingSection] = useState<'full' | 'findings' | 'recommendations' | null>(null)
  const [vapi, setVapi] = useState<any>(null)
  const [isVapiReady, setIsVapiReady] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle')

  // Initialize VAPI
  useEffect(() => {
    const initVapi = async () => {
      try {
        const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '')
        setVapi(vapiInstance)
        setIsVapiReady(true)

        // Event listeners
        vapiInstance.on('call-start', () => {
          setCallStatus('connected')
          setIsReading(true)
        })

        vapiInstance.on('call-end', () => {
          setCallStatus('ended')
          setIsReading(false)
          setCurrentReadingSection(null)
        })

        vapiInstance.on('error', (error: any) => {
          console.error('VAPI Error:', error)
          setCallStatus('idle')
          setIsReading(false)
          setCurrentReadingSection(null)
        })

      } catch (error) {
        console.error('Failed to initialize VAPI:', error)
      }
    }

    initVapi()
  }, [])

  // Generate different content sections for VAPI to read
  const generateFullReportSummary = useCallback(() => {
    const summary = `
Health Assessment Report Summary for ${reportData.patientName}

Report generated on ${new Date(reportData.generatedDate).toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Overall Risk Assessment: ${reportData.overallRiskLevel.toUpperCase()} risk level with a score of ${reportData.overallRiskScore} out of 100.

Test Results Summary:

${reportData.testResults.map(test => `
${test.name}: ${test.result}
Risk Level: ${test.riskLevel}
${test.score ? `Score: ${test.score} out of 100` : ''}
`).join('\n')}

Key Findings:
${reportData.keyFindings.map((finding, index) => `${index + 1}. ${finding}`).join('\n')}

Primary Recommendations:
${reportData.recommendations.slice(0, 3).map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

Next Steps:
${reportData.nextSteps.slice(0, 3).map((step, index) => `${index + 1}. ${step}`).join('\n')}

Please consult with your healthcare provider to discuss these results and create a personalized health plan. This assessment is for informational purposes and should not replace professional medical advice.
    `
    return summary.trim()
  }, [reportData])

  const generateKeyFindings = useCallback(() => {
    const findings = `
Key Findings from Your Health Assessment:

Based on your comprehensive health screening, here are the most important findings we discovered:

${reportData.keyFindings.map((finding, index) => `

Finding ${index + 1}: ${finding}

`).join('')}

These findings provide important insights into your current health status. Each finding represents a significant aspect of your health that requires attention or monitoring.

Let me know if you would like me to explain any of these findings in more detail, or if you'd like to hear the recommendations based on these results.
    `
    return findings.trim()
  }, [reportData])

  const generateRecommendations = useCallback(() => {
    const recommendations = `
Health Recommendations Based on Your Assessment:

Based on your test results and key findings, here are our personalized recommendations for improving your health:

${reportData.recommendations.map((rec, index) => `

Recommendation ${index + 1}: ${rec}

`).join('')}

These recommendations are designed to help you address the identified health concerns and improve your overall wellbeing. Each recommendation is based on established medical guidelines and your specific test results.

Remember to discuss these recommendations with your healthcare provider to create a personalized action plan that works best for your individual situation.

Would you like me to read the next steps you should take to implement these recommendations?
    `
    return recommendations.trim()
  }, [reportData])

  // Start reading different sections
  const startReadingSection = useCallback(async (section: 'full' | 'findings' | 'recommendations') => {
    if (!vapi || !isVapiReady) {
      alert('Voice assistant is not ready. Please try again in a moment.')
      return
    }

    try {
      setCallStatus('connecting')
      setCurrentReadingSection(section)
      
      let content = ''
      let sectionName = ''
      
      switch (section) {
        case 'full':
          content = generateFullReportSummary()
          sectionName = 'complete health report'
          break
        case 'findings':
          content = generateKeyFindings()
          sectionName = 'key findings'
          break
        case 'recommendations':
          content = generateRecommendations()
          sectionName = 'health recommendations'
          break
      }
      
      const config = {
        ...reportReaderConfig,
        firstMessage: `I'll now read your ${sectionName}. Please listen carefully as I go through each important point.`,
        model: {
          ...reportReaderConfig.model,
          messages: [
            reportReaderConfig.model.messages[0],
            {
              role: "user",
              content: `Please read this ${sectionName} section clearly and professionally: ${content}`
            }
          ]
        }
      }

      await vapi.start(config)
    } catch (error) {
      console.error('Failed to start reading:', error)
      setCallStatus('idle')
      setCurrentReadingSection(null)
      alert('Failed to start voice reading. Please try again.')
    }
  }, [vapi, isVapiReady, generateFullReportSummary, generateKeyFindings, generateRecommendations])

  // Stop reading
  const stopReportReading = useCallback(() => {
    if (vapi) {
      vapi.stop()
    }
    setCurrentReadingSection(null)
  }, [vapi])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-700'
      case 'moderate': return 'text-amber-400 bg-amber-900/20 border-amber-700'
      case 'high': return 'text-red-400 bg-red-900/20 border-red-700'
      case 'severe': return 'text-red-300 bg-red-900/30 border-red-600'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700'
    }
  }

  const getTestIcon = (type: string) => {
    switch (type) {
      case 'diabetes': return <Activity className="h-5 w-5" />
      case 'retinopathy': return <Eye className="h-5 w-5" />
      case 'stress': return <Brain className="h-5 w-5" />
      case 'bmi': return <Scale className="h-5 w-5" />
      case 'acanthosis': return <Heart className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50">
                <Link href="/dashboard">
                  <ArrowLeft size={20} />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Health Assessment Report
                </h1>
                <p className="text-gray-400">Comprehensive analysis of your health screening results</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Voice Reading Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={isReading ? stopReportReading : () => startReadingSection('full')}
                  disabled={!isVapiReady}
                  className={`${
                    isReading && currentReadingSection === 'full'
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  } text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  {isReading && currentReadingSection === 'full' ? (
                    <>
                      <VolumeX size={20} />
                      Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 size={20} />
                      Read Full Report
                    </>
                  )}
                </Button>

                <Button
                  onClick={isReading && currentReadingSection === 'findings' ? stopReportReading : () => startReadingSection('findings')}
                  disabled={!isVapiReady}
                  variant="outline"
                  className={`${
                    isReading && currentReadingSection === 'findings'
                      ? 'bg-red-600/20 border-red-600 text-red-300' 
                      : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-yellow-900/30 hover:border-yellow-500/50 hover:text-yellow-300'
                  } transition-all duration-300`}
                >
                  {isReading && currentReadingSection === 'findings' ? (
                    <>
                      <VolumeX size={16} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Read Key Findings
                    </>
                  )}
                </Button>

                <Button
                  onClick={isReading && currentReadingSection === 'recommendations' ? stopReportReading : () => startReadingSection('recommendations')}
                  disabled={!isVapiReady}
                  variant="outline"
                  className={`${
                    isReading && currentReadingSection === 'recommendations'
                      ? 'bg-red-600/20 border-red-600 text-red-300' 
                      : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-green-900/30 hover:border-green-500/50 hover:text-green-300'
                  } transition-all duration-300`}
                >
                  {isReading && currentReadingSection === 'recommendations' ? (
                    <>
                      <VolumeX size={16} />
                      Stop
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} />
                      Read Recommendations
                    </>
                  )}
                </Button>
              </div>

              <Button variant="outline" className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50">
                <Download size={20} />
                Download PDF
              </Button>
              
              <Button variant="outline" className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50">
                <Share2 size={20} />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Report Header Card */}
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-400" />
                  Report #{reportData.id}
                </CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  Patient: {reportData.patientName} | Generated: {new Date(reportData.generatedDate).toLocaleDateString()}
                </CardDescription>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{reportData.overallRiskScore}/100</div>
                <Badge className={`${getRiskColor(reportData.overallRiskLevel)} mt-1`}>
                  {reportData.overallRiskLevel.toUpperCase()} RISK
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Voice Reading Instructions */}
        {!isReading && isVapiReady && (
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/30 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Volume2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-300 font-medium mb-1">Voice Reading Available</h4>
                  <p className="text-gray-400 text-sm">
                    Use the voice buttons to listen to different sections of your report. You can read the full report, 
                    key findings, or recommendations separately for better understanding.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Reading Status */}
        {isReading && (
          <Card className="bg-blue-900/20 border-blue-700/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Volume2 className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-blue-300 font-medium">
                  Reading {currentReadingSection === 'full' ? 'complete report' : 
                           currentReadingSection === 'findings' ? 'key findings' : 
                           currentReadingSection === 'recommendations' ? 'recommendations' : 'report'} aloud...
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={stopReportReading}
                  className="ml-auto bg-red-900/20 border-red-700/50 text-red-300 hover:bg-red-800/30"
                >
                  <VolumeX size={16} />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {reportData.testResults.map((test) => (
            <Card key={test.id} className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                      {getTestIcon(test.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{test.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {new Date(test.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {test.score && (
                      <div className="text-xl font-bold text-white">{test.score}/100</div>
                    )}
                    <Badge className={`${getRiskColor(test.riskLevel)} text-xs`}>
                      {test.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Result:</h4>
                  <p className="text-gray-300">{test.result}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {test.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Findings & Recommendations */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Key Findings */}
          <Card className={`bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl transition-all duration-300 ${
            isReading && currentReadingSection === 'findings' 
              ? 'ring-2 ring-yellow-400/50 border-yellow-400/50 bg-yellow-900/10' 
              : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Key Findings
                </CardTitle>
                
                <Button
                  size="sm"
                  onClick={isReading && currentReadingSection === 'findings' ? stopReportReading : () => startReadingSection('findings')}
                  disabled={!isVapiReady}
                  className={`${
                    isReading && currentReadingSection === 'findings'
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700'
                  } text-white shadow-lg transition-all duration-300`}
                >
                  {isReading && currentReadingSection === 'findings' ? (
                    <>
                      <VolumeX size={16} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      Listen
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    {finding}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className={`bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl transition-all duration-300 ${
            isReading && currentReadingSection === 'recommendations' 
              ? 'ring-2 ring-green-400/50 border-green-400/50 bg-green-900/10' 
              : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Recommendations
                </CardTitle>
                
                <Button
                  size="sm"
                  onClick={isReading && currentReadingSection === 'recommendations' ? stopReportReading : () => startReadingSection('recommendations')}
                  disabled={!isVapiReady}
                  className={`${
                    isReading && currentReadingSection === 'recommendations'
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  } text-white shadow-lg transition-all duration-300`}
                >
                  {isReading && currentReadingSection === 'recommendations' ? (
                    <>
                      <VolumeX size={16} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      Listen
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-400" />
              Next Steps
            </CardTitle>
            <CardDescription className="text-gray-400">
              Follow these steps to improve your health outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.nextSteps.map((step, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <div className="text-gray-400 text-sm">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            This report is for informational purposes only. Please consult your healthcare provider for medical advice.
          </div>
          
          <div className="flex gap-3">
            <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <Link href="/screening">
                Schedule Follow-up
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50">
              <Link href="/ai-assistant">
                <User size={16} />
                Discuss with AI Assistant
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}