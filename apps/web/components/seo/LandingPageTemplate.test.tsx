import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPageTemplate } from './LandingPageTemplate';

const mockData = {
  hero: {
    title: 'AI Note Taking App',
    subtitle: 'Capture and organize with AI',
    cta: { text: 'Start Free', href: '/login' },
  },
  problem: {
    title: 'The problem with manual note taking',
    paragraphs: ['Notes get lost.', 'Finding them is hard.'],
  },
  solution: {
    title: 'Mindweave solves this',
    description: 'AI auto-tags and organizes everything.',
  },
  features: [
    { icon: 'Sparkles', title: 'AI Tagging', description: 'Auto-tag with Gemini' },
    { icon: 'Search', title: 'Semantic Search', description: 'Search by meaning' },
  ],
  socialProof: {
    githubStars: 4,
    testCount: '2,675+',
  },
};

describe('LandingPageTemplate', () => {
  it('should render the hero title', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Note Taking App');
  });

  it('should render the CTA button', () => {
    render(<LandingPageTemplate data={mockData} />);
    const ctaLinks = screen.getAllByRole('link', { name: /start free/i });
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
    expect(ctaLinks[0]).toHaveAttribute('href', '/login');
  });

  it('should render problem section', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByText('The problem with manual note taking')).toBeInTheDocument();
    expect(screen.getByText('Notes get lost.')).toBeInTheDocument();
  });

  it('should render feature cards', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByText('AI Tagging')).toBeInTheDocument();
    expect(screen.getByText('Semantic Search')).toBeInTheDocument();
  });

  it('should render social proof', () => {
    render(<LandingPageTemplate data={mockData} />);
    expect(screen.getByText(/2,675\+/)).toBeInTheDocument();
  });
});
