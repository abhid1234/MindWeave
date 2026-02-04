import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsHeader } from './AnalyticsHeader';

describe('AnalyticsHeader', () => {
  it('renders the heading and description', () => {
    render(<AnalyticsHeader />);

    expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByText(/insights and statistics/i)).toBeInTheDocument();
  });

  it('renders filter and export buttons', () => {
    render(<AnalyticsHeader />);

    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('toggles filter panel when filter button is clicked', async () => {
    const user = userEvent.setup();
    render(<AnalyticsHeader />);

    // Filters should be hidden initially
    expect(screen.queryByText(/date range/i)).not.toBeInTheDocument();

    // Click filter button
    await user.click(screen.getByRole('button', { name: /filters/i }));

    // Filters should now be visible
    expect(screen.getByText(/date range/i)).toBeInTheDocument();
    expect(screen.getByText(/content type/i)).toBeInTheDocument();
  });

  it('shows date range options when filters are expanded', async () => {
    const user = userEvent.setup();
    render(<AnalyticsHeader />);

    await user.click(screen.getByRole('button', { name: /filters/i }));

    expect(screen.getByRole('button', { name: /7 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all time/i })).toBeInTheDocument();
  });

  it('shows content type options when filters are expanded', async () => {
    const user = userEvent.setup();
    render(<AnalyticsHeader />);

    await user.click(screen.getByRole('button', { name: /filters/i }));

    expect(screen.getByRole('button', { name: /all types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /links/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /files/i })).toBeInTheDocument();
  });

  it('calls onDateRangeChange when date range is selected', async () => {
    const user = userEvent.setup();
    const onDateRangeChange = vi.fn();
    render(<AnalyticsHeader onDateRangeChange={onDateRangeChange} />);

    await user.click(screen.getByRole('button', { name: /filters/i }));
    await user.click(screen.getByRole('button', { name: /7 days/i }));

    expect(onDateRangeChange).toHaveBeenCalledWith('week');
  });

  it('calls onContentTypeChange when content type is selected', async () => {
    const user = userEvent.setup();
    const onContentTypeChange = vi.fn();
    render(<AnalyticsHeader onContentTypeChange={onContentTypeChange} />);

    await user.click(screen.getByRole('button', { name: /filters/i }));
    await user.click(screen.getByRole('button', { name: /notes/i }));

    expect(onContentTypeChange).toHaveBeenCalledWith('note');
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<AnalyticsHeader onExport={onExport} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(onExport).toHaveBeenCalled();
  });

  it('disables export button when isExporting is true', () => {
    render(<AnalyticsHeader onExport={vi.fn()} isExporting={true} />);

    const exportButton = screen.getByRole('button', { name: /exporting/i });
    expect(exportButton).toBeDisabled();
  });

  it('shows filter count badge when filters are active', async () => {
    const user = userEvent.setup();
    render(<AnalyticsHeader />);

    await user.click(screen.getByRole('button', { name: /filters/i }));
    await user.click(screen.getByRole('button', { name: /7 days/i }));

    // Check for badge showing 1 active filter
    const filterButton = screen.getByRole('button', { name: /filters/i });
    expect(filterButton.querySelector('span')).toHaveTextContent('1');
  });

  it('shows correct filter count for multiple filters', async () => {
    const user = userEvent.setup();
    render(<AnalyticsHeader />);

    await user.click(screen.getByRole('button', { name: /filters/i }));
    await user.click(screen.getByRole('button', { name: /7 days/i }));
    await user.click(screen.getByRole('button', { name: /notes/i }));

    // Check for badge showing 2 active filters
    const filterButton = screen.getByRole('button', { name: /filters/i });
    expect(filterButton.querySelector('span')).toHaveTextContent('2');
  });
});
