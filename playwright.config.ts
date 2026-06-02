/// <reference types="node" />
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,  // séquentiel pour éviter les conflits de rebuilds MongoDB
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      args: ['--window-size=1920,1080', '--window-position=0,0', '--start-maximized'],
    },
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Si le port 3000 est déjà pris, on reste en vie avec tail ; sinon on démarre le backend
      command: 'lsof -ti:3000 >/dev/null 2>&1 && tail -f /dev/null || (cd server && npm run dev)',
      url: 'http://localhost:3000/read/classes?limit=1',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
