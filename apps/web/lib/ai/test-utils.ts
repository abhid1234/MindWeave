import { vi } from 'vitest';

export const createMockGoogleGenerativeAI = (responseText = 'Mocked AI response') => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => responseText,
    },
  });

  return {
    GoogleGenerativeAI: class MockGoogleGenerativeAI {
      getGenerativeModel() {
        return { generateContent: mockGenerateContent };
      }
    },
  };
};
