import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Maximize2,
  Lock,
  Unlock,
  ArrowLeftRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Grid3X3,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Sliders,
  Ratio,
} from 'lucide-react';
import { AspectRatioOption, AspectRatioPresetId, CropRect } from '../types';
import { cropAllLayers, loadImage } from '../utils/imageProcessor';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  processedUrl: string;
  maskUrl: string | null;
  dimensions: { width: number; height: number };
  onApplyCrop: (
    croppedProcessedUrl: string,
    croppedMaskUrl: string | null,
    croppedOriginalUrl: string,
    newDimensions: { width: number; height: number },
    ratioLabel: string
  ) => void;
  onToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const ASPECT_RATIO_PRESETS: AspectRatioOption[] = [
  { id: 'free', name: 'Freeform', ratio: null, description: 'Custom unconstrained crop' },
  { id: '1:1', name: '1:1 Square', ratio: 1, badge: 'Square', description: 'Instagram, Avatars, Icons' },
  { id: '4:5', name: '4:5 Portrait', ratio: 4 / 5, badge: 'Social', description: 'Instagram feed, Social cards' },
  { id: '16:9', name: '16:9 Widescreen', ratio: 16 / 9, badge: 'Banner', description: 'YouTube, Presentations, Hero' },
  { id: '9:16', name: '9:16 Story', ratio: 9 / 16, badge: 'Reels', description: 'Stories, TikTok, Mobile video' },
  { id: '4:3', name: '4:3 Classic', ratio: 4 / 3, description: 'Standard photo & tablets' },
  { id: '3:2', name: '3:2 Photo', ratio: 3 / 2, description: 'Classic 35mm DSLR ratio' },
  { id: 'original', name: 'Original', ratio: 0, badge: 'Native', description: 'Lock original image ratio' },
];

interface QuickDimensionPreset {
  label: string;
  width: number;
  height: number;
  ratioId: AspectRatioPresetId;
}

const QUICK_SIZE_PRESETS: QuickDimensionPreset[] = [
  { label: '1080 × 1080', width: 1080, height: 1080, ratioId: '1:1' },
  { label: '1080 × 1350', width: 1080, height: 1350, ratioId: '4:5' },
  { label: '1920 × 1080', width: 1920, height: 1080, ratioId: '16:9' },
  { label: '1080 × 1920', width: 1080, height: 1920, ratioId: '9:16' },
  { label: '1200 × 630', width: 1200, height: 630, ratioId: 'free' },
];

