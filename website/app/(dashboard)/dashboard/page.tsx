'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RiskChart from '@/components/dashboard/RiskChart'
import StatsCards from '@/components/dashboard/StatsCards'

// Mock data - would come from API in real implementation
const mockData = {
  riskScore: 42,
  riskLevel: 'Moderate',
  lastScreening: '2023-10-15',
  recommendations: [
    'Consider dietary changes to reduce sugar intake',
    'Increase physical activity to 150 minutes per week',
    'Schedule follow-up screening in 3 months'
  ],
  history: [
    { date: '2023-10-15', score: 42 },
    { date: '2023-07-10', score: 38 },
    { date: '2023-04-05', score: 45 },
  ]
}

export default function Dashboard() {
  const [data, setData] = useState(mockData)

  // In a real app, we would fetch this data from an API
  useEffect(() => {
    // fetchUserData()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/screening">New Assessment</Link>
        </Button>
      </div>

      <StatsCards 
        riskScore={data.riskScore} 
        riskLevel={data.riskLevel} 
        lastScreening={data.lastScreening} 
      />

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend</CardTitle>
            <CardDescription>Your diabetes risk over time</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskChart data={data.history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Personalized health suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your screening history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Risk Score</th>
                  <th className="text-left p-4">Level</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">{item.score}/100</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.score < 30 ? 'bg-green-100 text-green-800' :
                        item.score < 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.score < 30 ? 'Low' : item.score < 70 ? 'Moderate' : 'High'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/reports/${index}`}>View Details</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}