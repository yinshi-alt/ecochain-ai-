import '@testing-library/jest-dom';

// Mock window.scrollTo for tests
window.scrollTo = jest.fn();

// Mock environment variables
process.env = {
  ...process.env,
  VITE_GEMINI_API_KEY: 'test-api-key',
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
