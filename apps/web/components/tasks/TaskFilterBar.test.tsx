import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskFilterBar } from './TaskFilterBar';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('TaskFilterBar', () => {
  const mockPush = vi.fn();
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  describe('Rendering', () => {
    it('should render status filter buttons', () => {
      render(<TaskFilterBar />);
      expect(screen.getByText('Status:')).toBeInTheDocument();
      const allButtons = screen.getAllByRole('button', { name: 'All' });
      expect(allButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: 'Todo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'In Progress' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('should render priority filter buttons', () => {
      render(<TaskFilterBar />);
      expect(screen.getByText('Priority:')).toBeInTheDocument();
      const allButtons = screen.getAllByRole('button', { name: 'All' });
      expect(allButtons).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Low' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'High' })).toBeInTheDocument();
    });

    it('should highlight active status filter', () => {
      mockSearchParams.set('status', 'todo');
      render(<TaskFilterBar />);
      const todoButton = screen.getByRole('button', { name: 'Todo' });
      expect(todoButton).toHaveClass('bg-primary');
    });

    it('should highlight active priority filter', () => {
      mockSearchParams.set('priority', 'high');
      render(<TaskFilterBar />);
      const highButton = screen.getByRole('button', { name: 'High' });
      expect(highButton).toHaveClass('bg-primary');
    });
  });

  describe('Interactions', () => {
    it('should set status filter when clicking a status button', () => {
      render(<TaskFilterBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Todo' }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/tasks?status=todo');
    });

    it('should clear status filter when clicking All', () => {
      mockSearchParams.set('status', 'todo');
      render(<TaskFilterBar />);
      const allButtons = screen.getAllByRole('button', { name: 'All' });
      fireEvent.click(allButtons[0]); // first All is for status
      expect(mockPush).toHaveBeenCalledWith('/dashboard/tasks?');
    });

    it('should set priority filter when clicking a priority button', () => {
      render(<TaskFilterBar />);
      fireEvent.click(screen.getByRole('button', { name: 'High' }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/tasks?priority=high');
    });

    it('should preserve status when changing priority', () => {
      mockSearchParams.set('status', 'todo');
      render(<TaskFilterBar />);
      fireEvent.click(screen.getByRole('button', { name: 'High' }));
      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('status=todo');
      expect(calledUrl).toContain('priority=high');
    });

    it('should preserve priority when changing status', () => {
      mockSearchParams.set('priority', 'low');
      render(<TaskFilterBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('priority=low');
      expect(calledUrl).toContain('status=done');
    });
  });
});
