import { vi } from 'vitest';

// Mock Remix components and hooks
vi.mock('@remix-run/react', () => ({
  Link: () => null,
  useFetcher: () => ({
    Form: () => null,
    state: 'idle',
    data: null,
  }),
}));

// Mock the workbenchStore
vi.mock('~/lib/stores/workbench', () => ({
  workbenchStore: {},
}));

// Mock any other necessary dependencies
vi.mock('~/lib/webcontainer', () => ({
  webcontainer: Promise.resolve({}),
  webcontainerContext: { loaded: false },
}));
