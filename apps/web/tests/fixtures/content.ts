import { testUsers } from './users';

/**
 * Test content fixtures
 */
export const testContent = {
  aliceNote1: {
    id: 'content-alice-note-1',
    userId: testUsers.alice.id,
    type: 'note' as const,
    title: 'Meeting Notes - Q1 Planning',
    body: 'Discussed quarterly goals and project timelines. Key focus areas: product launch, team expansion, and customer feedback integration.',
    url: null,
    metadata: null,
    tags: ['work', 'planning', 'q1'],
    autoTags: ['meeting', 'strategy', 'goals'],
  },
  aliceLink1: {
    id: 'content-alice-link-1',
    userId: testUsers.alice.id,
    type: 'link' as const,
    title: 'React 19 Release Notes',
    body: 'New features and improvements in React 19',
    url: 'https://react.dev/blog/2024/12/05/react-19',
    metadata: { domain: 'react.dev', favicon: 'https://react.dev/favicon.ico' },
    tags: ['react', 'frontend', 'javascript'],
    autoTags: ['web-development', 'framework', 'update'],
  },
  bobNote1: {
    id: 'content-bob-note-1',
    userId: testUsers.bob.id,
    type: 'note' as const,
    title: 'Recipe: Chocolate Chip Cookies',
    body: 'Ingredients: flour, butter, sugar, chocolate chips. Preheat oven to 350°F. Mix ingredients and bake for 12 minutes.',
    url: null,
    metadata: null,
    tags: ['recipe', 'baking', 'dessert'],
    autoTags: ['cooking', 'food', 'sweet'],
  },
  charlieNote1: {
    id: 'content-charlie-note-1',
    userId: testUsers.charlie.id,
    type: 'note' as const,
    title: 'Book Summary: Atomic Habits',
    body: 'Key takeaways: 1% improvements compound over time. Focus on systems not goals. Make habits obvious, attractive, easy, and satisfying.',
    url: null,
    metadata: null,
    tags: ['books', 'productivity', 'habits'],
    autoTags: ['self-improvement', 'reading', 'personal-development'],
  },
};

export type TestContent = typeof testContent.aliceNote1;
