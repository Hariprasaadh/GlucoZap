'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BreathingTest() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        // Here you would send the audio blob to your API for analysis
        console.log('Audio recording complete', audioBlob)
        
        // Simulate analysis completion
        setTimeout(() => {
          setAnalysisComplete(true)
        }, 2000)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Breathing Pattern Analysis</h1>
      <p className="text-gray-400 mb-8">
        We'll analyze your breathing patterns to assess cardio-metabolic stress factors.
        Please breathe normally during the recording.
      </p>

      <div className="max-w-md mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Breathing Test</CardTitle>
            <CardDescription className="text-gray-400">
              Record 30 seconds of your breathing patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {analysisComplete ? (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-green-400 mb-4">Analysis Complete</p>
                <Button onClick={() => setAnalysisComplete(false)}>
                  Test Again
                </Button>
              </>
            ) : isRecording ? (
              <>
                <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <span className="text-white text-2xl">{formatTime(recordingTime)}</span>
                </div>
                <p className="text-red-400 mb-4">Recording in progress...</p>
                <Button onClick={stopRecording} variant="destructive">
                  Stop Recording
                </Button>
              </>
            ) : (
              <>
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                  </svg>
                </div>
                <p className="text-gray-400 mb-4">Click to start recording</p>
                <Button onClick={startRecording}>
                  Start Recording
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Instructions</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Sit in a comfortable position</li>
            <li>Hold your device about 12 inches from your mouth</li>
            <li>Breathe normally during the recording</li>
            <li>The test will take 30 seconds</li>
            <li>Ensure you're in a quiet environment</li>
          </ul>
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button 
            onClick={() => console.log('Proceed to next step')}
            disabled={!analysisComplete}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}