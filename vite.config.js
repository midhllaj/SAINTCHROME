import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dev-only helper: the hidden /__lab page renders every 3D model and POSTs
 * GLB files, PNG product shots and Chapel renders here, so they land in /public.
 * Only paths inside /public/(models|shots|chapel) can be written.
 */
function saveEndpoint() {
  const root = path.resolve('public');
  const allowed = ['models', 'shots', 'chapel', 'lab'];
  return {
    name: 'saintchrome-save-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        const rel = new URL(req.url, 'http://x').searchParams.get('path') || '';
        const target = path.resolve(root, rel);
        const top = path.relative(root, target).split(path.sep)[0];
        if (!target.startsWith(root) || !allowed.includes(top)) { res.statusCode = 403; return res.end('forbidden'); }
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, Buffer.concat(chunks));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [saveEndpoint()],
  server: { port: 5173, open: false },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
