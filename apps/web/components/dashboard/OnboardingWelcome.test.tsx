import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingWelcome } from './OnboardingWelcome';

describe('OnboardingWelcome', () => {
  it('renders the hero heading and description', () => {
    render(<OnboardingWelcome />);
    expect(screen.getByText(/Let.*s build your knowledge hub/)).toBeInTheDocument();
    expect(
      screen.getByText(/Start by capturing your first piece of knowledge/)
    ).toBeInTheDocument();
  });

  it('renders all four action cards', () => {
    render(<OnboardingWelcome />);
    expect(screen.getByText('Capture a Note')).toBeInTheDocument();
    expect(screen.getByText('Save a Link')).toBeInTheDocument();
    expect(screen.getByText('Import Content')).toBeInTheDocument();
    expect(screen.getByText('Explore Features')).toBeInTheDocument();
  });

  it('links to the correct routes', () => {
    render(<OnboardingWelcome />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard/capture');
    expect(hrefs).toContain('/dashboard/import');
    expect(hrefs).toContain('/dashboard/discover');
  });
});
