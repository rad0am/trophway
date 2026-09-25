import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

// Render the real route tree (resolved from the package root, where Jest runs).
// Tests live outside src/app because Expo Router treats every file under app/ as a route.
const APP_DIR = './src/app';

describe('app shell routes', () => {
  it('renders the home screen at the root route', () => {
    renderRouter(APP_DIR, { initialUrl: '/' });

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Trophway')).toBeOnTheScreen();
  });

  it('renders the not-found screen for an unknown route', () => {
    renderRouter(APP_DIR, { initialUrl: '/does-not-exist' });

    expect(screen.getByText('Page not found')).toBeOnTheScreen();
    expect(screen.queryByText('Trophway')).not.toBeOnTheScreen();
  });

  it('returns to the home screen from the not-found screen', () => {
    renderRouter(APP_DIR, { initialUrl: '/does-not-exist' });

    fireEvent.press(screen.getByText('Go to home'));

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Trophway')).toBeOnTheScreen();
  });
});
