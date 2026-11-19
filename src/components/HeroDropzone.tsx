import React, { useRef, useState, useEffect } from 'react';
import { Upload, Clipboard, Sparkles, ShieldCheck, Zap, Layers, Loader2 } from 'lucide-react';
import { SampleImage } from '../types';
import { SAMPLE_IMAGES } from '../data/presets';
import { SeoRouteConfig, SEO_ROUTES } from '../data/seoContent';

interface HeroDropzoneProps {
  onFileSelected: (file: File) => void;
  onBatchFilesSelected?: (files: File[]) => void;
  onOpenBatch?: () => void;
  onSampleSelected: (sample: SampleImage) => void;
  onError: (msg: string) => void;
  isLoading?: boolean;
  loadingSampleId?: string | null;
  onPrefetchStudio?: () => void;
  seoRoute?: SeoRouteConfig;
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({
  onFileSelected,
  onBatchFilesSelected,
  onOpenBatch,
  onSampleSelected,
  onError,
  isLoading = false,
  loadingSampleId = null,
  onPrefetchStudio,
  seoRoute = SEO_ROUTES['/'],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadedThumbs, setLoadedThumbs] = useState<Record<string, boolean>>({});
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBatchPage = seoRoute.path === '/batch-background-remover';

  // Handle global clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            validateAndProcessFiles([file]);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const validateSingleFile = (file: File): boolean => {
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      onError(`"${file.name}" exceeds the 15MB limit. Please upload a smaller image.`);
      return false;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
      onError(`Unsupported format for "${file.name}". Please upload JPG, PNG, WebP, or AVIF.`);
      return false;
    }

    return true;
  };

  const validateAndProcessFiles = (fileList: File[]) => {
    const valid = fileList.filter(validateSingleFile);
    if (valid.length === 0) return;

    if ((valid.length > 1 || isBatchPage) && onBatchFilesSelected) {
      if (valid.length > 1 || (isBatchPage && valid.length >= 1)) {
        if (valid.length > 1) {
          onBatchFilesSelected(valid);
          return;
        }
      }
    }

    onFileSelected(valid[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-5 sm:py-8 px-3 sm:px-6">
      {/* Hero Headline */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2 sm:mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>{seoRoute.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {seoRoute.h1Prefix}{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {seoRoute.h1Highlight}
          </span>
        </h1>
        <p className="mt-2 sm:mt-2.5 text-xs sm:text-base text-slate-600 max-w-2xl mx-auto">
          {seoRoute.subtitle}
        </p>

        {isBatchPage && onOpenBatch && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onOpenBatch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Open Batch Queue &amp; ZIP Studio</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        id="dropzone-container"
        role="button"
        tabIndex={0}
        aria-busy={isLoading}
        aria-label="Upload or drop image files to remove background"
        onDrop={handleDrop}
        onDragOver={(e) => {
          onPrefetchStudio?.();
          handleDragOver(e);
        }}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => onPrefetchStudio?.()}
        onFocus={() => onPrefetchStudio?.()}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center transition-all duration-200 bg-white/70 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01] shadow-lg shadow-indigo-100'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={isBatchPage}
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndProcessFiles(Array.from(e.target.files));
            }
          }}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            {isBatchPage
              ? 'Drag and drop one or multiple images here'
              : 'Drag and drop your image here'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
            or{' '}
            <span className="text-indigo-600 font-semibold underline underline-offset-2">
              browse files
            </span>{' '}
            on your device
          </p>

          {/* Quick keyboard paste badge */}
          <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] sm:text-xs font-medium border border-slate-200 mb-3 sm:mb-4">
            <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tip: Press </span>
            <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] sm:text-[11px] font-bold text-slate-700 shadow-xs border border-slate-300">
              Ctrl + V
            </kbd>
            <span> to paste from clipboard</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-600">
            <span>Supports JPG, PNG, WebP</span>
            <span>•</span>
            <span>Up to 15MB</span>
            <span>•</span>
            <span>High Resolution</span>
          </div>
        </div>
      </div>

      {/* Pre-loaded Sample Images for Instant Testing */}
      <div className="mt-6 sm:mt-8">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 px-1 gap-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Try with sample images
          </span>
          <span className="text-[11px] sm:text-xs text-slate-600">
            (Test fine hair, complex shadows &amp; transparent fur)
          </span>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
          {SAMPLE_IMAGES.map((sample) => {
            const isSampleLoading = isLoading && loadingSampleId === sample.id;
            const isThumbLoaded = Boolean(loadedThumbs[sample.id]);
            const isThumbFailed = Boolean(failedThumbs[sample.id]);

            return (
              <button
                key={sample.id}
                type="button"
                id={`sample-btn-${sample.id}`}
                onClick={() => onSampleSelected(sample)}
                onMouseEnter={() => onPrefetchStudio?.()}
                disabled={isLoading}
                aria-busy={isSampleLoading}
                className={`group relative flex flex-col items-start bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all text-left overflow-hidden ${
                  isLoading ? 'cursor-wait opacity-80' : 'cursor-pointer'
                } ${
                  seoRoute.recommendedSampleId === sample.id
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm'
                    : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                <div className="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 mb-1.5 sm:mb-2 relative">
                  {!isThumbLoaded && !isThumbFailed && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-slate-200/80 animate-pulse"
                    />
                  )}
                  {isThumbFailed ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[11px] font-semibold text-slate-600 px-2 text-center">
                      {sample.category}
                    </div>
                  ) : (
                    <img
                      src={sample.thumbnail}
                      alt={`${sample.title} — ${sample.category} background removal sample`}
                      width={200}
                      height={200}
                      onLoad={() =>
                        setLoadedThumbs((prev) => ({ ...prev, [sample.id]: true }))
                      }
                      onError={() =>
                        setFailedThumbs((prev) => ({ ...prev, [sample.id]: true }))
                      }
                      className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
                        isThumbLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      decoding="async"
                      crossOrigin="anonymous"
                    />
                  )}
                  <span className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[9px] sm:text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                    {sample.category}
                  </span>
                  {isSampleLoading && (
                    <div className="absolute inset-0 bg-slate-900/45 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate w-full group-hover:text-indigo-600 transition-colors">
                  {sample.title}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-600 truncate w-full">
                  {isSampleLoading ? 'Loading sample...' : sample.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Highlights / Value props */}
      <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-slate-200">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Sub-Second Processing</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Client &amp; browser-native AI segmentation with smooth edge feathering.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Fine Edge Refinement</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Interactive Erase &amp; Restore brush studio for hair &amp; transparent fabrics.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Privacy &amp; Lossless Export</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Full resolution PNG, WebP, and custom composited backgrounds free.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
