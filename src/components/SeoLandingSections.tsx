import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  SlidersHorizontal,
  ShoppingBag,
  Camera,
  Youtube,
  Lock,
  ArrowRight,
  ChevronDown,
  Check,
  X,
  Scale,
  IdCard,
  Stamp,
  Car,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getSeoRoute } from '../data/seoContent';

interface SeoLandingSectionsProps {
  currentPath: string;
  onNavigateRoute: (path: string) => void;
  onOpenBatch: () => void;
}

const USE_CASES = [
  {
    path: '/',
    icon: Sparkles,
    accent: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    title: 'All-in-One AI Background Remover',
    tag: 'Main Free HD Studio',
    description:
      'Remove backgrounds from portraits, products, and graphics in sub-seconds directly inside your browser with zero signup.',
  },
  {
    path: '/private-background-remover',
    icon: Lock,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    title: '100% Client-Side Privacy',
    tag: 'Zero Cloud Uploads',
    description:
      'Keep confidential portraits, legal documents, and unreleased designs strictly on your own device with WebAssembly processing.',
  },
  {
    path: '/ecommerce-product-cutout',
    icon: ShoppingBag,
    accent: 'text-blue-600 bg-blue-50 border-blue-100',
    title: 'E-Commerce Product Cutouts',
    tag: 'Amazon & Shopify #FFFFFF',
    description:
      'Isolate products onto pure #FFFFFF or transparent backgrounds with realistic drop shadows and bulk ZIP batch exports.',
  },
  {
    path: '/portrait-edge-studio',
    icon: Camera,
    accent: 'text-violet-600 bg-violet-50 border-violet-100',
    title: 'Portraits, Hair & Fur',
    tag: 'Manual Edge Refiner',
    description:
      'Combine neural matting with precision Erase & Restore brushes to preserve flyaway hair, pet fur, and translucent fabrics.',
  },
  {
    path: '/youtube-thumbnail-cutout',
    icon: Youtube,
    accent: 'text-rose-600 bg-rose-50 border-rose-100',
    title: 'YouTube Thumbnail Cutouts',
    tag: 'Ctrl+V Paste Ready',
    description:
      'Paste screenshots straight from your clipboard, boost contrast with AI color grading, and export crisp transparent WebP or PNG.',
  },
  {
    path: '/passport-photo-background-remover',
    icon: IdCard,
    accent: 'text-sky-600 bg-sky-50 border-sky-100',
    title: 'Passport & ID Background Changer',
    tag: 'Pure White & Official Blue',
    description:
      'Clean visa, passport, and employee badge portraits onto pure white (#FFFFFF) or studio blue offline inside your browser.',
  },
  {
    path: '/logo-transparent-background-maker',
    icon: Stamp,
    accent: 'text-amber-600 bg-amber-50 border-amber-100',
    title: 'Transparent Logo & Signature Maker',
    tag: 'Crisp Alpha PNG',
    description:
      'Strip white or solid rectangles from company logos, icons, and scanned signatures to export crisp 32-bit transparent PNGs.',
  },
  {
    path: '/car-dealership-background-remover',
    icon: Car,
    accent: 'text-slate-700 bg-slate-100 border-slate-200',
    title: 'Car & Vehicle Dealership Studio',
    tag: 'Automotive Cutouts',
    description:
      'Remove busy parking-lot clutter while keeping glossy vehicle paint reflections, alloy wheels, and tinted glass intact.',
  },
  {
    path: '/batch-background-remover',
    icon: Layers,
    accent: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    title: 'Bulk Batch ZIP Background Remover',
    tag: 'Multiple Photos at Once',
    description:
      'Queue multiple product or catalog photos at once, apply consistent white or transparent backdrops, and download one ZIP.',
  },
  {
    path: '/alternatives/remove-bg-alternative',
    icon: Scale,
    accent: 'text-teal-600 bg-teal-50 border-teal-100',
    title: 'Free remove.bg Alternative',
    tag: 'Unlimited HD • Zero Credits',
    description:
      'Skip preview caps and per-image credits with full-resolution PNG exports, manual brush controls, and total privacy.',
  },
];

const COMPARISON_ROWS = [
  {
    feature: '100% Client-Side Privacy (Zero Server Uploads)',
    clearcut: true,
    cloudTools: false,
  },
  {
    feature: 'Full-Resolution PNG & WebP Exports Without Credits',
    clearcut: true,
    cloudTools: false,
  },
  {
    feature: 'Interactive Manual Erase & Restore Brush Studio',
    clearcut: true,
    cloudTools: 'Paid / Limited',
  },
  {
    feature: 'Batch Queue + Instant ZIP Download',
    clearcut: true,
    cloudTools: 'Paid Tier Only',
  },
  {
    feature: 'Zero Account Signup or Watermarks',
    clearcut: true,
    cloudTools: false,
  },
];

