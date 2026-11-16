import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const BASE_URL = 'https://bg-remover-orpin-chi.vercel.app';

const ROUTES = {
  '/private-background-remover': {
    title: 'Client-Side Background Remover — 100% On-Device Privacy | ClearCut AI',
    description:
      'Remove photo backgrounds offline inside your browser with zero cloud uploads. Built with WebAssembly for GDPR-safe, confidential, and instant cutouts.',
  },
  '/ecommerce-product-cutout': {
    title: 'Product Photo Background Remover for Amazon & Shopify | ClearCut AI',
    description:
      'Create pure white (#FFFFFF) or transparent product cutouts for Amazon, Shopify & Etsy in seconds. Batch queue, drop shadows, and lossless exports.',
  },
  '/portrait-edge-studio': {
    title: 'Portrait & Hair Edge Background Remover Studio | ClearCut AI',
    description:
      'Keep every strand of hair, fur, and translucent fabric intact. Combine neural AI segmentation with manual Erase & Restore edge brushes for studio portraits.',
  },
  '/youtube-thumbnail-cutout': {
    title: 'Free Transparent PNG & Thumbnail Cutout Maker | ClearCut AI',
    description:
      'Make crisp transparent PNG and WebP cutouts for YouTube thumbnails, TikTok covers, and social graphics. Paste with Ctrl+V, enhance colors, and export free.',
  },
  '/alternatives/remove-bg-alternative': {
    title: 'Free Private Alternative to remove.bg (No Credits) | ClearCut AI',
    description:
      'Looking for a free, unlimited remove.bg alternative? ClearCut AI delivers HD transparent PNGs, batch processing, and 100% on-device privacy with no credits.',
  },
};

const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found; skipping prerender-meta.');
  process.exit(0);
}

const template = fs.readFileSync(indexPath, 'utf-8');

for (const [routePath, meta] of Object.entries(ROUTES)) {
  const canonical = `${BASE_URL}${routePath}`;
  const html = template
    .replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${meta.description}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${canonical}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${meta.title}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${meta.description}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${canonical}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${meta.title}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${meta.description}" />`
    );

  const outDir = path.join(DIST_DIR, routePath.replace(/^\/+/, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
}

console.log(`Generated static SEO metadata HTML for ${Object.keys(ROUTES).length} routes.`);
