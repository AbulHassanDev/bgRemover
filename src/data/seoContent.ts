export interface SeoRouteConfig {
  path: string;
  title: string;
  description: string;
  h1Prefix: string;
  h1Highlight: string;
  subtitle: string;
  badge: string;
  priority: string;
  changefreq: string;
  recommendedSampleId?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const SEO_FAQS: FaqItem[] = [
  {
    question: 'Does ClearCut AI upload my photos to a server?',
    answer:
      'No. In client-side and WebAssembly modes, ClearCut AI processes your images 100% locally inside your browser. Your photos never leave your device, with zero cloud storage or tracking.',
  },
  {
    question: 'Is ClearCut AI free to use for high-resolution PNG exports?',
    answer:
      'Yes. You can remove backgrounds, refine hair and fur edges with manual erase/restore brushes, and export full-resolution transparent PNG or WebP images directly in your browser with zero watermarks or credit limits.',
  },
  {
    question: 'How does ClearCut AI handle fine hair, fur, and transparent edges?',
    answer:
      'ClearCut AI combines neural edge-detection matting with an interactive Erase & Restore Edge Refiner brush studio, letting you zoom in and perfect stray hairs, glass, or foliage down to sub-pixel accuracy.',
  },
  {
    question: 'Can I remove backgrounds from multiple product photos at once?',
    answer:
      'Yes. Switch to the Batch tab in the top studio bar to queue multiple product images, apply consistent pure-white (#FFFFFF) or transparent backgrounds, and export everything as a single ZIP archive.',
  },
  {
    question: 'What image formats and file sizes are supported?',
    answer:
      'ClearCut AI supports JPG, JPEG, PNG, WebP, and AVIF images up to 15MB per file. You can drag and drop files, browse from your device, or paste screenshots directly with Ctrl+V.',
  },
  {
    question: 'Why use a browser-native background remover instead of remove.bg or cloud tools?',
    answer:
      'Cloud tools require uploading private photos to third-party servers and often gate HD downloads behind per-image credits. ClearCut AI gives you instant browser-native cutouts, full-resolution exports, and verifiable on-device privacy for free.',
  },
];

export const SEO_ROUTES: Record<string, SeoRouteConfig> = {
  '/': {
    path: '/',
    title: 'ClearCut AI — Free, Private Client-Side Background Remover',
    description:
      'Remove image backgrounds in sub-seconds directly in your browser. 100% on-device privacy, zero uploads, edge refinement brushes & batch studio. Try free.',
    h1Prefix: 'Private AI Background Remover &',
    h1Highlight: 'Precision Edge Studio',
    subtitle:
      '100% browser-native subject segmentation. Delete backgrounds in sub-seconds with on-device privacy, refine fine hair & fur with manual brushes, and export lossless PNG/WebP.',
    badge: '100% On-Device Privacy • Sub-Second Cutouts',
    priority: '1.0',
    changefreq: 'daily',
  },
  '/private-background-remover': {
    path: '/private-background-remover',
    title: 'Client-Side Background Remover — 100% On-Device Privacy | ClearCut AI',
    description:
      'Remove photo backgrounds offline inside your browser with zero cloud uploads. Built with WebAssembly for GDPR-safe, confidential, and instant cutouts.',
    h1Prefix: '100% Client-Side',
    h1Highlight: 'Private Background Remover',
    subtitle:
      'Zero server uploads, zero cloud storage, and zero tracking. Process confidential portraits, legal documents, and unreleased product shots entirely on your own device.',
    badge: 'Zero Cloud Uploads • Verifiable In DevTools',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-ceo',
  },
  '/ecommerce-product-cutout': {
    path: '/ecommerce-product-cutout',
    title: 'Product Photo Background Remover for Amazon & Shopify | ClearCut AI',
    description:
      'Create pure white (#FFFFFF) or transparent product cutouts for Amazon, Shopify & Etsy in seconds. Batch queue, drop shadows, and lossless exports.',
    h1Prefix: 'Studio Product Cutouts for',
    h1Highlight: 'Amazon, Shopify & Etsy',
    subtitle:
      'Isolate sneakers, electronics, apparel, and packaging with razor-sharp edges. Add realistic drop shadows, pure #FFFFFF backgrounds, and batch-export your catalog as a ZIP.',
    badge: 'E-Commerce Batch Studio • Pure #FFFFFF Ready',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-product',
  },
  '/portrait-edge-studio': {
    path: '/portrait-edge-studio',
    title: 'Portrait & Hair Edge Background Remover Studio | ClearCut AI',
    description:
      'Keep every strand of hair, fur, and translucent fabric intact. Combine neural AI segmentation with manual Erase & Restore edge brushes for studio portraits.',
    h1Prefix: 'Studio Portrait Cutouts with',
    h1Highlight: 'Fine Hair & Fur Detail',
    subtitle:
      'Preserve flyaway hair, pet fur, and delicate boundaries automatically, then dial in sub-pixel perfection using interactive Erase & Restore refinement brushes.',
    badge: 'Neural Hair Matting • Manual Brush Refiner',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-portrait',
  },
  '/youtube-thumbnail-cutout': {
    path: '/youtube-thumbnail-cutout',
    title: 'Free Transparent PNG & Thumbnail Cutout Maker | ClearCut AI',
    description:
      'Make crisp transparent PNG and WebP cutouts for YouTube thumbnails, TikTok covers, and social graphics. Paste with Ctrl+V, enhance colors, and export free.',
    h1Prefix: 'Instant Cutouts for',
    h1Highlight: 'Thumbnails & Creator Graphics',
    subtitle:
      'Paste any screenshot with Ctrl+V, cut out subjects in sub-seconds, boost contrast with AI Picture Enhance, and export lightweight transparent WebP or PNG.',
    badge: 'Ctrl+V Paste Ready • Zero Watermarks',
    priority: '0.8',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-vehicle',
  },
  '/alternatives/remove-bg-alternative': {
    path: '/alternatives/remove-bg-alternative',
    title: 'Free Private Alternative to remove.bg (No Credits) | ClearCut AI',
    description:
      'Looking for a free, unlimited remove.bg alternative? ClearCut AI delivers HD transparent PNGs, batch processing, and 100% on-device privacy with no credits.',
    h1Prefix: 'The Free, Private Alternative to',
    h1Highlight: 'Credit-Based Cloud Tools',
    subtitle:
      'Stop paying per-image credits or uploading sensitive assets to third-party servers. ClearCut AI gives you full-resolution exports, batch workflows, and manual edge brushes free.',
    badge: 'Unlimited HD Exports • No Account Required',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-pet',
  },
};

export function getSeoRoute(pathname: string): SeoRouteConfig {
  const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  return SEO_ROUTES[normalized] || SEO_ROUTES['/'];
}
