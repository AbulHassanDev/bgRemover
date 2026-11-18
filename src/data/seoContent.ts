export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoRouteConfig {
  path: string;
  navLabel: string;
  shortTag: string;
  title: string;
  description: string;
  keywords: string;
  h1Prefix: string;
  h1Highlight: string;
  subtitle: string;
  badge: string;
  priority: string;
  changefreq: string;
  recommendedSampleId?: string;
  overviewTitle: string;
  overviewParagraphs: string[];
  highlights: string[];
  faqs: FaqItem[];
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
      'Yes. Switch to the Batch Queue or visit /batch-background-remover to queue multiple product images, apply consistent pure-white (#FFFFFF) or transparent backgrounds, and export everything as a single ZIP archive.',
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
    navLabel: 'AI Background Remover',
    shortTag: 'Main Studio',
    title: 'Free AI Background Remover Online — No Signup | ClearCut',
    description:
      'Remove background from image free in HD with 100% private browser AI. No signup, no uploads, manual hair brushes & instant PNG/WebP export (2026).',
    keywords:
      'free AI background remover online no signup, remove background from image free HD, client-side background remover, transparent PNG maker, private background remover, ClearCut AI',
    h1Prefix: 'Free AI Background Remover Online —',
    h1Highlight: 'No Signup, 100% Private HD',
    subtitle:
      'Remove backgrounds from images free in full HD directly inside your browser. Zero uploads, zero signup walls, manual hair & fur brushes, and instant transparent PNG/WebP export.',
    badge: 'Free No Signup • 100% Private Browser AI • HD PNG',
    priority: '1.0',
    changefreq: 'daily',
    overviewTitle: 'Free AI Background Remover Online With Full HD Exports & Zero Uploads',
    overviewParagraphs: [
      'ClearCut AI is a browser-native background remover built for creators, online sellers, and photographers who want instant transparent PNG cutouts without creating an account or paying per-image credits.',
      'Powered by WebAssembly neural segmentation and color-decontamination edge matting, every photo is processed locally on your device so confidential portraits, client products, and documents never touch a remote server.',
    ],
    highlights: [
      'Remove background from image free in full HD resolution with zero watermarks',
      'No signup, no login, and no credit paywall—start with drag-and-drop or Ctrl+V',
      'Interactive Erase & Restore edge refiner brushes for fine hair, fur, and glass',
      'One-click pure white (#FFFFFF), custom gradient, blurred studio, or transparent PNG backgrounds',
    ],
    faqs: SEO_FAQS,
  },
  '/private-background-remover': {
    path: '/private-background-remover',
    navLabel: 'Private Offline Remover',
    shortTag: 'Zero Uploads',
    title: 'Offline Private Background Remover in Browser | ClearCut',
    description:
      'Remove image backgrounds without uploading to any server. 100% offline WebAssembly privacy in your browser for confidential photos, free in full HD.',
    keywords:
      'offline private background remover in browser, remove background without uploading image, client-side background remover, GDPR safe background removal, local WebAssembly cutout',
    h1Prefix: '100% Offline & Private',
    h1Highlight: 'In-Browser Background Remover',
    subtitle:
      'Remove image backgrounds without uploading a single byte to external servers. Built with client-side WebAssembly AI for GDPR-safe, HIPAA-conscious, and NDA-protected workflows.',
    badge: 'Zero Server Uploads • Verifiable Offline Mode',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-ceo',
    overviewTitle: 'Remove Backgrounds Without Uploading Your Images Anywhere',
    overviewParagraphs: [
      'Most online background removers upload your private headshots, ID documents, medical imagery, and unreleased product prototypes to third-party cloud pipelines. ClearCut AI keeps 100% of pixel computation inside your own browser memory.',
      'Once the lightweight WebAssembly segmentation weights are cached by your browser, you can even disconnect from the internet and continue generating high-resolution transparent PNGs locally.',
    ],
    highlights: [
      'Verifiable zero image uploads in your browser Network inspector',
      'Ideal for legal teams, enterprise brands, healthcare, and personal family portraits',
      'Automatic memory cleanup when you reset or close the studio tab',
      'Full HD transparent PNG, WebP, and white-background export with zero tracking',
    ],
    faqs: [
      SEO_FAQS[0],
      {
        question: 'Can I verify that my images stay offline inside my browser?',
        answer:
          'Yes. Open your browser Developer Tools Network tab while processing an image—no image file or base64 payload is sent to any external server when using on-device Neural AI or Turbo mode.',
      },
      {
        question: 'Does ClearCut AI work offline after the initial page visit?',
        answer:
          'Once your browser caches the local WebAssembly runtime and ONNX segmentation weights, background removal executes completely offline with zero internet dependency.',
      },
      SEO_FAQS[1],
      SEO_FAQS[2],
      SEO_FAQS[4],
    ],
  },
  '/ecommerce-product-cutout': {
    path: '/ecommerce-product-cutout',
    navLabel: 'E-Commerce Product Cutout',
    shortTag: 'Amazon & Shopify',
    title: 'White Background Product Photo Editor: Amazon & Shopify',
    description:
      'Create pure white #FFFFFF product photos for Amazon, Shopify & Etsy in seconds. Free browser background remover with drop shadows and ZIP batch export.',
    keywords:
      'white background product photo editor for Amazon Shopify, ecommerce background remover, pure white #FFFFFF background maker, Etsy product photo cutout, free product background remover',
    h1Prefix: 'White Background Product Photo Editor for',
    h1Highlight: 'Amazon, Shopify & Etsy',
    subtitle:
      'Isolate sneakers, electronics, jewelry, cosmetics, and apparel onto pure white (#FFFFFF) or transparent canvases with realistic drop shadows and instant batch ZIP exports.',
    badge: 'Amazon #FFFFFF Compliant • Studio Drop Shadows',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-product',
    overviewTitle: 'Marketplace-Ready White Background Product Photos in Seconds',
    overviewParagraphs: [
      'Amazon Seller Central, Shopify themes, Google Shopping, and eBay require crisp product isolation on pure #FFFFFF white backgrounds without gray color cast or jagged halos.',
      'ClearCut AI removes clutter from tabletop and studio shots cleanly, eliminates color spill around bright edges, and lets you add soft directional contact shadows or crop to 1:1 square marketplace ratios.',
    ],
    highlights: [
      'One-click pure #FFFFFF white background preset compliant with Amazon main image rules',
      'Adjustable studio drop shadow angle, blur, opacity, and distance for natural depth',
      'Square 1:1, 4:5, and 16:9 canvas crop presets for Shopify, Etsy, and Instagram Shop',
      'Batch queue workflow to convert an entire SKU catalog and export as one ZIP',
    ],
    faqs: [
      {
        question: 'How do I make a pure white #FFFFFF product photo for Amazon?',
        answer:
          'Drop your product photo into the studio, wait a second for AI background removal, select the Pure White (#FFFFFF) swatch under Solid Backgrounds, and export as high-resolution PNG or JPG.',
      },
      {
        question: 'Can I add realistic shadows under sneakers, bottles, or electronics?',
        answer:
          'Yes. Enable Drop Shadow in the Background Customizer panel to adjust shadow distance, blur radius, opacity, and directional light angle before exporting.',
      },
      SEO_FAQS[3],
      SEO_FAQS[1],
      SEO_FAQS[0],
      SEO_FAQS[4],
    ],
  },
  '/portrait-edge-studio': {
    path: '/portrait-edge-studio',
    navLabel: 'Portrait & Hair Studio',
    shortTag: 'Hair & Fur',
    title: 'Remove Background From Hair & Fur Free — HD PNG Studio',
    description:
      'Get crisp transparent PNG portrait cutouts keeping fine hair, pet fur, and glass intact. Browser AI matting plus manual erase/restore edge brushes.',
    keywords:
      'remove background from hair and fur free, transparent PNG portrait cutout, hair edge background remover, pet fur cutout online free, manual edge refiner brush',
    h1Prefix: 'Remove Background From',
    h1Highlight: 'Hair, Fur & Portraits Free',
    subtitle:
      'Preserve delicate flyaway hair strands, fluffy pet fur, and translucent lace without harsh blocky cutouts. Neural matting paired with interactive Erase & Restore edge brushes.',
    badge: 'Sub-Pixel Hair Matting • Manual Edge Refiner',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-portrait',
    overviewTitle: 'Clean Transparent PNG Portrait Cutouts Without Chopped Hair or Halos',
    overviewParagraphs: [
      'Automatic background removers frequently clip curly hair, leave bright fringe halos around dark coats, or blur pet whiskers. ClearCut AI pairs deep foreground alpha matting with adaptive border color decontamination.',
      'Whenever an artistic portrait needs human touch-up, open the built-in Edge Refiner Studio to zoom in up to 400%, inspect the alpha mask against dark or cyan checkerboards, and brush strands back cleanly.',
    ],
    highlights: [
      'Color-decontamination pass strips green, blue, or studio backdrop spill from hair edges',
      'Interactive Erase & Restore brush studio with adjustable brush size and softness',
      'Switch between Light, Dark, and High-Contrast Cyan checkerboards to verify edges',
      'Full undo/redo edit timeline across crop, brush refinement, and color grading',
    ],
    faqs: [
      SEO_FAQS[2],
      {
        question: 'How do I fix missing hair strands or extra background patches?',
        answer:
          'Click Open Edge Refiner above or beside the comparison canvas, choose Restore or Erase brush mode, zoom into hairline details, and paint gently along the boundary before clicking Apply Edits.',
      },
      SEO_FAQS[0],
      SEO_FAQS[1],
      SEO_FAQS[4],
      SEO_FAQS[5],
    ],
  },
  '/youtube-thumbnail-cutout': {
    path: '/youtube-thumbnail-cutout',
    navLabel: 'YouTube Thumbnail Maker',
    shortTag: 'Creator Studio',
    title: 'YouTube Thumbnail Background Remover Online Free | 2026',
    description:
      'Free YouTube thumbnail background remover online. Paste screenshots with Ctrl+V, cut out subjects in seconds, boost colors, and export sharp HD PNGs.',
    keywords:
      'YouTube thumbnail background remover online free, creator thumbnail cutout PNG, TikTok cover background remover, paste screenshot background remover Ctrl+V, transparent reaction cutout',
    h1Prefix: 'YouTube Thumbnail',
    h1Highlight: 'Background Remover Online Free',
    subtitle:
      'Paste reaction screenshots straight with Ctrl+V, cut out hosts or gadgets in seconds, pop vibrant contrast with AI Picture Enhance, and export lightweight transparent PNGs.',
    badge: 'Ctrl+V Clipboard Paste • AI Color Boost • Free HD',
    priority: '0.8',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-vehicle',
    overviewTitle: 'Fast Subject Cutouts for High-CTR YouTube Thumbnails & Social Covers',
    overviewParagraphs: [
      'High-performing YouTube thumbnails, Reels covers, and podcast graphics rely on clean, punchy foreground cutouts layered over bold backdrops and headline typography.',
      'Press Ctrl+V anywhere in ClearCut AI to paste a video frame grab, remove the room background automatically, boost sharpness and vibrance inside AI Enhance, and drop the transparent PNG into Figma, Canva, or Photoshop.',
    ],
    highlights: [
      'Instant Ctrl+V clipboard paste for frame grabs, screenshots, and webcam captures',
      'Built-in AI Picture Enhancer to boost exposure, clarity, sharpness, and color punch',
      '16:9 YouTube thumbnail and 9:16 Shorts/Reels canvas crop ratios ready to export',
      'Vibrant neon, sunset, and obsidian studio gradients built directly into the editor',
    ],
    faqs: [
      {
        question: 'Can I paste a YouTube screenshot directly without saving a file first?',
        answer:
          'Yes. Copy any image or screenshot to your clipboard and press Ctrl+V (or Cmd+V on Mac) anywhere on ClearCut AI to immediately trigger background removal.',
      },
      {
        question: 'Can I enhance dull webcam lighting before exporting my thumbnail cutout?',
        answer:
          'Yes. Click AI Enhance in the studio toolbar to fine-tune contrast, saturation, sharpness, and clarity on either the isolated cutout or the full composited thumbnail.',
      },
      SEO_FAQS[1],
      SEO_FAQS[0],
      SEO_FAQS[4],
      SEO_FAQS[5],
    ],
  },
  '/alternatives/remove-bg-alternative': {
    path: '/alternatives/remove-bg-alternative',
    navLabel: 'remove.bg Alternative',
    shortTag: 'Unlimited HD',
    title: 'Best Free remove.bg Alternative Unlimited HD | ClearCut',
    description:
      'Switch to the best free remove.bg alternative in 2026: unlimited HD PNG downloads, zero credit paywalls, bulk ZIP export, and private on-device AI.',
    keywords:
      'best free remove.bg alternative unlimited HD, free alternative to remove.bg no credits, unlimited transparent PNG background remover, free HD background remover 2026',
    h1Prefix: 'Best Free remove.bg Alternative —',
    h1Highlight: 'Unlimited HD & 100% Private',
    subtitle:
      'Stop hitting low-res preview caps or buying expensive per-image credits. ClearCut AI delivers unlimited full-resolution PNG exports, manual edge brushes, and batch ZIP downloads free.',
    badge: 'Zero Credits Needed • Unlimited Full-HD PNGs',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-pet',
    overviewTitle: 'Why Designers & Sellers Switch From Cloud Credit Tools to ClearCut AI',
    overviewParagraphs: [
      'Traditional cloud background removers let you preview a cutout for free, then downgrade the free download to small preview pixels unless you purchase monthly subscriptions or per-image credits.',
      'Because ClearCut AI runs neural segmentation directly on your own browser WebAssembly engine instead of billing GPU cloud servers per image, full-resolution transparent PNG downloads and bulk ZIP exports cost nothing.',
    ],
    highlights: [
      'Unlimited full-resolution PNG and WebP downloads with no preview-size throttling',
      'No account creation, no credit cards, and zero watermarks on any export',
      'Full interactive Erase & Restore brush editor and Canvas Crop included free',
      'On-device processing protects client NDAs and personal photography completely',
    ],
    faqs: [
      SEO_FAQS[5],
      SEO_FAQS[1],
      SEO_FAQS[0],
      SEO_FAQS[3],
      SEO_FAQS[2],
      SEO_FAQS[4],
    ],
  },
  '/passport-photo-background-remover': {
    path: '/passport-photo-background-remover',
    navLabel: 'Passport Photo Background',
    shortTag: 'White / Blue ID',
    title: 'Passport Photo Background Remover — White & Blue Free',
    description:
      'Change passport, visa, and ID photo backgrounds to pure white or official blue online for free. 100% private browser processing with zero server uploads.',
    keywords:
      'passport photo background remover free, change passport photo background to white, blue background visa photo editor, ID photo background remover no upload, US passport white background maker',
    h1Prefix: 'Free Passport & ID Photo',
    h1Highlight: 'White / Blue Background Maker',
    subtitle:
      'Convert any portrait into a clean white (#FFFFFF), off-white, or official light-blue passport, visa, and employee badge photo—100% privately inside your browser.',
    badge: 'Passport White & Blue • 100% Private ID Photos',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-ceo',
    overviewTitle: 'Clean White & Blue Backgrounds for Passport, Visa & Badge Photos',
    overviewParagraphs: [
      'Biometric passport agencies, visa portals, university portals, and corporate ID desks reject selfies with busy room shadows, textured walls, or uneven lighting behind your shoulders.',
      'Because passport portraits contain sensitive personal identity details, uploading them to unknown websites carries privacy risk. ClearCut AI cleans the backdrop locally inside your browser and applies exact #FFFFFF white or studio blue hues.',
    ],
    highlights: [
      'One-click Pure White (#FFFFFF), Soft Pearl, or Official ID Blue solid backgrounds',
      '100% private browser processing keeps passport and visa portraits off external servers',
      'Clean edge decontamination around glasses, hijabs, collars, and dark hair',
      'Built-in Crop Canvas tool for 1:1 (2x2 in) and standard portrait aspect ratios',
    ],
    faqs: [
      {
        question: 'How do I change my passport or visa photo background to white for free?',
        answer:
          'Upload your front-facing portrait to ClearCut AI, let the local AI isolate your head and shoulders cleanly, choose Pure White (#FFFFFF) in Solid Colors, crop to 1:1 if needed, and download in HD.',
      },
      {
        question: 'Is it safe to process ID and passport photos in ClearCut AI?',
        answer:
          'Yes. ClearCut AI runs locally via WebAssembly inside your browser, meaning your ID, visa, and passport photos never get uploaded or stored on any server.',
      },
      SEO_FAQS[2],
      SEO_FAQS[1],
      SEO_FAQS[4],
      SEO_FAQS[5],
    ],
  },
  '/logo-transparent-background-maker': {
    path: '/logo-transparent-background-maker',
    navLabel: 'Transparent Logo Maker',
    shortTag: 'PNG & Signatures',
    title: 'Make Logo Background Transparent PNG Free Online | 2026',
    description:
      'Make any logo background transparent PNG free in seconds. Clean crisp edges on icons, badges, and signatures right in your browser with zero uploads.',
    keywords:
      'make logo background transparent PNG free, transparent logo maker online, remove white background from logo free, digital signature transparent background, watermark PNG maker',
    h1Prefix: 'Make Any Logo Background',
    h1Highlight: 'Transparent PNG Online Free',
    subtitle:
      'Strip solid white, black, or boxy backgrounds from brand logos, badges, stamps, and handwritten signatures to export razor-sharp transparent PNG assets.',
    badge: 'Crisp Vector-Like Edges • Transparent PNG Logos',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-plant',
    overviewTitle: 'Convert JPEG Logos, Stamps & Signatures Into Clean Transparent PNGs',
    overviewParagraphs: [
      'Nothing breaks a clean pitch deck, invoice, or website header faster than a company logo sitting inside an ugly white rectangle. ClearCut AI strips uniform white, off-white, or colored backdrops while preserving fine lettering.',
      'After automatic cutout, switch to the Dark or High-Contrast Cyan checkerboard view to verify zero fringe pixels remain, then export a lossless alpha PNG ready for Canva, Shopify headers, or PDF contracts.',
    ],
    highlights: [
      'Remove solid white or dark backgrounds from logos, stamps, and scanned signatures',
      'Inspect crisp alpha boundaries against Dark and Cyan contrast checkerboards',
      'Refine subtle glyphs or strokes using manual Erase & Restore brushes',
      'Lossless 32-bit RGBA PNG export preserves transparency across all design tools',
    ],
    faqs: [
      {
        question: 'How do I remove a white background from a JPG logo to get a transparent PNG?',
        answer:
          'Drop your logo file into ClearCut AI. The segmentation engine strips the surrounding white backdrop automatically, letting you download a true transparent PNG ready to overlay on any site or slide.',
      },
      {
        question: 'Can I also make handwritten signatures transparent for PDFs and Docs?',
        answer:
          'Yes. Photograph or scan your signature on clean white paper, upload or paste it here, verify crisp ink lines on the checkerboard canvas, and export as a transparent PNG.',
      },
      SEO_FAQS[1],
      SEO_FAQS[0],
      SEO_FAQS[4],
      SEO_FAQS[5],
    ],
  },
  '/car-dealership-background-remover': {
    path: '/car-dealership-background-remover',
    navLabel: 'Car Dealership Cutouts',
    shortTag: 'Automotive Studio',
    title: 'Car Dealership Background Remover & Auto Cutout Tool',
    description:
      'Remove distracting lot backgrounds from car and vehicle dealership photos free. Isolate reflections cleanly and apply studio backdrops in your browser.',
    keywords:
      'car dealership background remover, automotive vehicle photo cutout tool, remove background from car photo free, dealership showroom photo editor, car listing transparent PNG',
    h1Prefix: 'Automotive & Car Dealership',
    h1Highlight: 'Background Remover Studio',
    subtitle:
      'Turn busy parking-lot car photos into clean showroom listings. Keep glossy paint reflections, alloy wheels, and tinted windows crisp against clean studio gradients.',
    badge: 'Dealership Ready • Gloss Reflections & Wheels Preserved',
    priority: '0.8',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-vehicle',
    overviewTitle: 'Turn Lot Vehicle Photos Into Clean Dealership Showroom Listings',
    overviewParagraphs: [
      'Cluttered dealership lots, neighboring vehicles, utility poles, and overcast skies lower buyer trust on AutoTrader, Cars.com, Facebook Marketplace, and dealer inventory portals.',
      'ClearCut AI accurately isolates sedans, SUVs, motorcycles, and classic cars—preserving chrome trim, tires, and curved windshield reflections—while letting you drop cars onto neutral gray studio gradients or pure white canvases.',
    ],
    highlights: [
      'Remove distracting dealer lot clutter, power lines, and parked neighbor cars',
      'Preserves metallic paint reflections, headlights, and tire contours naturally',
      'Apply subtle Studio Gray gradients or pure white backdrops with contact shadows',
      'Process multiple inventory angles rapidly using the browser Batch Queue',
    ],
    faqs: [
      {
        question: 'Does ClearCut AI preserve shiny reflections and windows on car photos?',
        answer:
          'Yes. Neural segmentation keeps vehicle glass, headlights, and metallic body panels intact while cleanly removing asphalt, trees, and nearby structures behind the car.',
      },
      {
        question: 'Can dealerships process dozens of inventory photos without per-car fees?',
        answer:
          'Yes. Use the Batch Queue workflow to process multiple inventory angles directly in your browser with zero per-vehicle fees or monthly seat limits.',
      },
      SEO_FAQS[3],
      SEO_FAQS[1],
      SEO_FAQS[0],
      SEO_FAQS[4],
    ],
  },
  '/batch-background-remover': {
    path: '/batch-background-remover',
    navLabel: 'Batch ZIP Remover',
    shortTag: 'Bulk Processing',
    title: 'Batch Background Remover Online Free — Bulk ZIP Export',
    description:
      'Bulk remove backgrounds from multiple product or portrait images at once for free. 100% private browser processing with one-click white/PNG ZIP export.',
    keywords:
      'batch background remover online free, bulk remove background from multiple images ZIP free, multiple photo background remover no signup, bulk white background product editor',
    h1Prefix: 'Free Bulk & Batch',
    h1Highlight: 'Background Remover + ZIP Export',
    subtitle:
      'Drop multiple product photos, portraits, or inventory shots at once. ClearCut AI processes your entire queue locally in your browser and bundles every HD PNG into one ZIP archive.',
    badge: 'Bulk Multi-Image Queue • One-Click ZIP Download',
    priority: '0.9',
    changefreq: 'weekly',
    recommendedSampleId: 'sample-product',
    overviewTitle: 'Bulk Remove Backgrounds From Multiple Images and Download as ZIP',
    overviewParagraphs: [
      'Editing SKU photos, team headshots, or catalog assets one file at a time slows down every launch. ClearCut AI includes a built-in client-side Batch Studio with live progress tracking across every queued image.',
      'Apply uniform transparent or pure white (#FFFFFF) backgrounds across your entire batch, inspect any single cutout in the full Edge Refiner Editor, and download all completed HD PNGs in one bundled ZIP.',
    ],
    highlights: [
      'Drop or select dozens of JPG, PNG, WebP, or AVIF images into one queue',
      'Apply shared background color or transparency consistently across the whole batch',
      'Open any finished queue item in the Single Studio for fine brush or crop tweaks',
      'Export every processed HD cutout simultaneously as a clean ZIP archive',
    ],
    faqs: [
      SEO_FAQS[3],
      {
        question: 'Can I tweak a single image after running a bulk batch?',
        answer:
          'Yes. Click Open in Editor on any completed item in the Batch Queue to fine-tune edges with Erase/Restore brushes, adjust drop shadows, or crop before saving.',
      },
      SEO_FAQS[0],
      SEO_FAQS[1],
      SEO_FAQS[4],
      SEO_FAQS[5],
    ],
  },
};

