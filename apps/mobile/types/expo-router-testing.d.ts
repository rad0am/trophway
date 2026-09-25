// expo-router/testing-library registers these Jest matchers at runtime but (as of SDK 57)
// ships no type declarations for them. Kept outside __tests__/ so Jest doesn't treat it
// as a test file.
declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePathname(pathname: string): R;
      toHavePathnameWithParams(pathnameWithParams: string): R;
      toHaveSegments(segments: string[]): R;
      toHaveSearchParams(params: Record<string, string | string[]>): R;
      toHaveRouterState(state: unknown): R;
    }
  }
}

export {};
