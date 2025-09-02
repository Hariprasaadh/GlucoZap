'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import CameraCapture from '@/components/screening/CameraCapture'

interface SkinAnalysisProps {
  onComplete: (results: any) => void
  onBack: () => void
}

export default function SkinAnalysis({ onComplete, onBack }: SkinAnalysisProps) {
  const [capturedImages, setCapturedImages] = useState<{ [key: string]: string }>({})
  const [currentView, setCurrentView] = useState<'instructions' | 'camera'>('instructions')
  const [captureType, setCaptureType] = useState<string>('')

  const captureViews = [
    { id: 'neck-front', label: 'Front Neck', description: 'Capture the front of your neck area' },
    { id: 'neck-side', label: 'Side Neck', description: 'Capture the side of your neck' },
    { id: 'armpits', label: 'Underarms', description: 'Capture your underarm area' },
    { id: 'knuckles', label: 'Knuckles', description: 'Capture the back of your hand and knuckles' },
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
    <div className="container mx-auto py-8">
      {currentView === 'instructions' ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Skin Analysis</h1>
          <p className="text-gray-600 mb-8">
            We'll analyze your skin for signs of insulin resistance like Acanthosis Nigricans (dark patches).
            Please capture clear photos of the following areas:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {captureViews.map(view => (
              <div key={view.id} className="border rounded-lg p-4 flex flex-col">
                <div className="bg-gray-100 h-48 mb-4 rounded flex items-center justify-center">
                  {capturedImages[view.id] ? (
                    <img 
                      src={capturedImages[view.id]} 
                      alt={view.label}
                      className="h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-gray-400">No image captured</span>
                  )}
                </div>
                <h3 className="font-medium mb-1">{view.label}</h3>
                <p className="text-sm text-gray-600 mb-4">{view.description}</p>
                <Button 
                  variant={capturedImages[view.id] ? "outline" : "default"}
                  onClick={() => handleStartCapture(view.id)}
                >
                  {capturedImages[view.id] ? 'Retake' : 'Capture'}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button 
              onClick={() => onComplete({ images: capturedImages })} 
              disabled={!allCaptured}
            >
              Continue
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
            'Position the area in the frame'
          }
        />
      )}
    </div>
  )
}