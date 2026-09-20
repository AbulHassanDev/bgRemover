import React, { useRef, useState, useEffect } from 'react';
import { Upload, Clipboard, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { SampleImage } from '../types';
import { SAMPLE_IMAGES } from '../data/presets';

interface HeroDropzoneProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleImage) => void;
  onError: (msg: string) => void;
  isLoading?: boolean;
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({
  onFileSelected,
  onSampleSelected,
  onError,
  isLoading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            validateAndProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const validateAndProcessFile = (file: File) => {
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      onError('File size exceeds the 15MB limit. Please upload a smaller image.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
      onError('Unsupported image format. Please upload JPG, PNG, or WebP.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
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
          <span>Next-Gen Neural Edge Detection</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Remove Image Backgrounds with{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Precision Edge Hair Detail
          </span>
        </h1>
        <p className="mt-2 sm:mt-2.5 text-xs sm:text-base text-slate-600 max-w-2xl mx-auto">
          100% automatic subject segmentation. Delete backgrounds in seconds, refine fine hair & fur with manual brushes, and composite custom scenes.
        </p>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        id="dropzone-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center transition-all duration-200 bg-white/70 shadow-sm ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01] shadow-lg shadow-indigo-100'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndProcessFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            Drag and drop your image here
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
            or <span className="text-indigo-600 font-semibold underline underline-offset-2">browse files</span> on your device
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

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-400">
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
          <span className="text-[11px] sm:text-xs text-slate-400">
            (Test fine hair, complex shadows & transparent fur)
          </span>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              onClick={() => onSampleSelected(sample)}
              disabled={isLoading}
              className="group relative flex flex-col items-start bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left overflow-hidden cursor-pointer"
            >
              <div className="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 mb-1.5 sm:mb-2 relative">
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
                <span className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[9px] sm:text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                  {sample.category}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate w-full group-hover:text-indigo-600 transition-colors">
                {sample.title}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 truncate w-full">
                {sample.difficulty}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights / Value props */}
      <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-slate-200">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Sub-Second Processing</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Client & server accelerated inference with edge feathering.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Fine Edge Refinement</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Interactive Erase & Restore brush studio for hair & transparent fabrics.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Privacy & Lossless Export</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Full resolution PNG, WebP, and custom composited backgrounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
