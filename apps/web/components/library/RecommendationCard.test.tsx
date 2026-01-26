import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationCard, type RecommendationCardProps } from './RecommendationCard';

describe('RecommendationCard', () => {
  const baseProps: RecommendationCardProps = {
    id: 'rec-1',
    title: 'Test Recommendation',
    type: 'note',
    body: 'This is a test recommendation body',
    tags: ['tag1', 'tag2'],
    similarity: 0.85,
  };

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<RecommendationCard {...baseProps} />);
      expect(screen.getByText('Test Recommendation')).toBeInTheDocument();
    });

    it('should render the similarity percentage', () => {
      render(<RecommendationCard {...baseProps} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should render the body when provided', () => {
      render(<RecommendationCard {...baseProps} />);
      expect(screen.getByText('This is a test recommendation body')).toBeInTheDocument();
    });

    it('should not render body when null', () => {
      render(<RecommendationCard {...baseProps} body={null} />);
      expect(screen.queryByText('This is a test recommendation body')).not.toBeInTheDocument();
    });

    it('should render tags', () => {
      render(<RecommendationCard {...baseProps} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should limit visible tags to 3', () => {
      render(<RecommendationCard {...baseProps} tags={['tag1', 'tag2', 'tag3', 'tag4', 'tag5']} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not render tag overflow indicator when 3 or fewer tags', () => {
      render(<RecommendationCard {...baseProps} tags={['tag1', 'tag2', 'tag3']} />);
      expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
    });

    it('should render with empty tags array', () => {
      render(<RecommendationCard {...baseProps} tags={[]} />);
      expect(screen.getByText('Test Recommendation')).toBeInTheDocument();
    });
  });

  describe('Content types', () => {
    it('should render note type icon', () => {
      render(<RecommendationCard {...baseProps} type="note" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'View Test Recommendation, 85% similar');
    });

    it('should render link type icon', () => {
      render(<RecommendationCard {...baseProps} type="link" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render file type icon', () => {
      render(<RecommendationCard {...baseProps} type="file" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Similarity formatting', () => {
    it('should format 0.85 as 85%', () => {
      render(<RecommendationCard {...baseProps} similarity={0.85} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should format 0.923 as 92%', () => {
      render(<RecommendationCard {...baseProps} similarity={0.923} />);
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('should format 1.0 as 100%', () => {
      render(<RecommendationCard {...baseProps} similarity={1.0} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should format 0.5 as 50%', () => {
      render(<RecommendationCard {...baseProps} similarity={0.5} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<RecommendationCard {...baseProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', async () => {
      const user = userEvent.setup();
      render(<RecommendationCard {...baseProps} />);

      await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<RecommendationCard {...baseProps} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'View Test Recommendation, 85% similar'
      );
    });

    it('should have test id with content id', () => {
      render(<RecommendationCard {...baseProps} />);
      expect(screen.getByTestId('recommendation-card-rec-1')).toBeInTheDocument();
    });

    it('should be keyboard focusable', () => {
      render(<RecommendationCard {...baseProps} />);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('tabIndex', '-1');
    });
  });
});
