import { CLERK_CONFIG } from './config';

declare global {
  interface Window {
    Clerk: any;
  }
}

let clerkPromise: Promise<any> | null = null;

const loadClerkScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Clerk) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = CLERK_CONFIG.SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Clerk script'));
    document.head.appendChild(script);
  });
};

const waitForClerk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Clerk) {
      resolve();
      return;
    }

    const maxAttempts = 50;
    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;
      if (window.Clerk) {
        clearInterval(interval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Clerk failed to load after multiple attempts'));
      }
    }, 100);
  });
};

export const initClerk = async () => {
  try {
    if (!clerkPromise) {
      clerkPromise = (async () => {
        await loadClerkScript();
        if (!window.Clerk) {
          throw new Error('Clerk still not available after loading script');
        }
        await window.Clerk.load({
          publishableKey: CLERK_CONFIG.PUBLISHABLE_KEY
        });
        return window.Clerk;
      })();
    }
    
    return await clerkPromise;
  } catch (error) {
    clerkPromise = null; // Reset promise on error
    console.error('Failed to initialize Clerk:', error);
    throw error;
  }
};

export const getClerk = () => {
  if (!window.Clerk?.loaded) {
    throw new Error('Clerk not initialized. Call initClerk() first');
  }
  return window.Clerk;
};