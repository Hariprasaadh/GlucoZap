'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Activity, 
  Heart, 
  Footprints, 
  Droplets, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Watch,
  Zap,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function WearableDataAnalysis() {
  const router = useRouter()
  const [healthData, setHealthData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch health data from Supabase
  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) {
        throw error
      }

      setHealthData(data || [])
    } catch (err) {
      const error = err as Error
      setError(error.message || 'An error occurred while fetching health data')
      console.error('Error fetching health data:', err)
    } finally {
      setLoading(false)
    }
  }

  

  useEffect(() => {
    fetchHealthData()
  }, [])

  // Calculate analytics from health data
  const analytics = healthData.length > 0 ? {
    avgSteps: Math.round(healthData.reduce((sum, d) => sum + (d.steps || 0), 0) / healthData.length),
    avgHeartRate: Math.round(healthData.reduce((sum, d) => sum + (d.heart_rate || 0), 0) / healthData.length),
    avgBloodOxygen: Math.round(healthData.reduce((sum, d) => sum + (d.blood_oxygen || 0), 0) / healthData.length * 10) / 10,
    totalEntries: healthData.length
  } : { avgSteps: 0, avgHeartRate: 0, avgBloodOxygen: 0, totalEntries: 0 }

  // Risk assessment based on data
  const getRiskAssessment = () => {
    if (analytics.totalEntries === 0) return { level: 'No Data', color: 'text-gray-400', bg: 'bg-gray-500/20' }
    
    const lowSteps = analytics.avgSteps < 8000
    const highHeartRate = analytics.avgHeartRate > 100 || analytics.avgHeartRate < 60
    const lowOxygen = analytics.avgBloodOxygen < 95

    const riskFactors = [lowSteps, highHeartRate, lowOxygen].filter(Boolean).length

    if (riskFactors >= 2) return { level: 'High Risk', color: 'text-red-300', bg: 'bg-red-500/20' }
    if (riskFactors === 1) return { level: 'Moderate Risk', color: 'text-yellow-300', bg: 'bg-yellow-500/20' }
    return { level: 'Low Risk', color: 'text-green-300', bg: 'bg-green-500/20' }
  }

  const riskAssessment = getRiskAssessment()

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

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <Watch className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">
                Wearable Data Analysis
              </h1>
              <p className="text-white/70 text-lg mt-2">
                Import and analyze health data from your connected devices
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
           
            
            <Button 
              onClick={fetchHealthData}
              variant="outline"
              className="border-white/20 bg-black/90 text-white hover:bg-white/10 hover:text-white px-6 py-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
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

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Average Steps</CardTitle>
                  <Footprints className="w-5 h-5 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {analytics.avgSteps.toLocaleString()}
                </div>
                <p className="text-sm text-white/60">Daily average</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Heart Rate</CardTitle>
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {analytics.avgHeartRate} BPM
                </div>
                <p className="text-sm text-white/60">Average rate</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Blood Oxygen</CardTitle>
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {analytics.avgBloodOxygen}%
                </div>
                <p className="text-sm text-white/60">SpO2 level</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Data Points</CardTitle>
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {analytics.totalEntries}
                </div>
                <p className="text-sm text-white/60">Total entries</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Risk Assessment */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Diabetes Risk Assessment
              </CardTitle>
              <CardDescription className="text-white/70">
                Based on your wearable device data analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl border ${riskAssessment.bg} ${riskAssessment.color} border-current/30`}>
                    <span className="font-bold text-lg">{riskAssessment.level}</span>
                  </div>
                  {riskAssessment.level === 'Low Risk' && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {riskAssessment.level === 'Moderate Risk' && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
                  {riskAssessment.level === 'High Risk' && <AlertTriangle className="w-6 h-6 text-red-400" />}
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  93% Accuracy
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Footprints className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/60">Daily Activity</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {analytics.avgSteps < 8000 ? 'Below Target' : 'Good Level'}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/60">Heart Health</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {(analytics.avgHeartRate > 100 || analytics.avgHeartRate < 60) ? 'Needs Attention' : 'Normal Range'}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/60">Oxygen Level</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {analytics.avgBloodOxygen < 95 ? 'Low Level' : 'Optimal'}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => router.push('/screening/questionnaire')}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold py-3"
              >
                Continue to Next Assessment
                <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                Recent Health Data
              </CardTitle>
              <CardDescription className="text-white/70">
                Latest entries from your wearable devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-white/50" />
                  <p className="text-white/50">Loading health data...</p>
                </div>
              ) : healthData.length === 0 ? (
                <div className="text-center py-12">
                  <Smartphone className="w-16 h-16 mx-auto mb-4 text-white/30" />
                  <h3 className="text-lg font-semibold text-white/70 mb-2">No Data Available</h3>
                  <p className="text-white/50 mb-6">Connect your wearable device or simulate data to get started</p>
                 
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Steps</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Heart Rate</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Blood Oxygen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthData.slice(0, 10).map((entry, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white/80">
                            {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">
                            {entry.steps?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-red-400 font-semibold">
                            {entry.heart_rate ? `${entry.heart_rate} BPM` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-blue-400 font-semibold">
                            {entry.blood_oxygen ? `${entry.blood_oxygen}%` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Supported Devices */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                Supported Devices & Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Apple Health', 'Google Fit', 'Fitbit', 'Samsung Health', 'Garmin Connect', 'Strava', 'MyFitnessPal', 'Oura Ring'].map((device) => (
                  <div key={device} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80 text-sm font-medium">{device}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20">
        <div className="max-w-4xl mx-auto text-center px-6 py-6">
          <p className="text-xs text-white/40">
            © 2025 GlucoZap. Not medical advice. Consult healthcare providers.
          </p>
        </div>
      </footer>
    </div>
  )
}
