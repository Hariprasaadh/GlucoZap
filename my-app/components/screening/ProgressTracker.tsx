"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function ProgressTracker({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isLoading = false,
}: ProgressTrackerProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={currentStep === 1 || isLoading}
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Processing...
            </>
          ) : currentStep === totalSteps ? (
            "Complete"
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}
