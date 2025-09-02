'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const screeningSteps = [
  { id: 'questionnaire', title: 'Health Questionnaire', description: 'Lifestyle and family history', duration: 5 },
  { id: 'skin-scan', title: 'Skin Analysis', description: 'Neck and skin fold assessment', duration: 3 },
  { id: 'face-scan', title: 'Facial Analysis', description: 'Facial texture and features', duration: 2 },
  { id: 'foot-scan', title: 'Foot Assessment', description: 'Foot health and wound detection', duration: 3 },
  { id: 'pose-scan', title: 'Body Composition', description: 'Body shape and fat distribution', duration: 2 },
  { id: 'breathing-test', title: 'Breathing Test', description: 'Respiratory pattern analysis', duration: 4 },
]

export default function ScreeningHub() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const startScreening = (stepId: string) => {
    router.push(`/screening/${stepId}`)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Diabetes Risk Assessment</h1>
      <p className="text-gray-600 mb-8">Complete these screening steps to get your personalized risk assessment</p>

      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-gray-600">0% complete</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {screeningSteps.map((step, index) => (
          <Card key={step.id} className={index === 0 ? 'md:col-span-2 border-blue-200' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{step.duration} min</span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startScreening(step.id)}
                className={index === 0 ? 'w-full' : ''}
              >
                {index === 0 ? 'Start Assessment' : 'Start'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}