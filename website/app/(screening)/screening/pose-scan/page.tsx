'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import CameraCapture  from '@/components/screening/CameraCapture'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BodyScan() {
  const [capturedImages, setCapturedImages] = useState<{ [key: string]: string }>({})
  const [currentView, setCurrentView] = useState<'instructions' | 'camera'>('instructions')
  const [captureType, setCaptureType] = useState<string>('')

  const captureViews = [
    { id: 'front', label: 'Front View', description: 'Stand straight facing the camera' },
    { id: 'side', label: 'Side View', description: 'Stand with your side to the camera' },
    { id: 'back', label: 'Back View', description: 'Stand with your back to the camera' },
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
          <h1 className="text-3xl font-bold mb-6">Body Composition Analysis</h1>
          <p className="text-gray-400 mb-8">
            We'll analyze your body shape and fat distribution patterns to assess diabetes risk factors.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
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

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button 
              onClick={() => console.log('Body analysis complete', { images: capturedImages })} 
              disabled={!allCaptured}
            >
              Analyze Body Composition
            </Button>
          </div>
        </>
      ) : (
        <CameraCapture
          type={captureType}
          onCapture={(imageData: string) => handleCapture(imageData, captureType)}
          onCancel={() => setCurrentView('instructions')}
          instructions={
            captureViews.find(v => v.id === captureType)?.description || 
            'Position your body in the frame'
          }
        />
      )}
    </div>
  )
}