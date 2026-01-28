'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i < currentStep
              ? 'bg-primary'
              : i === currentStep
                ? 'bg-primary/50'
                : 'bg-muted'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {currentStep + 1} / {totalSteps}
      </span>
    </div>
  );
}
