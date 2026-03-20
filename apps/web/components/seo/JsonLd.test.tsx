import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JsonLd } from './JsonLd';

describe('JsonLd', () => {
  it('should render a script tag with application/ld+json type', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Test Page',
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('should contain the correct JSON data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      author: { '@type': 'Person', name: 'Test Author' },
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@type']).toBe('Article');
    expect(parsed.headline).toBe('Test Article');
    expect(parsed.author.name).toBe('Test Author');
  });

  it('should handle FAQPage schema', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Mindweave?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An AI knowledge hub.',
          },
        },
      ],
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toHaveLength(1);
  });
});
