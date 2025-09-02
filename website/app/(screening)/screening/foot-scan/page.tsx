'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import CameraCapture  from '@/components/screening/CameraCapture'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FootAnalysis() {
  const [capturedImages, setCapturedImages] = useState<{ [key: string]: string }>({})
  const [currentView, setCurrentView] = useState<'instructions' | 'camera'>('instructions')
  const [captureType, setCaptureType] = useState<string>('')

  const captureViews = [
    { id: 'left-top', label: 'Left Foot Top', description: 'Capture the top of your left foot' },
    { id: 'left-bottom', label: 'Left Foot Bottom', description: 'Capture the bottom of your left foot' },
    { id: 'right-top', label: 'Right Foot Top', description: 'Capture the top of your right foot' },
    { id: 'right-bottom', label: 'Right Foot Bottom', description: 'Capture the bottom of your right foot' },
  ]

  const handleCapture = (imageData: string, type: string) => {
    setCapturedImages(prev => ({ ...prev, [type]: imageData }))
    setCurrentView('instructions')
  }

  const handleStartCapture = (type: string) => {
    setCaptureType(type)
    setCurrentView('camera')
  }

  const allCaptured = captureViews.every(view => capturedImages[view.id])

  return (
    <div className="container mx-auto py-8 text-white">
      {currentView === 'instructions' ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Foot Health Assessment</h1>
          <p className="text-gray-400 mb-8">
            We'll analyze your feet for early signs of diabetic complications like ulcers, poor circulation, or nerve damage.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {captureViews.map(view => (
              <Card key={view.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{view.label}</CardTitle>
                  <CardDescription className="text-gray-400">{view.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-700 h-48 mb-4 rounded flex items-center justify-center">
                    {capturedImages[view.id] ? (
                      <img 
                        src={capturedImages[view.id]} 
                        alt={view.label}
                        className="h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-500">No image captured</span>
                    )}
                  </div>
                  <Button 
                    variant={capturedImages[view.id] ? "outline" : "default"}
                    onClick={() => handleStartCapture(view.id)}
                    className="w-full"
                  >
                    {capturedImages[view.id] ? 'Retake' : 'Capture'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-8">
            <h3 className="text-yellow-400 font-medium mb-2">Important Notes</h3>
            <ul className="text-yellow-300 text-sm list-disc list-inside space-y-1">
              <li>Ensure good lighting for clear images</li>
              <li>Clean your feet before taking photos</li>
              <li>Check for any cuts, blisters, or redness</li>
              <li>This screening does not replace professional medical examination</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button 
              onClick={() => console.log('Foot analysis complete', { images: capturedImages })} 
              disabled={!allCaptured}
            >
              Analyze Foot Health
            </Button>
          </div>
        </>
      ) : (
        <CameraCapture
          type={captureType}
          onCapture={(imageData) => handleCapture(imageData, captureType)}
          onCancel={() => setCurrentView('instructions')}
          instructions={
            captureViews.find(v => v.id === captureType)?.description || 
            'Position your foot in the frame'
          }
        />
      )}
    </div>
  )
}