import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingFlow from './OnboardingFlow';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock onboarding server actions
const mockUpdateOnboardingStep = vi.fn().mockResolvedValue({ success: true });
const mockCompleteOnboarding = vi.fn().mockResolvedValue({ success: true });
const mockSkipOnboarding = vi.fn().mockResolvedValue({ success: true });
const mockSeedSampleContent = vi.fn().mockResolvedValue({ success: true, seeded: 0 });

vi.mock('@/app/actions/onboarding', () => ({
  updateOnboardingStep: (...args: any[]) => mockUpdateOnboardingStep(...args),
  completeOnboarding: (...args: any[]) => mockCompleteOnboarding(...args),
  skipOnboarding: (...args: any[]) => mockSkipOnboarding(...args),
  seedSampleContent: (...args: any[]) => mockSeedSampleContent(...args),
}));

// Mock child step components
vi.mock('./ProgressBar', () => ({
  default: ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div data-testid="progress-bar">Step {currentStep + 1} of {totalSteps}</div>
  ),
}));

vi.mock('./WelcomeStep', () => ({
  default: () => <div data-testid="welcome-step">Welcome Step</div>,
}));

vi.mock('./CreateContentStep', () => ({
  default: () => <div data-testid="create-content-step">Create Content Step</div>,
}));

vi.mock('./ExploreStep', () => ({
  default: () => <div data-testid="explore-step">Explore Step</div>,
}));

// Mock @/app/actions/content (needed by CreateContentStep even though it's mocked)
vi.mock('@/app/actions/content', () => ({
  createContentAction: vi.fn(),
}));

describe('OnboardingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render at step 0 when initialStep is 0', () => {
      render(<OnboardingFlow initialStep={0} />);

      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
      expect(screen.queryByTestId('create-content-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('explore-step')).not.toBeInTheDocument();
    });

    it('should render the progress bar', () => {
      render(<OnboardingFlow initialStep={0} />);

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('should render Back, Skip, and Next buttons', () => {
      render(<OnboardingFlow initialStep={0} />);

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Skip onboarding')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should start at correct step when initialStep prop is provided', () => {
      render(<OnboardingFlow initialStep={1} />);

      expect(screen.getByTestId('create-content-step')).toBeInTheDocument();
      expect(screen.queryByTestId('welcome-step')).not.toBeInTheDocument();
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });

    it('should clamp initialStep to max valid step', () => {
      render(<OnboardingFlow initialStep={10} />);

      // Should render last step (step index 2) since TOTAL_STEPS is 3
      expect(screen.getByTestId('explore-step')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should be disabled on first step', () => {
      render(<OnboardingFlow initialStep={0} />);

      const backButton = screen.getByText('Back');
      expect(backButton).toBeDisabled();
    });

    it('should be enabled on steps after the first', () => {
      render(<OnboardingFlow initialStep={1} />);

      const backButton = screen.getByText('Back');
      expect(backButton).not.toBeDisabled();
    });

    it('should go back to previous step on click', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow initialStep={1} />);

      expect(screen.getByTestId('create-content-step')).toBeInTheDocument();

      await user.click(screen.getByText('Back'));

      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
      expect(mockUpdateOnboardingStep).toHaveBeenCalledWith(0);
    });
  });

  describe('Next Button', () => {
    it('should advance to next step on click', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow initialStep={0} />);

      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();

      await user.click(screen.getByText('Next'));

      expect(screen.getByTestId('create-content-step')).toBeInTheDocument();
      expect(mockUpdateOnboardingStep).toHaveBeenCalledWith(1);
    });

    it('should show "Get Started" on the last step', () => {
      render(<OnboardingFlow initialStep={2} />);

      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should call completeOnboarding and redirect on last step click', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow initialStep={2} />);

      await user.click(screen.getByText('Get Started'));

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockSeedSampleContent).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Skip Button', () => {
    it('should call skipOnboarding and redirect on click', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow initialStep={0} />);

      await user.click(screen.getByText('Skip onboarding'));

      await waitFor(() => {
        expect(mockSkipOnboarding).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockSeedSampleContent).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Step Rendering', () => {
    it('should render WelcomeStep at step 0', () => {
      render(<OnboardingFlow initialStep={0} />);
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
    });

    it('should render CreateContentStep at step 1', () => {
      render(<OnboardingFlow initialStep={1} />);
      expect(screen.getByTestId('create-content-step')).toBeInTheDocument();
    });

    it('should render ExploreStep at step 2', () => {
      render(<OnboardingFlow initialStep={2} />);
      expect(screen.getByTestId('explore-step')).toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    it('should show correct step number at each step', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow initialStep={0} />);

      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();

      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });
  });
});
