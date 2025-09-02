'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  File,
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Target,
  Shield,
  Download,
  Eye,
  X,
  Zap,
  Brain,
  Search,
  BarChart3,
  FileImage,
  Table,
  Clock,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface AnalysisResults {
  status: string
  timestamp: string
  document_info: {
    filename: string
    size_bytes: number
    format: string
  }
  extraction_results: {
    total_chunks: number
    text_sections: number
    tables_found: number
    images_found: number
  }
  analysis_report?: {
    executive_summary: string
    document_statistics: any
    key_findings: string[]
    medical_terms_detected: string[]
    detailed_analysis: {
      text_analysis: any[]
      table_analysis: any[]
      image_analysis: any[]
    }
    recommendations: string[]
  }
  raw_data?: {
    text_content: Array<{
      text: string
      metadata: any
    }>
    tables: Array<{
      content: string
      metadata: any
    }>
    images: Array<{
      image_id: number
      base64: string | null
      size: number
    }>
  }
}

export default function MedicalDocumentAnalysis() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisType, setAnalysisType] = useState<'full' | 'quick'>('full')
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Supported file formats
  const supportedFormats = ['.pdf', '.docx', '.txt', '.html']
  const maxFileSize = 50 * 1024 * 1024 // 50MB

  const handleFileSelect = (file: File) => {
    // Validate file type
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!supportedFormats.includes(fileExt)) {
      setError(`Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`)
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }, [])

  const analyzeDocument = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Determine endpoint based on analysis type
      const endpoint = analysisType === 'full' ? '/analyze' : '/quick-extract'
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`http://172.16.45.171:8003${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setResults(result)
      setShowResults(true)
      
    } catch (error) {
      console.error('Document analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze document')
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(0)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setResults(null)
    setShowResults(false)
    setError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-400" />
      case 'docx': case 'doc': return <FileText className="w-8 h-8 text-blue-400" />
      case 'txt': return <File className="w-8 h-8 text-gray-400" />
      case 'html': return <FileText className="w-8 h-8 text-orange-400" />
      default: return <File className="w-8 h-8 text-gray-400" />
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
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                Medical Document Analysis
              </h1>
              <p className="text-white/70 text-lg mt-2">
                AI-powered extraction and analysis of medical documents
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-semibold text-white">Smart Extraction</h3>
                  <p className="text-sm text-white/60">Text, tables, and images</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">AI Analysis</h3>
                  <p className="text-sm text-white/60">Medical insights & summaries</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-white">Comprehensive Reports</h3>
                  <p className="text-sm text-white/60">Detailed medical findings</p>
                </div>
              </div>
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
            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Analysis Type Selection */}
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Analysis Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setAnalysisType('full')}
                      className={`p-4 rounded-lg border transition-all ${
                        analysisType === 'full'
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Brain className="w-5 h-5" />
                        <span className="font-semibold">Full AI Analysis</span>
                      </div>
                      <p className="text-sm opacity-80">Complete analysis with AI summaries and insights</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>2-5 minutes</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setAnalysisType('quick')}
                      className={`p-4 rounded-lg border transition-all ${
                        analysisType === 'quick'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5" />
                        <span className="font-semibold">Quick Extract</span>
                      </div>
                      <p className="text-sm opacity-80">Fast extraction without AI analysis</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>30-60 seconds</span>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Area */}
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Medical Document
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Supported formats: PDF, DOCX, TXT, HTML (Max: 50MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedFile ? (
                    <div
                      ref={dropZoneRef}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                        dragOver 
                          ? 'border-indigo-400 bg-indigo-500/10' 
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      <Upload className="w-16 h-16 mx-auto mb-6 text-white/40" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Drop your medical document here
                      </h3>
                      <p className="text-white/60 mb-6">
                        or click to browse files
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Select Document
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.html"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <div className="flex items-center gap-4">
                        {getFileIcon(selectedFile.name)}
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{selectedFile.name}</h4>
                          <p className="text-white/60 text-sm">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <Button
                          onClick={resetAnalysis}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Upload Progress */}
                      {isAnalyzing && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-white/70 mb-2">
                            <span>Processing document...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2 bg-white/10">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"></div>
                          </Progress>
                        </div>
                      )}
                      
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={analyzeDocument}
                          disabled={isAnalyzing}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold px-8"
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              {analysisType === 'full' ? 'Analyzing...' : 'Extracting...'}
                            </>
                          ) : (
                            <>
                              {analysisType === 'full' ? (
                                <Brain className="w-5 h-5 mr-2" />
                              ) : (
                                <Zap className="w-5 h-5 mr-2" />
                              )}
                              {analysisType === 'full' ? 'Start AI Analysis' : 'Quick Extract'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Supported Formats Info */}
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Supported Document Types</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="text-white/70 text-sm">PDF Documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-white/70 text-sm">Word Documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-400" />
                      <span className="text-white/70 text-sm">Text Files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span className="text-white/70 text-sm">HTML Files</span>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs mt-4">
                    Maximum file size: 50MB. Processing time varies based on document complexity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          /* Results Display */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {results && (
              <>
                {/* Header with Document Info */}
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <div>
                          <CardTitle className="text-white">Analysis Complete</CardTitle>
                          <CardDescription className="text-white/60">
                            {results.document_info.filename} • {formatFileSize(results.document_info.size_bytes)}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        onClick={resetAnalysis}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Upload New Document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <FileText className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                        <div className="text-2xl font-bold text-white">{results.extraction_results.text_sections}</div>
                        <div className="text-sm text-blue-300">Text Sections</div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <Table className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <div className="text-2xl font-bold text-white">{results.extraction_results.tables_found}</div>
                        <div className="text-sm text-green-300">Tables</div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                        <FileImage className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                        <div className="text-2xl font-bold text-white">{results.extraction_results.images_found}</div>
                        <div className="text-sm text-purple-300">Images</div>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                        <BarChart3 className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                        <div className="text-2xl font-bold text-white">{results.extraction_results.total_chunks}</div>
                        <div className="text-sm text-orange-300">Total Chunks</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Executive Summary (only for full analysis) */}
                {results.analysis_report && (
                  <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-400" />
                        <CardTitle className="text-white">Executive Summary</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6">
                        <pre className="text-white/90 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                          {results.analysis_report.executive_summary}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Key Findings */}
                {results.analysis_report?.key_findings && results.analysis_report.key_findings.length > 0 && (
                  <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 text-red-400" />
                        <CardTitle className="text-white">Key Medical Findings</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.analysis_report.key_findings.map((finding, index) => (
                          <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30">
                                {index + 1}
                              </Badge>
                              <p className="text-white/90 text-sm leading-relaxed">{finding}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Medical Terms Detected */}
                {results.analysis_report?.medical_terms_detected && results.analysis_report.medical_terms_detected.length > 0 && (
                  <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Search className="w-6 h-6 text-cyan-400" />
                        <CardTitle className="text-white">Medical Terms Detected</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {results.analysis_report.medical_terms_detected.map((term, index) => (
                          <Badge 
                            key={index}
                            className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                          >
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Analysis */}
                {results.analysis_report?.detailed_analysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Text Analysis */}
                    {results.analysis_report.detailed_analysis.text_analysis && results.analysis_report.detailed_analysis.text_analysis.length > 0 && (
                      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <CardTitle className="text-white text-lg">Text Analysis</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="max-h-96 overflow-y-auto">
                          <div className="space-y-4">
                            {results.analysis_report.detailed_analysis.text_analysis.slice(0, 5).map((analysis, index) => (
                              <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h4 className="text-blue-300 font-medium mb-2">Section {index + 1}</h4>
                                <p className="text-white/80 text-sm leading-relaxed">{analysis.summary}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Table Analysis */}
                    {results.analysis_report.detailed_analysis.table_analysis && results.analysis_report.detailed_analysis.table_analysis.length > 0 && (
                      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Table className="w-5 h-5 text-green-400" />
                            <CardTitle className="text-white text-lg">Table Analysis</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="max-h-96 overflow-y-auto">
                          <div className="space-y-4">
                            {results.analysis_report.detailed_analysis.table_analysis.map((analysis, index) => (
                              <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                <h4 className="text-green-300 font-medium mb-2">Table {index + 1}</h4>
                                <p className="text-white/80 text-sm leading-relaxed">{analysis.summary}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Raw Data Preview (for quick extract) */}
                {!results.analysis_report && results.raw_data && (
                  <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-gray-400" />
                        <CardTitle className="text-white">Extracted Content Preview</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Text Content Preview */}
                        {results.raw_data.text_content && results.raw_data.text_content.length > 0 && (
                          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                            <h4 className="text-gray-300 font-medium mb-3">Text Content ({results.raw_data.text_content.length} sections)</h4>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {results.raw_data.text_content.slice(0, 3).map((content, index) => (
                                <div key={index} className="bg-black/20 rounded p-3">
                                  <p className="text-white/70 text-sm leading-relaxed">
                                    {content.text.substring(0, 300)}
                                    {content.text.length > 300 && '...'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tables Preview */}
                        {results.raw_data.tables && results.raw_data.tables.length > 0 && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <h4 className="text-green-300 font-medium mb-2">Tables Extracted: {results.raw_data.tables.length}</h4>
                            <p className="text-white/60 text-sm">Table content available for detailed analysis</p>
                          </div>
                        )}

                        {/* Images Info */}
                        {results.raw_data.images && results.raw_data.images.length > 0 && (
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                            <h4 className="text-purple-300 font-medium mb-2">Images Extracted: {results.raw_data.images.length}</h4>
                            <p className="text-white/60 text-sm">Image data available for analysis</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {results.analysis_report?.recommendations && (
                  <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-green-400" />
                        <CardTitle className="text-white">Recommendations</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.analysis_report.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-white/80 text-sm leading-relaxed">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Processing Info */}
                <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm text-white/50">
                      <span>Processed on {new Date(results.timestamp).toLocaleString()}</span>
                      <span>Analysis Type: {analysisType === 'full' ? 'Full AI Analysis' : 'Quick Extract'}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-6xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. AI-powered document analysis for healthcare professionals. Not for diagnostic purposes.
          </p>
        </div>
      </footer>
    </div>
  )
}
