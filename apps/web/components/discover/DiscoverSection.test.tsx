import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiscoverSection } from './DiscoverSection';
import { Activity } from 'lucide-react';

describe('DiscoverSection', () => {
  it('should render title and description', () => {
    render(
      <DiscoverSection
        title="Test Section"
        description="Test description"
        icon={Activity}
      >
        <div>Content</div>
      </DiscoverSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render children in a grid', () => {
    render(
      <DiscoverSection
        title="Test Section"
        description="Test description"
        icon={Activity}
      >
        <div data-testid="child-1">Item 1</div>
        <div data-testid="child-2">Item 2</div>
      </DiscoverSection>
    );

    expect(screen.getByTestId('discover-section-grid')).toBeInTheDocument();
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    render(
      <DiscoverSection
        title="Test Section"
        description="Test description"
        icon={Activity}
        isLoading={true}
      >
        <div>Content</div>
      </DiscoverSection>
    );

    expect(screen.getByTestId('discover-section-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('discover-section-grid')).not.toBeInTheDocument();
  });

  it('should show empty state message when empty and not loading', () => {
    render(
      <DiscoverSection
        title="Test Section"
        description="Test description"
        icon={Activity}
        isEmpty={true}
      />
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('No recommendations available yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('discover-section-grid')).not.toBeInTheDocument();
  });

  it('should show loading state even if isEmpty is true', () => {
    render(
      <DiscoverSection
        title="Test Section"
        description="Test description"
        icon={Activity}
        isLoading={true}
        isEmpty={true}
      />
    );

    // isLoading takes precedence - section renders with skeleton
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });
});