export const SeoLandingSections: React.FC<SeoLandingSectionsProps> = ({
  currentPath,
  onNavigateRoute,
  onOpenBatch,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const activeRoute = getSeoRoute(currentPath);

  useEffect(() => {
    setOpenFaqIdx(0);
  }, [currentPath]);

  const handleRouteClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigateRoute(path);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 mt-10 sm:mt-16 space-y-14 sm:space-y-20">
      {/* Section 0: Active Workflow SEO Overview & Checklist */}
      <section
        aria-labelledby="workflow-overview-heading"
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600">
              {activeRoute.shortTag}
            </span>
            <h2
              id="workflow-overview-heading"
              className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
            >
              {activeRoute.overviewTitle}
            </h2>
            {activeRoute.overviewParagraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-xs sm:text-sm text-slate-600 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl border border-slate-200/70 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Key Capabilities Included Free
            </h3>
            <ul className="space-y-2.5">
              {activeRoute.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap gap-3 text-xs font-semibold">
              <a
                href="/batch-background-remover"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateRoute('/batch-background-remover');
                }}
                className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Bulk Batch Remover</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={onOpenBatch}
                className="text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Open Batch Queue Tab
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: How 100% On-Device Background Removal Works */}
      <section aria-labelledby="how-it-works-heading">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2
            id="how-it-works-heading"
            className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight"
          >
            How Client-Side Background Removal Works
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Studio-grade cutouts directly in your browser—no file queues, no cloud storage, and no watermarks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <article className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">STEP 01</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Drop, Browse, or Paste (Ctrl+V)
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Load any JPG, PNG, WebP, or AVIF photo up to 15MB—or switch to the{' '}
              <a
                href="/batch-background-remover"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateRoute('/batch-background-remover');
                  onOpenBatch();
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Batch Background Remover
              </a>{' '}
              to process multiple product shots together as a ZIP.
            </p>
          </article>

          <article className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">STEP 02</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              On-Device WebAssembly AI
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Neural edge segmentation isolates subjects in sub-seconds locally on your CPU/GPU—keeping private photos completely off remote servers.
            </p>
          </article>

          <article className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">STEP 03</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Refine Edges &amp; Export Lossless
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Touch up fine hair with Erase/Restore brushes, swap backgrounds or add drop shadows, and download full-resolution PNG or WebP files.
            </p>
          </article>
        </div>
      </section>

      {/* Section 2: Complete 10-Route Workflow Pillar Grid */}
      <section aria-labelledby="use-cases-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2
              id="use-cases-heading"
              className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
            >
              Specialized Background Removal Workflows
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Explore tailored presets for passport IDs, transparent logos, car listings, e-commerce, and bulk batches.
            </p>
          </div>

          <a
            href="/alternatives/remove-bg-alternative"
            onClick={(e) => handleRouteClick(e, '/alternatives/remove-bg-alternative')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
          >
            <span>Compare vs. Cloud Background Removers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {USE_CASES.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleRouteClick(e, item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`group block rounded-2xl border p-5 sm:p-6 transition-all bg-white ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                    : 'border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.accent}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-600">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      {/* Section 3: ClearCut AI vs Cloud Tools Comparison */}
      <section aria-labelledby="comparison-heading">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h2
                  id="comparison-heading"
                  className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
                >
                  ClearCut AI vs. Credit-Based Cloud Tools
                </h2>
                <p className="text-xs text-slate-600">
                  Why creators switch to browser-native background removal
                </p>
              </div>
            </div>

            <a
              href="/alternatives/remove-bg-alternative"
              onClick={(e) => handleRouteClick(e, '/alternatives/remove-bg-alternative')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Full Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-5 sm:px-7">Capability</th>
                  <th className="py-3 px-4 text-center text-blue-700">ClearCut AI</th>
                  <th className="py-3 px-4 text-center">Typical Cloud Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 sm:px-7 font-medium text-slate-700">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700"
                        aria-label="Included free"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.cloudTools === false ? (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600"
                          aria-label="Not included"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-600">
                          {row.cloudTools}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 4: Frequently Asked Questions (Matches FAQPage JSON-LD 1:1 per route) */}
      <section aria-labelledby="faq-heading" className="pb-2">
        <div className="text-center max-w-2xl mx-auto mb-7">
          <h2
            id="faq-heading"
            className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Answers about on-device privacy, HD formats, and {activeRoute.navLabel.toLowerCase()}.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-2.5">
          {activeRoute.faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-600 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 mt-0.5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
