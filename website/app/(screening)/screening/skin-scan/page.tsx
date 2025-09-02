"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/screening/CameraCapture";
import ProgressTracker from "@/components/screening/ProgressTracker";
import ActionButton from "@/components/shared/ActionButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SkinScanPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setStep(2);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    try {
      // TODO: Call API to analyze skin image
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
      setStep(3);
    } catch (error) {
      console.error("Failed to analyze image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      handleAnalyze();
    } else if (step === 3) {
      router.push("/screening/results");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Skin Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Position your skin in the camera frame and take a clear photo.
              </p>
              <CameraCapture 
                onCapture={handleCapture}
                onCancel={() => router.push("/screening")}
                type="skin"
                instructions="Position your skin in the camera frame and take a clear photo."
              />
            </div>
          )}

          {step === 2 && capturedImage && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Review your image and proceed with analysis.
              </p>
              <img 
                src={capturedImage} 
                alt="Captured skin" 
                className="w-full rounded-lg"
              />
              <ActionButton
                onClick={handleAnalyze}
                isLoading={isProcessing}
                loadingText="Analyzing..."
                className="w-full"
              >
                Analyze Image
              </ActionButton>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">
                Analysis complete! Click next to see your results.
              </p>
            </div>
          )}

          <ProgressTracker
            currentStep={step}
            totalSteps={3}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isProcessing}
          />
        </CardContent>
      </Card>
    </div>
  );
}
