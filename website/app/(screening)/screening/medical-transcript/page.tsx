'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, RefreshCw, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useScreeningStore } from '@/lib/store'

export default function MedicalTranscriptAnalysis() {
  const router = useRouter()
  const { updateScreeningData } = useScreeningStore()
  const [transcript, setTranscript] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setError('Please paste your medical transcript.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      // This is a mock API call. Replace with your actual API endpoint.
      const response = await new Promise<any>((resolve) =>
        setTimeout(() => {
          resolve({
            analysis: 'The transcript indicates a potential for high blood sugar levels.',
            recommendations: 'Consult a doctor for a blood test.',
          })
        }, 2000)
      )

      setResults(response)
      setShowResults(true)
      updateScreeningData({ medicalTranscript: response })
      
    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze transcript')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetAnalysis = () => {
    setShowResults(false)
    setResults(null)
    setTranscript('')
    setError(null)
  }

  const finishTest = () => {
    router.push('/screening');
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                Medical Transcript Analysis
              </h1>
              <p className="text-white/70 text-lg mt-2">
                AI-powered analysis of your medical transcripts.
              </p>
            </div>
          </div>
        </motion.div>

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
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Paste your transcript below</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none min-h-[200px]"
                  placeholder="Paste your medical transcript here..."
                />
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8 py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Analyze Transcript
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <CardTitle className="text-white">Analysis Complete</CardTitle>
                  </div>
                  <Button
                    onClick={resetAnalysis}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    New Analysis
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {results && (
                  <>
                    <div className="bg-white/5 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Analysis</h3>
                      <p className="text-white/80">{results.analysis}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-blue-300 font-semibold mb-2">Recommendations</h4>
                      <p className="text-sm text-blue-200/80">{results.recommendations}</p>
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
          </motion.div>
        )}
      </div>

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