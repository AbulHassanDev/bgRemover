import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Download,
  X,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string | null;
  shareUrl: string | null;
  shareInfo: {
    fileName: string;
    format: string;
    fileSize?: number;
    width?: number;
    height?: number;
    previewUrl?: string;
  } | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
  shareUrl,
  shareInfo,
  isGenerating,
  onRegenerate,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast('Mobile download link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast('Failed to copy link. Please copy manually.', 'error');
    }
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${shareInfo?.fileName ? shareInfo.fileName.replace(/\.[^/.]+$/, '') : 'clearcut'}-mobile-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onToast('QR code image saved', 'success');
  };

  const formattedSize = shareInfo?.fileSize
    ? shareInfo.fileSize > 1024 * 1024
      ? `${(shareInfo.fileSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(shareInfo.fileSize / 1024).toFixed(1)} KB`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="qr-mobile-download-modal"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all transform animate-in zoom-in-95 duration-150 max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                Download to Mobile
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Scan with your phone to instantly download
              </p>
            </div>
          </div>

          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <RotateCw className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Preparing Mobile Download...</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Exporting high-resolution image with your chosen settings and rendering QR code
                </p>
              </div>
            </div>
          ) : qrDataUrl ? (
            <>
              {/* QR Code Presentation Box */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="relative p-3.5 bg-white rounded-2xl border-2 border-indigo-100 shadow-md flex flex-col items-center justify-center group">
                  {/* Subtle corner markers */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-500 rounded-tl" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-500 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-500 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-500 rounded-br" />

                  {/* High Quality QR Code Image */}
                  <img
                    id="mobile-qr-code-img"
                    src={qrDataUrl}
                    alt="Scan to download on mobile"
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                  />

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Point phone camera at code</span>
                  </div>
                </div>
              </div>

              {/* Subject File Details Badge */}
              {shareInfo && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {shareInfo.previewUrl ? (
                      <img
                        src={shareInfo.previewUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-contain bg-slate-200/60 p-0.5 border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {shareInfo.fileName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="uppercase font-bold text-indigo-600">
                          {shareInfo.format}
                        </span>
                        {formattedSize && (
                          <>
                            <span>•</span>
                            <span>{formattedSize}</span>
                          </>
                        )}
                        {shareInfo.width && shareInfo.height && (
                          <>
                            <span>•</span>
                            <span>
                              {shareInfo.width}×{shareInfo.height}px
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onRegenerate}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors shrink-0"
                    title="Regenerate if you changed export settings"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}

              {/* Direct Share Link & Copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Direct Mobile Link</span>
                  <button
                    onClick={handleDownloadQrImage}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save QR Code Image</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
                    {shareUrl || 'Generating link...'}
                  </div>

                  <button
                    id="btn-copy-mobile-link"
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                    title="Copy direct download link"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {shareUrl && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors shrink-0"
                      title="Open download page in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Mobile Device Quick Steps */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <span>🍏 Apple iOS</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-snug">
                    Open Camera, tap banner, then tap &quot;Download&quot; or long press to save to Photos.
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <span>🤖 Android</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-snug">
                    Scan with Camera or Lens, tap link, then tap &quot;Download to Device&quot;.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-rose-600 font-semibold">
                Unable to generate QR code at this moment.
              </p>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Notice */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Link active for 2 hours</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Direct &amp; Private</span>
          </div>
        </div>
      </div>
    </div>
  );
};
