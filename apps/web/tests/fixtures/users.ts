/**
 * Test user fixtures
 */
export const testUsers = {
  alice: {
    id: 'user-alice-test-id',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    emailVerified: null,
    image: 'https://example.com/alice.jpg',
  },
  bob: {
    id: 'user-bob-test-id',
    name: 'Bob Smith',
    email: 'bob@example.com',
    emailVerified: null,
    image: 'https://example.com/bob.jpg',
  },
  charlie: {
    id: 'user-charlie-test-id',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    emailVerified: new Date('2026-01-01'),
    image: null,
  },
};

export type TestUser = typeof testUsers.alice;
