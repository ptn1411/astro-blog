import fs from 'node:fs';
import path from 'node:path';

const distClient = path.resolve('dist/client');
const distRoot = path.resolve('dist');

if (fs.existsSync(distClient)) {
  console.log('[postbuild] Copying dist/client static files to dist root for Cloudflare Pages...');
  fs.cpSync(distClient, distRoot, { recursive: true });
  console.log('[postbuild] Done! Static pages now accessible directly at dist root.');
}
