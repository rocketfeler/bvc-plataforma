/**
 * @vitest/setup
 * Configuración de tests para el frontend
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock para next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock para fetch global
global.fetch = vi.fn();

// Helper para crear fetch mocks
function createFetchMock(data: any, status = 200) {
  (global.fetch as any).mockImplementationOnce(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  );
}
