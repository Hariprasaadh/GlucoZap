'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import Vapi from '@vapi-ai/web'

// Individual Report Component (for dynamic routing)
export default function IndividualReportPage() {
  const params = useParams()
  const reportId = params.id

  // This would fetch specific report data based on the ID
  // For now, redirecting to main report page
  useEffect(() => {
    // In a real app, you'd fetch the specific report here
    // For now, we'll redirect to the main report page
    window.location.href = '/report'
  }, [reportId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading report...</p>
      </div>
    </div>
  )
}
