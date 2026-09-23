import React from 'react';
import {
  Wand2,
  Mail,
  Github,
  Linkedin,
  Twitter,
  ArrowUp,
} from 'lucide-react';
import { CeoCard } from './CeoCard';

interface FooterProps {
  onLoadCeoSample?: (sampleUrl: string, sampleName: string) => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onLoadCeoSample,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200 bg-slate-50 text-slate-700">
      {/* Testimonial & Founder Section */}
      <section className="pt-12 sm:pt-16 pb-12 sm:pb-16 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            They love us. You will too.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
            Studio-quality background removal and edge matting with 100% on-device privacy.
          </p>

          <div className="mt-8 sm:mt-10">
            <CeoCard onLoadCeoSample={onLoadCeoSample} />
          </div>
        </div>
      </section>

      {/* Main Responsive Footer Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Info & Mission */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Wand2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                ClearCut AI
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Browser-native AI background removal and image editing. Built for photographers,
              e-commerce catalogs, and creators who value speed and total privacy.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                title="LinkedIn"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                title="GitHub"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                title="Twitter / X"
                aria-label="Twitter Profile"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tools & Workflows */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Studio Tools
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  AI Background Remover
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  High-Speed Batch Processing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Edge Refiner & Manual Brush
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Crop & Aspect Ratio Tool
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Architecture */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Privacy & Performance
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>100% Client-Side Processing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>Zero Cloud Storage or Uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>WebAssembly SIMD Acceleration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span>Lossless PNG & WebP Exports</span>
              </li>
            </ul>
          </div>

          {/* Leadership & Inquiries */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Executive Office
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Founded & led by <strong className="font-semibold text-slate-800">AbulHassan</strong>.
              For enterprise licensing, API integrations, or media inquiries:
            </p>
            <a
              href="mailto:malikabulhassanm100@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="break-all">malikabulhassanm100@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} ClearCut AI. Founded by AbulHassan. All rights reserved.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-slate-100"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
