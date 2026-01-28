'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from './ProgressBar';
import WelcomeStep from './WelcomeStep';
import CreateContentStep from './CreateContentStep';
import ExploreStep from './ExploreStep';
import { updateOnboardingStep, completeOnboarding, skipOnboarding } from '@/app/actions/onboarding';

const TOTAL_STEPS = 3;

interface OnboardingFlowProps {
  initialStep: number;
}

export default function OnboardingFlow({ initialStep }: OnboardingFlowProps) {
  const [step, setStep] = useState(Math.min(initialStep, TOTAL_STEPS - 1));
  const router = useRouter();

  async function goNext() {
    if (step < TOTAL_STEPS - 1) {
      const next = step + 1;
      setStep(next);
      await updateOnboardingStep(next);
    } else {
      await completeOnboarding();
      router.push('/dashboard');
    }
  }

  async function goBack() {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      await updateOnboardingStep(prev);
    }
  }

  async function handleSkip() {
    await skipOnboarding();
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
          </div>

          <div className="mb-8">
            {step === 0 && <WelcomeStep />}
            {step === 1 && <CreateContentStep />}
            {step === 2 && <ExploreStep />}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip onboarding
            </button>

            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {step === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
