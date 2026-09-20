import React, { useState } from 'react';
import {
  Download,
  Clipboard,
  Check,
} from 'lucide-react';
import { ExportSettings, BackgroundSettings } from '../types';
import {
  renderCompositedCanvas,
  canvasToBlob,
  copyImageToClipboard,
  loadImage,
} from '../utils/imageProcessor';

interface ExportPanelProps {
  originalUrl: string;
  processedUrl: string;
  bgSettings: BackgroundSettings;
  dimensions: { width: number; height: number };
  fileName: string;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  originalUrl,
  processedUrl,
  bgSettings,
  dimensions,
  fileName,
  onToast,
}) => {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: bgSettings.type === 'transparent' ? 'png' : 'jpeg',
    quality: 0.92,
    resolution: 'original',
    includeBackground: bgSettings.type !== 'transparent',
    backgroundColorIfJpg: '#ffffff',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isTransparent = bgSettings.type === 'transparent';

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const cutoutImg = await loadImage(processedUrl);
      const origImg = await loadImage(originalUrl);

      let targetW = dimensions.width;
      let targetH = dimensions.height;
      if (exportSettings.resolution === 'standard') {
        const maxStandard = 1080;
        const scale = Math.min(1, maxStandard / Math.max(targetW, targetH));
        targetW = Math.round(targetW * scale);
        targetH = Math.round(targetH * scale);
      }

      const canvas = await renderCompositedCanvas(
        cutoutImg,
        origImg,
        isTransparent && exportSettings.format === 'png'
          ? { ...bgSettings, type: 'transparent' }
          : bgSettings,
        targetW,
        targetH
      );

      let mimeType = 'image/png';
      let ext = 'png';
      if (exportSettings.format === 'jpeg') {
        mimeType = 'image/jpeg';
        ext = 'jpg';
      } else if (exportSettings.format === 'webp') {
        mimeType = 'image/webp';
        ext = 'webp';
      }

      const blob = await canvasToBlob(canvas, mimeType, exportSettings.quality);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const baseName = fileName.replace(/\.[^/.]+$/, '') || 'clearcut-image';
      link.download = `${baseName}-removed-bg.${ext}`;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      onToast(`Saved image as ${ext.toUpperCase()}`, 'success');
    } catch (err: any) {
      console.error('Download error:', err);
      onToast('Failed to generate export file. Please retry.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      setCopied(true);
      const ok = await copyImageToClipboard(processedUrl);
      if (ok) {
        onToast('Transparent PNG copied to clipboard!', 'success');
      } else {
        onToast('Clipboard copy failed. Try downloading instead.', 'error');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast('Could not access clipboard API', 'error');
      setCopied(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Export & Download</h3>
        </div>
        <span className="text-[10px] sm:text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {exportSettings.resolution === 'original'
            ? `${dimensions.width} × ${dimensions.height} px`
            : `Web Optimized`}
        </span>
      </div>

      {/* Format Selection */}
      <div className="grid grid-cols-3 gap-2">
        {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => setExportSettings((p) => ({ ...p, format: fmt }))}
            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all uppercase ${
              exportSettings.format === fmt
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-xs'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {fmt === 'jpeg' ? 'JPG' : fmt}
          </button>
        ))}
      </div>

      {/* Resolution Choice */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="font-semibold text-slate-700">Export Scale</span>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setExportSettings((p) => ({ ...p, resolution: 'original' }))}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              exportSettings.resolution === 'original'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Full Res (100%)
          </button>
          <button
            onClick={() => setExportSettings((p) => ({ ...p, resolution: 'standard' }))}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              exportSettings.resolution === 'standard'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Standard HD
          </button>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          id="btn-download-image"
          onClick={handleDownload}
          disabled={isExporting}
          className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating...' : `Download ${exportSettings.format.toUpperCase()}`}</span>
        </button>

        <button
          id="btn-copy-clipboard"
          onClick={handleCopyClipboard}
          className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4 text-slate-500" />}
          <span>{copied ? 'Copied!' : 'Copy PNG'}</span>
        </button>
      </div>
    </div>
  );
};