export const SEO_ROUTE_LIST: SeoRouteConfig[] = Object.values(SEO_ROUTES);

export function getSeoRoute(pathname: string): SeoRouteConfig {
  const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  return SEO_ROUTES[normalized] || SEO_ROUTES['/'];
}

export function buildRouteSchemaGraph(route: SeoRouteConfig, origin: string) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const canonicalUrl = `${cleanOrigin}${route.path === '/' ? '/' : route.path}`;

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'WebSite',
      name: 'ClearCut AI',
      description:
        'Browser-native free AI background remover and precision edge studio with 100% on-device privacy.',
      url: `${cleanOrigin}/`,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'ClearCut AI',
      url: canonicalUrl,
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'PhotoEditing',
      operatingSystem: 'Web Browser (Chrome, Safari, Firefox, Edge)',
      browserRequirements: 'Requires WebAssembly and HTML5 Canvas',
      description: route.description,
      author: {
        '@type': 'Person',
        name: 'AbulHassan',
      },
      featureList: [
        '100% client-side on-device AI background removal',
        'Manual erase and restore edge refinement brushes',
        'High-speed batch image processing with ZIP export',
        'AI picture enhancement and color grading',
        'Canvas crop and aspect ratio controls',
        'Lossless transparent PNG and WebP exports',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: route.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  if (route.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home — AI Background Remover',
          item: `${cleanOrigin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: route.navLabel,
          item: canonicalUrl,
        },
      ],
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
