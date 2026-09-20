import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  ExternalLink,
  Archive,
} from 'lucide-react';
import JSZip from 'jszip';
import { ImageItem, BackgroundSettings, ApiSettings } from '../types';
import {
  removeBackgroundClient,
  loadImage,
  formatBytes,
} from '../utils/imageProcessor';

interface BatchQueueProps {
  queue: ImageItem[];
  setQueue: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  onOpenInEditor: (item: ImageItem) => void;
  bgSettings: BackgroundSettings;
  apiSettings?: ApiSettings;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  queue,
  setQueue,
  onOpenInEditor,
  apiSettings,
  onToast,
}) => {
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    if (queue.length + files.length > 10) {
      onToast('Batch queue limit is 10 images at a time.', 'info');
    }

    const availableSlots = Math.max(0, 10 - queue.length);
    const validFiles: File[] = files.slice(0, availableSlots);

    const newItems: ImageItem[] = validFiles.map((file: File) => {
      const url = URL.createObjectURL(file);
      return {
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        originalUrl: url,
        processedUrl: null,
        maskDataUrl: null,
        status: 'idle',
        progress: 0,
        progressStage: 'Queued',
        dimensions: { width: 0, height: 0 },
        error: null,
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const processItem = async (item: ImageItem) => {
    setQueue((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, status: 'processing', progress: 10, progressStage: 'Starting AI segmentation...' }
          : it
      )
    );

    try {
      const img = await loadImage(item.originalUrl);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const result = await removeBackgroundClient(
        img,
        (progress, stage) => {
          setQueue((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, progress, progressStage: stage }
                : it
            )
          );
        },
        apiSettings
      );

      setQueue((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'completed',
                progress: 100,
                progressStage: 'Complete',
                processedUrl: result.processedUrl,
                maskDataUrl: result.maskDataUrl,
                dimensions: { width: w, height: h },
              }
            : it
        )
      );
    } catch (err: any) {
      console.error('Batch item error:', err);
      setQueue((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'error',
                error: err.message || 'Failed to remove background',
                progressStage: 'Error',
              }
            : it
        )
      );
    }
  };

  const handleProcessAll = async () => {
    setIsProcessingAll(true);
    const uncompleted = queue.filter((it) => it.status !== 'completed');

    for (const item of uncompleted) {
      await processItem(item);
    }

    setIsProcessingAll(false);
    onToast('Batch background removal completed!', 'success');
  };

  const handleDeleteItem = (id: string) => {
    setQueue((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearAll = () => {
    setQueue([]);
  };

  const handleDownloadSingle = async (item: ImageItem) => {
    if (!item.processedUrl) return;
    try {
      const link = document.createElement('a');
      link.href = item.processedUrl;
      const base = item.name.replace(/\.[^/.]+$/, '') || 'cutout';
      link.download = `${base}-removed.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      onToast('Download failed', 'error');
    }
  };

  const handleDownloadAllZip = async () => {
    const completedItems = queue.filter((it) => it.status === 'completed' && it.processedUrl);
    if (!completedItems.length) {
      onToast('No processed images to download yet.', 'info');
      return;
    }

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder('clearcut-batch-transparent');

      for (let i = 0; i < completedItems.length; i++) {
        const it = completedItems[i];
        if (!it.processedUrl) continue;
        const res = await fetch(it.processedUrl);
        const blob = await res.blob();
        const cleanName = it.name.replace(/\.[^/.]+$/, '') || `image-${i + 1}`;
        folder?.file(`${cleanName}-cutout.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `clearcut-batch-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      onToast(`Downloaded ${completedItems.length} images as ZIP archive!`, 'success');
    } catch (err) {
      console.error('ZIP generation error:', err);
      onToast('Failed to create ZIP package.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = queue.filter((it) => it.status === 'completed').length;

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Batch Processing Queue</h2>
            <span className="text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-indigo-100">
              {queue.length} / 10 images
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Process multiple images simultaneously and download all transparent PNGs in a ZIP file.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {queue.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isProcessingAll}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={queue.length >= 10 || isProcessingAll}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
            <span>Add Files</span>
          </button>

          <button
            id="btn-process-all-batch"
            onClick={handleProcessAll}
            disabled={!queue.length || isProcessingAll || completedCount === queue.length}
            className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isProcessingAll ? 'Processing...' : 'Process All'}</span>
          </button>

          {completedCount > 0 && (
            <button
              id="btn-download-all-zip"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isZipping ? 'Archiving...' : `ZIP (${completedCount})`}</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAddFiles}
      />

      {/* Empty State */}
      {queue.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center bg-white/60 cursor-pointer transition-all"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
            Batch Queue is Empty
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Upload multiple photos (up to 10 at once) to remove backgrounds in bulk for ecommerce catalogs, team avatars, or product photography.
          </p>
          <span className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            Select Images to Queue
          </span>
        </div>
      ) : (
        /* Queue Grid List */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {queue.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Image Preview Row */}
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
                {/* Original Thumbnail */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                  <img
                    src={item.originalUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                    Original
                  </span>
                </div>

                {/* Cutout Thumbnail */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-checker-light border border-slate-200 shrink-0 relative flex items-center justify-center">
                  {item.processedUrl ? (
                    <>
                      <img
                        src={item.processedUrl}
                        alt="Cutout"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-indigo-600/80 text-white text-[8px] font-bold text-center py-0.5">
                        Cutout
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium text-center px-1">
                      {item.status === 'processing' ? 'Processing...' : 'Waiting'}
                    </span>
                  )}
                </div>

                {/* Name & Size */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-0.5">
                    {formatBytes(item.size)}
                  </span>
                  {item.dimensions.width > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 block">
                      {item.dimensions.width} × {item.dimensions.height} px
                    </span>
                  )}
                </div>
              </div>

              {/* Progress & Status */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="text-slate-500 font-medium truncate">
                    {item.progressStage}
                  </span>
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                  {item.status === 'processing' && (
                    <span className="text-indigo-600 font-mono font-bold">
                      {item.progress}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      item.status === 'completed'
                        ? 'bg-emerald-500'
                        : item.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-1">
                  {item.status === 'completed' ? (
                    <>
                      <button
                        onClick={() => onOpenInEditor(item)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Edit Studio</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSingle(item)}
                        title="Download PNG"
                        className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : item.status === 'idle' || item.status === 'error' ? (
                    <button
                      onClick={() => processItem(item)}
                      disabled={isProcessingAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Process</span>
                    </button>
                  ) : null}
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={item.status === 'processing'}
                  title="Remove from queue"
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
