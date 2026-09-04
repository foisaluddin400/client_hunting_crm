import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

async function runBuild() {
  console.log('Starting Google Maps Lead Scraper extension build...');

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 1. Build Side Panel (React app)
  console.log('Building Side Panel...');
  await build({
    configFile: false,
    plugins: [react()],
    root: path.resolve('src/sidepanel'),
    base: './',
    build: {
      outDir: path.resolve('dist/sidepanel'),
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve('src/sidepanel/index.html'),
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  });

  // 2. Build Background Service Worker (ES module)
  console.log('Building Background Service Worker...');
  await build({
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/service-worker.ts'),
        name: 'BackgroundServiceWorker',
        formats: ['es'],
        fileName: () => 'background.js',
      },
    },
  });

  // 3. Build Content Script (IIFE, self-contained for Chrome Content Script)
  console.log('Building Content Script...');
  await build({
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/content-script.ts'),
        name: 'GoogleMapsLeadScraperContent',
        formats: ['iife'],
        fileName: () => 'content-script.js',
      },
    },
  });

  // 4. Copy manifest.json and icons to dist/
  console.log('Copying manifest and assets...');
  fs.copyFileSync(path.resolve('manifest.json'), path.join(distDir, 'manifest.json'));

  const iconsSrc = path.resolve('public/icons');
  const iconsDest = path.join(distDir, 'icons');
  fs.mkdirSync(iconsDest, { recursive: true });
  const icons = fs.readdirSync(iconsSrc);
  for (const icon of icons) {
    fs.copyFileSync(path.join(iconsSrc, icon), path.join(iconsDest, icon));
  }

  console.log('Build completed successfully in dist/');
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
