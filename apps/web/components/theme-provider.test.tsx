import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should wrap children with NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('should pass correct default props to NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.dataset.props || '{}');

    expect(props.attribute).toBe('class');
    expect(props.defaultTheme).toBe('system');
    expect(props.enableSystem).toBe(true);
    expect(props.storageKey).toBe('mindweave-theme');
  });

  it('should allow overriding props', () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="custom-key">
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.dataset.props || '{}');

    expect(props.defaultTheme).toBe('dark');
    expect(props.storageKey).toBe('custom-key');
  });
});