type DragHandle =
  | 'nw'
  | 'ne'
  | 'se'
  | 'sw'
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'move'
  | null;

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  originalUrl,
  processedUrl,
  maskUrl,
  dimensions,
  onApplyCrop,
  onToast,
}) => {
  const [selectedRatioId, setSelectedRatioId] = useState<AspectRatioPresetId>('free');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [viewBg, setViewBg] = useState<'transparent' | 'dark' | 'light'>('transparent');

  // Natural image crop coordinates in original pixel space
  const [crop, setCrop] = useState<CropRect>({
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
  });

  // Custom dimension input fields
  const [inputWidth, setInputWidth] = useState<string>(String(dimensions.width));
  const [inputHeight, setInputHeight] = useState<string>(String(dimensions.height));

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const activeDragRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  // Target aspect ratio calculation helper
  const targetRatio = useMemo(() => {
    if (selectedRatioId === 'original') {
      return dimensions.width / dimensions.height;
    }
    const found = ASPECT_RATIO_PRESETS.find((p) => p.id === selectedRatioId);
    return found ? found.ratio : null;
  }, [selectedRatioId, dimensions]);

  // Reset or initialize crop when modal opens or dimensions change
  useEffect(() => {
    if (isOpen) {
      setCrop({
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      });
      setInputWidth(String(dimensions.width));
      setInputHeight(String(dimensions.height));
      setSelectedRatioId('free');
      setIsLocked(false);
      setZoom(1);
    }
  }, [isOpen, dimensions]);

  // Keep manual text inputs in sync with crop rectangle
  useEffect(() => {
    setInputWidth(String(Math.round(crop.width)));
    setInputHeight(String(Math.round(crop.height)));
  }, [crop.width, crop.height]);

  // Helper to compute a centered crop for a specific aspect ratio
  const computeFittedCropForRatio = useCallback(
    (ratio: number | null): CropRect => {
      const imgW = dimensions.width;
      const imgH = dimensions.height;

      if (!ratio || ratio <= 0) {
        return { x: 0, y: 0, width: imgW, height: imgH };
      }

      let newW = imgW;
      let newH = Math.round(newW / ratio);

      if (newH > imgH) {
        newH = imgH;
        newW = Math.round(newH * ratio);
      }

      const newX = Math.round((imgW - newW) / 2);
      const newY = Math.round((imgH - newH) / 2);

      return {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: Math.min(imgW, newW),
        height: Math.min(imgH, newH),
      };
    },
    [dimensions]
  );

  // Handle preset ratio selection
  const handleSelectRatio = (presetId: AspectRatioPresetId) => {
    setSelectedRatioId(presetId);
    if (presetId === 'free') {
      setIsLocked(false);
      return;
    }

    setIsLocked(true);
    let ratioValue: number | null = null;
    if (presetId === 'original') {
      ratioValue = dimensions.width / dimensions.height;
    } else {
      const found = ASPECT_RATIO_PRESETS.find((p) => p.id === presetId);
      ratioValue = found?.ratio ?? null;
    }

    if (ratioValue) {
      const newCrop = computeFittedCropForRatio(ratioValue);
      setCrop(newCrop);
    }
  };

  // Swap Orientation (Landscape ⇄ Portrait)
  const handleSwapOrientation = () => {
    const curW = crop.width;
    const curH = crop.height;
    const imgW = dimensions.width;
    const imgH = dimensions.height;

    // Swap aspect ratio
    const currentRatio = curW / curH;
    const invertedRatio = 1 / currentRatio;

    let targetW = curH;
    let targetH = curW;

    if (targetW > imgW || targetH > imgH) {
      const scale = Math.min(imgW / targetW, imgH / targetH);
      targetW = Math.round(targetW * scale);
      targetH = Math.round(targetH * scale);
    }

    const newX = Math.max(0, Math.min(imgW - targetW, Math.round((imgW - targetW) / 2)));
    const newY = Math.max(0, Math.min(imgH - targetH, Math.round((imgH - targetH) / 2)));

    setCrop({
      x: newX,
      y: newY,
      width: targetW,
      height: targetH,
    });

    // Update preset selection if matches standard inverse
    if (selectedRatioId === '16:9') setSelectedRatioId('9:16');
    else if (selectedRatioId === '9:16') setSelectedRatioId('16:9');
    else if (selectedRatioId === '4:5') setSelectedRatioId('free');
    else {
      setSelectedRatioId('free');
    }
  };

  // Quick alignment shortcuts
  const handleAlign = (type: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    const imgW = dimensions.width;
    const imgH = dimensions.height;
    setCrop((prev) => {
      let nx = prev.x;
      let ny = prev.y;
      if (type === 'center') {
        nx = Math.round((imgW - prev.width) / 2);
        ny = Math.round((imgH - prev.height) / 2);
      } else if (type === 'top') {
        ny = 0;
      } else if (type === 'bottom') {
        ny = imgH - prev.height;
      } else if (type === 'left') {
        nx = 0;
      } else if (type === 'right') {
        nx = imgW - prev.width;
      }
      return {
        ...prev,
        x: Math.max(0, Math.min(imgW - prev.width, nx)),
        y: Math.max(0, Math.min(imgH - prev.height, ny)),
      };
    });
  };

  // Reset to full image bounds
  const handleResetCrop = () => {
    setCrop({
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
    });
    setSelectedRatioId('free');
    setIsLocked(false);
  };

  // Custom dimension change by inputs
  const handleCustomDimensionChange = (field: 'width' | 'height', valStr: string) => {
    if (field === 'width') setInputWidth(valStr);
    else setInputHeight(valStr);

    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 10) return;

    const imgW = dimensions.width;
    const imgH = dimensions.height;

    setCrop((prev) => {
      let newW = prev.width;
      let newH = prev.height;

      if (field === 'width') {
        newW = Math.min(imgW, Math.max(20, val));
        if (isLocked && targetRatio) {
          newH = Math.round(newW / targetRatio);
          if (newH > imgH) {
            newH = imgH;
            newW = Math.round(newH * targetRatio);
          }
        }
      } else {
        newH = Math.min(imgH, Math.max(20, val));
        if (isLocked && targetRatio) {
          newW = Math.round(newH * targetRatio);
          if (newW > imgW) {
            newW = imgW;
            newH = Math.round(newW / targetRatio);
          }
        }
      }

      // Re-center if boundaries exceed
      let newX = prev.x;
      let newY = prev.y;
      if (newX + newW > imgW) newX = Math.max(0, imgW - newW);
      if (newY + newH > imgH) newY = Math.max(0, imgH - newH);

      return {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      };
    });
  };

  // Quick preset sizes
  const handleApplySizePreset = (preset: QuickDimensionPreset) => {
    const imgW = dimensions.width;
    const imgH = dimensions.height;

    // Calculate aspect ratio
    const ratio = preset.width / preset.height;
    setSelectedRatioId(preset.ratioId);
    setIsLocked(preset.ratioId !== 'free');

    const fitted = computeFittedCropForRatio(ratio);
    setCrop(fitted);
  };

  // Pointer drag handling for handles and crop movement
  const handlePointerDown = (e: React.PointerEvent, handle: DragHandle) => {
    e.preventDefault();
    e.stopPropagation();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    activeDragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragRef.current || !imageRef.current) return;
    e.preventDefault();

    const { handle, startX, startY, startCrop } = activeDragRef.current;
    const imgEl = imageRef.current;
    const rect = imgEl.getBoundingClientRect();

    // Scale factor between screen pixels and natural image pixels
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;

    const deltaX = (e.clientX - startX) * scaleX;
    const deltaY = (e.clientY - startY) * scaleY;

    const imgW = dimensions.width;
    const imgH = dimensions.height;
    const ratio = isLocked ? targetRatio || startCrop.width / startCrop.height : null;

    let nx = startCrop.x;
    let ny = startCrop.y;
    let nw = startCrop.width;
    let nh = startCrop.height;

    if (handle === 'move') {
      nx = Math.max(0, Math.min(imgW - nw, startCrop.x + deltaX));
      ny = Math.max(0, Math.min(imgH - nh, startCrop.y + deltaY));
    } else {
      // Dragging specific edge or corner handle
      if (handle === 'se' || handle === 'e' || handle === 'ne') {
        nw = Math.max(30, Math.min(imgW - startCrop.x, startCrop.width + deltaX));
      }
      if (handle === 'sw' || handle === 'w' || handle === 'nw') {
        const potentialW = Math.max(30, startCrop.width - deltaX);
        const shiftX = startCrop.width - potentialW;
        if (startCrop.x + shiftX >= 0) {
          nw = potentialW;
          nx = startCrop.x + shiftX;
        }
      }
      if (handle === 'se' || handle === 's' || handle === 'sw') {
        nh = Math.max(30, Math.min(imgH - startCrop.y, startCrop.height + deltaY));
      }
      if (handle === 'ne' || handle === 'n' || handle === 'nw') {
        const potentialH = Math.max(30, startCrop.height - deltaY);
        const shiftY = startCrop.height - potentialH;
        if (startCrop.y + shiftY >= 0) {
          nh = potentialH;
          ny = startCrop.y + shiftY;
        }
      }

      // Enforce aspect ratio lock if active
      if (ratio && ratio > 0) {
        if (handle === 'e' || handle === 'w') {
          nh = Math.round(nw / ratio);
          if (ny + nh > imgH) {
            nh = imgH - ny;
            nw = Math.round(nh * ratio);
          }
        } else if (handle === 'n' || handle === 's') {
          nw = Math.round(nh * ratio);
          if (nx + nw > imgW) {
            nw = imgW - nx;
            nh = Math.round(nw / ratio);
          }
        } else {
          // Corner handles: lock height to width
          nh = Math.round(nw / ratio);
          if (ny + nh > imgH) {
            nh = imgH - ny;
            nw = Math.round(nh * ratio);
          }
          if (handle === 'ne' || handle === 'nw') {
            ny = startCrop.y + (startCrop.height - nh);
          }
          if (handle === 'nw' || handle === 'sw') {
            nx = startCrop.x + (startCrop.width - nw);
          }
        }
      }
    }

    setCrop({
      x: Math.max(0, Math.min(imgW - 20, Math.round(nx))),
      y: Math.max(0, Math.min(imgH - 20, Math.round(ny))),
      width: Math.max(20, Math.min(imgW - nx, Math.round(nw))),
      height: Math.max(20, Math.min(imgH - ny, Math.round(nh))),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      activeDragRef.current = null;
    }
  };

  // Apply Crop Action
  const handleApply = async () => {
    try {
      setIsCropping(true);

      const finalRect: CropRect = {
        x: Math.max(0, Math.round(crop.x)),
        y: Math.max(0, Math.round(crop.y)),
        width: Math.max(1, Math.round(crop.width)),
        height: Math.max(1, Math.round(crop.height)),
      };

      const { croppedOriginalUrl, croppedProcessedUrl, croppedMaskUrl, dimensions: newDims } =
        await cropAllLayers(originalUrl, processedUrl, maskUrl, finalRect);

      const ratioLabel =
        selectedRatioId === 'free'
          ? 'Custom'
          : ASPECT_RATIO_PRESETS.find((p) => p.id === selectedRatioId)?.name || 'Custom';

      onApplyCrop(croppedProcessedUrl, croppedMaskUrl, croppedOriginalUrl, newDims, ratioLabel);
      onClose();
    } catch (err) {
      console.error('Error applying crop:', err);
      onToast('Failed to crop canvas. Please try again.', 'error');
    } finally {
      setIsCropping(false);
    }
  };

  // Keyboard accessibility (Esc to close, Enter to apply)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, crop]);

  if (!isOpen) return null;

  // Percentage calculations for overlay box inside image container
  const leftPct = (crop.x / dimensions.width) * 100;
  const topPct = (crop.y / dimensions.height) * 100;
  const widthPct = (crop.width / dimensions.width) * 100;
  const heightPct = (crop.height / dimensions.height) * 100;

  // Real-time crop stats
  const currentRatioNumber = (crop.width / crop.height).toFixed(2);
  const currentMegaPixels = ((crop.width * crop.height) / 1000000).toFixed(2);
  const percentKept = Math.round(((crop.width * crop.height) / (dimensions.width * dimensions.height)) * 100);

  return (
    <div
      id="crop-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        id="crop-modal-container"
        className="relative w-full max-w-6xl h-[96vh] sm:h-[92vh] max-h-none sm:max-h-[920px] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Ratio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Crop Canvas & Aspect Ratio</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {Math.round(crop.width)} × {Math.round(crop.height)} px
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Trim the output canvas with standard social ratios or exact custom pixel dimensions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-crop-modal"
              onClick={onClose}
              disabled={isCropping}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: Preview Stage on Left, Controls on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Canvas Cropping Stage */}
          <div
            ref={containerRef}
            className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950 p-2 sm:p-6 select-none min-h-[220px] sm:min-h-[300px] lg:min-h-0"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Top Toolbar overlay on stage */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
              {/* Checkerboard/dark/light mode */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
                <button
                  onClick={() => setViewBg('transparent')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    viewBg === 'transparent' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Checker
                </button>
                <button
                  onClick={() => setViewBg('dark')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    viewBg === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setViewBg('light')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    viewBg === 'light' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Light
                </button>
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  showGrid
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'text-slate-400 hover:text-white border-transparent'
                }`}
                title="Toggle Rule-of-Thirds Grid"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 pl-1 border-l border-slate-800">
                <button
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Floating Dimension Badge */}
            <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 shadow-lg">
              <span className="text-amber-400 font-bold">{Math.round(crop.width)}</span>
              <span>×</span>
              <span className="text-amber-400 font-bold">{Math.round(crop.height)}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{currentRatioNumber}:1</span>
            </div>

            {/* Interactive Image & Cropper Stage Area */}
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Background Container Box */}
              <div
                className={`relative inline-block overflow-hidden shadow-2xl rounded-sm border border-slate-700/50 ${
                  viewBg === 'transparent'
                    ? 'checker-contrast'
                    : viewBg === 'dark'
                    ? 'bg-slate-900'
                    : 'bg-white'
                }`}
              >
                {/* Visual Image Cutout */}
                <img
                  ref={imageRef}
                  src={processedUrl}
                  alt="Crop preview subject"
                  className="max-h-[62vh] max-w-[80vw] object-contain block pointer-events-none select-none"
                  draggable={false}
                />

                {/* Dark Mask Overlays for Area Outside Crop Box */}
                {/* Top Mask */}
                <div
                  className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none transition-none"
                  style={{ height: `${topPct}%` }}
                />
                {/* Bottom Mask */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none transition-none"
                  style={{ height: `${100 - (topPct + heightPct)}%` }}
                />
                {/* Left Mask */}
                <div
                  className="absolute left-0 bg-black/65 pointer-events-none transition-none"
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    width: `${leftPct}%`,
                  }}
                />
                {/* Right Mask */}
                <div
                  className="absolute right-0 bg-black/65 pointer-events-none transition-none"
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    width: `${100 - (leftPct + widthPct)}%`,
                  }}
                />

                {/* Active Interactive Crop Box */}
                <div
                  id="crop-selection-box"
                  className="absolute border-2 border-amber-400 shadow-2xl cursor-move touch-none select-none group"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Rule-of-Thirds Grid Lines */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
                      <div className="border-r border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-b border-white/30" />
                      <div className="border-r border-white/30" />
                      <div className="border-r border-white/30" />
                      <div />
                    </div>
                  )}

                  {/* High-visibility Corner Brackets */}
                  {/* Top-Left */}
                  <div
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-xs shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  />
                  {/* Top-Right */}
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-xs shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  />
                  {/* Bottom-Right */}
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-xs shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                  />
                  {/* Bottom-Left */}
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-xs shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  />

                  {/* Midpoint Edge Handles */}
                  {/* Top */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400/90 border border-slate-900 rounded-full cursor-ns-resize shadow-sm hover:bg-amber-300"
                    onPointerDown={(e) => handlePointerDown(e, 'n')}
                  />
                  {/* Bottom */}
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400/90 border border-slate-900 rounded-full cursor-ns-resize shadow-sm hover:bg-amber-300"
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                  />
                  {/* Left */}
                  <div
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-amber-400/90 border border-slate-900 rounded-full cursor-ew-resize shadow-sm hover:bg-amber-300"
                    onPointerDown={(e) => handlePointerDown(e, 'w')}
                  />
                  {/* Right */}
                  <div
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-amber-400/90 border border-slate-900 rounded-full cursor-ew-resize shadow-sm hover:bg-amber-300"
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                  />

                  {/* Center Crosshair / Drag indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-2.5 h-2.5 rounded-full border border-amber-300 bg-amber-400/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Control Panel */}
          <div className="w-full lg:w-80 lg:min-w-[320px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-3.5 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-[46vh] lg:max-h-none">
            <div className="space-y-5">
              {/* Aspect Ratio Presets Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Aspect Ratio
                  </label>
                  <button
                    onClick={handleSwapOrientation}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded-md hover:bg-slate-800 transition-colors"
                    title="Swap orientation (Landscape ⇄ Portrait)"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Flip Ratio</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {ASPECT_RATIO_PRESETS.map((preset) => {
                    const isSelected = selectedRatioId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        id={`btn-ratio-${preset.id.replace(':', '-')}`}
                        onClick={() => handleSelectRatio(preset.id)}
                        className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-xs'
                            : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400' : ''}`}>
                            {preset.name}
                          </span>
                          {preset.badge && (
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-700/80 text-slate-300">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        {preset.description && (
                          <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">
                            {preset.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Dimensions (Width × Height in px) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Custom Dimensions
                  </label>
                  <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                      isLocked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                    }`}
                    title={isLocked ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
                  >
                    {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                    <span>{isLocked ? 'Locked' : 'Free'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-500 mb-1">Width (px)</span>
                    <input
                      type="number"
                      id="input-crop-width"
                      value={inputWidth}
                      onChange={(e) => handleCustomDimensionChange('width', e.target.value)}
                      min={20}
                      max={dimensions.width}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <span className="text-slate-600 pt-5 font-bold">×</span>

                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-500 mb-1">Height (px)</span>
                    <input
                      type="number"
                      id="input-crop-height"
                      value={inputHeight}
                      onChange={(e) => handleCustomDimensionChange('height', e.target.value)}
                      min={20}
                      max={dimensions.height}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Standard Size Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Popular Canvas Sizes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleApplySizePreset(preset)}
                      className="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment Tools */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Position & Alignment
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleAlign('center')}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                    <span>Center</span>
                  </button>
                  <button
                    onClick={() => handleAlign('top')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    Top
                  </button>
                  <button
                    onClick={() => handleAlign('bottom')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    Bottom
                  </button>
                  <button
                    onClick={() => handleAlign('left')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    Left
                  </button>
                  <button
                    onClick={() => handleAlign('right')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                  >
                    Right
                  </button>
                  <button
                    onClick={handleResetCrop}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                    title="Reset to full canvas"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Real-Time Stats Summary Card */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Original Canvas:</span>
                  <span className="font-mono text-slate-300">{dimensions.width} × {dimensions.height} px</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cropped Output:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round(crop.width)} × {Math.round(crop.height)} px
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Output Area:</span>
                  <span className="font-mono text-slate-300">{currentMegaPixels} MP ({percentKept}% retained)</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-2.5 mt-4">
              <button
                onClick={onClose}
                disabled={isCropping}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-apply-crop"
                onClick={handleApply}
                disabled={isCropping}
                className="flex-2 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCropping ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Crop</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
