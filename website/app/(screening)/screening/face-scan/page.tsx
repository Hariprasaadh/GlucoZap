'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import  CameraCapture  from '@/components/screening/CameraCapture'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FacialAnalysis() {
  const [capturedImages, setCapturedImages] = useState<{ [key: string]: string }>({})
  const [currentView, setCurrentView] = useState<'instructions' | 'camera'>('instructions')
  const [captureType, setCaptureType] = useState<string>('')

  const captureViews = [
    { id: 'front-face', label: 'Front View', description: 'Look straight at the camera' },
    { id: 'left-profile', label: 'Left Profile', description: 'Turn your head to the left' },
    { id: 'right-profile', label: 'Right Profile', description: 'Turn your head to the right' },
    { id: 'chin-up', label: 'Chin Up', description: 'Tilt your chin upward slightly' },
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
          <h1 className="text-3xl font-bold mb-6">Facial Analysis</h1>
          <p className="text-gray-400 mb-8">
            We'll analyze your facial features for signs of metabolic stress and other diabetes-related markers.
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

          <div className="mt-8">
            <h2 className="text-xl font-medium mb-4">Analysis Focus Areas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Facial Texture</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Skin Dryness</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Puffiness</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Complexion</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button 
              onClick={() => console.log('Facial analysis complete', { images: capturedImages })} 
              disabled={!allCaptured}
            >
              Analyze Facial Features
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
            'Position your face in the frame'
          }
        />
      )}
    </div>
  )
}