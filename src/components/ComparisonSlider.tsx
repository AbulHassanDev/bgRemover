import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Columns,
  SplitSquareVertical,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Crop,
  Undo2,
  Redo2,
  Wand2,
} from 'lucide-react';
import { ViewMode, BackgroundSettings, HoverBgPreview } from '../types';
import { hexToRgba } from '../utils/imageProcessor';

interface ComparisonSliderProps {
  originalUrl: string;
  processedUrl: string;
  maskUrl: string | null;
  bgSettings: BackgroundSettings;
  compositedUrl?: string | null;
  hoverBgPreview?: HoverBgPreview | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenEdgeRefiner: () => void;
  onOpenCropModal?: () => void;
  onOpenEnhanceModal?: () => void;
  onResetImage: () => void;
  dimensions: { width: number; height: number };
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  processedUrl,
  maskUrl,
  bgSettings,
  compositedUrl,
  hoverBgPreview,
  viewMode,
  setViewMode,
  onOpenEdgeRefiner,
  onOpenCropModal,
  onOpenEnhanceModal,
  dimensions,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Hover preview background style for live CSS rendering behind cutout
  const hoverBgStyle: React.CSSProperties | undefined = hoverBgPreview
    ? hoverBgPreview.type === 'solid'
      ? { backgroundColor: hoverBgPreview.color, transition: 'background-color 0.15s ease-out' }
      : { background: hoverBgPreview.gradientCss, transition: 'background 0.15s ease-out' }
    : undefined;

  // Active display url for the right/after side:
  // When hoverBgPreview is active, use transparent cutout so CSS background shows through instantly
  const effectiveAfterUrl = hoverBgPreview ? processedUrl : (compositedUrl || processedUrl);

  // Live CSS drop-shadow filter when previewing or before composite canvas resolves
  const cutoutShadowStyle: React.CSSProperties | undefined =
    bgSettings.shadowEnabled &&
    bgSettings.shadowOpacity > 0 &&
    effectiveAfterUrl === processedUrl
      ? {
          filter: `drop-shadow(${Math.round(
            Math.cos(((bgSettings.shadowAngle ?? 135) * Math.PI) / 180) * bgSettings.shadowDistance
          )}px ${Math.round(
            Math.sin(((bgSettings.shadowAngle ?? 135) * Math.PI) / 180) * bgSettings.shadowDistance
          )}px ${bgSettings.shadowBlur}px ${hexToRgba(
            bgSettings.shadowColor || '#000000',
            bgSettings.shadowOpacity / 100
          )})`,
        }
      : undefined;

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.zoom-controls') || (e.target as HTMLElement).closest('.slider-handle-area')) {
      return;
    }
    if (e.button === 1 || e.altKey || e.shiftKey) {
      setIsPanning(true);
      startPanRef.current = {
        x: pan.x,
        y: pan.y,
        startX: e.clientX,
        startY: e.clientY,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : 0;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const percentage = (x / rect.width) * 100;
      setSliderPos(percentage);
    } else if (isPanning) {
      const dx = e.clientX - startPanRef.current.startX;
      const dy = e.clientY - startPanRef.current.startY;
      setPan({
        x: startPanRef.current.x + dx,
        y: startPanRef.current.y + dy,
      });
    }
  }, [isDragging, isPanning]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDragging || isPanning) {
        handlePointerMove(e);
      }
    };
    const handleGlobalPointerUp = () => {
      if (isDragging || isPanning) {
        handlePointerUp();
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, isPanning, handlePointerMove, handlePointerUp]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.002;
      setZoom((prev) => Math.max(0.5, Math.min(4, prev + zoomDelta)));
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(4, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/5 rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* Top Toolbar - Fully Responsive Wrap */}
      <div className="bg-white px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 z-10">
        {/* View Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto max-w-full">
          <button
            id="view-mode-slider"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all shrink-0 ${
              viewMode === 'slider'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Split</span>
            <span className="xs:hidden">Split</span>
          </button>

          <button
            id="view-mode-side"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all shrink-0 ${
              viewMode === 'side-by-side'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Side by Side</span>
            <span className="sm:hidden">Side</span>
          </button>

          <button
            id="view-mode-cutout"
            onClick={() => setViewMode('cutout-only')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all shrink-0 ${
              viewMode === 'cutout-only'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Cutout</span>
          </button>

          {maskUrl && (
            <button
              id="view-mode-mask"
              onClick={() => setViewMode('mask-only')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all shrink-0 ${
                viewMode === 'mask-only'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mask</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Quick Undo/Redo, Edge Refiner Studio & Dimensions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onUndo && onRedo && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                id="btn-slider-quick-undo"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo edit (Ctrl+Z / ⌘Z)"
                className={`p-1.5 rounded-md transition-all ${
                  canUndo
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
                    : 'text-slate-300 cursor-not-allowed opacity-40'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-slider-quick-redo"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo edit (Ctrl+Y / ⌘⇧Z)"
                className={`p-1.5 rounded-md transition-all ${
                  canRedo
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
                    : 'text-slate-300 cursor-not-allowed opacity-40'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onOpenEnhanceModal && (
            <button
              id="btn-open-ai-enhance"
              onClick={onOpenEnhanceModal}
              title="AI Picture Enhancer: Exposure, micro-contrast sharpness, vibrancy, and edge defringe"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-xs shadow-indigo-300 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Wand2 className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">AI Enhance</span>
              <span className="sm:hidden">Enhance</span>
            </button>
          )}

          <button
            id="btn-open-edge-refiner"
            onClick={onOpenEdgeRefiner}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-200 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Erase / Restore Brush</span>
            <span className="sm:hidden">Brush Refine</span>
          </button>

          {onOpenCropModal && (
            <button
              id="btn-open-crop-canvas"
              onClick={onOpenCropModal}
              title="Crop Canvas & Aspect Ratio (1:1, 4:5, 16:9, or custom dimensions)"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <Crop className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Crop Canvas</span>
              <span className="sm:hidden">Crop</span>
            </button>
          )}

          {/* Image Dimensions Info (clickable to open crop) */}
          <button
            onClick={onOpenCropModal}
            title={onOpenCropModal ? "Click to crop or change canvas dimensions" : undefined}
            className={`hidden md:flex items-center gap-1 text-[10px] sm:text-[11px] font-mono px-2 sm:px-2.5 py-1.5 rounded-lg border transition-colors shrink-0 ${
              onOpenCropModal
                ? 'text-slate-600 hover:text-amber-800 bg-slate-100 hover:bg-amber-50/70 border-slate-200 hover:border-amber-300 cursor-pointer'
                : 'text-slate-500 bg-slate-100 border-slate-200'
            }`}
          >
            {dimensions.width} × {dimensions.height} px
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        className={`relative flex-1 min-h-[320px] sm:min-h-[420px] max-h-[640px] flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing ${bgSettings.checkerPattern}`}
      >
        {/* Floating Zoom & Pan Controls */}
        <div className="zoom-controls absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md px-1.5 sm:px-2 py-1 rounded-xl shadow-md border border-slate-200 text-slate-700 text-xs">
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 sm:px-2 font-mono text-[10px] sm:text-[11px] font-semibold min-w-[36px] sm:min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-200 mx-0.5 sm:mx-1" />
          <button
            onClick={handleResetZoom}
            title="Reset Zoom & Pan"
            className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Live Hover Preview Pill Banner */}
        {hoverBgPreview && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-200">Live Preview:</span>
            <span className="font-bold text-indigo-300">{hoverBgPreview.name}</span>
            <span className="text-[10px] font-mono text-slate-300">
              {hoverBgPreview.type === 'solid' ? hoverBgPreview.color : `${hoverBgPreview.angle}°`}
            </span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90">
              Click option to apply
            </span>
          </div>
        )}

        {/* 1. Split Screen Slider Mode */}
        {viewMode === 'slider' && (
          <div
            className="relative w-full h-full flex items-center justify-center p-2 sm:p-4"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div
              className="relative max-w-full max-h-full aspect-auto shadow-2xl rounded-lg overflow-hidden flex items-center justify-center transition-colors duration-150"
              style={hoverBgStyle}
            >
              {/* After Image (Background cutout / composited) */}
              <img
                src={effectiveAfterUrl}
                alt="Cutout result"
                style={cutoutShadowStyle}
                className="max-h-[300px] sm:max-h-[560px] w-auto object-contain block pointer-events-none"
                crossOrigin="anonymous"
              />

              {/* Before Image (Original) - Clipped to left of slider */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={originalUrl}
                  alt="Original input"
                  className="max-h-[300px] sm:max-h-[560px] w-auto object-contain block max-w-none"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Divider Handle Line */}
              <div
                className="slider-handle-area absolute top-0 bottom-0 z-10 flex flex-col items-center justify-center cursor-ew-resize select-none"
                style={{
                  left: `${sliderPos}%`,
                  transform: 'translateX(-50%)',
                  touchAction: 'none',
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                }}
              >
                {/* Vertical Line */}
                <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />

                {/* Handle Circle Button */}
                <div className="absolute w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-xl border-2 border-indigo-600 flex items-center justify-center text-indigo-600 hover:scale-110 active:scale-95 transition-transform">
                  <div className="flex items-center gap-0.5">
                    <div className="w-0.5 h-3 bg-slate-400 rounded-full" />
                    <div className="w-0.5 h-3 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Side-by-Side Comparison Mode */}
        {viewMode === 'side-by-side' && (
          <div
            className="w-full h-full p-2 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center justify-center overflow-auto"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Left: Original */}
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-2.5 py-1 rounded-md mb-2 shadow-xs">
                Original
              </span>
              <div className="shadow-xl rounded-xl overflow-hidden bg-white/50 max-h-[220px] sm:max-h-[500px]">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-[200px] sm:max-h-[480px] w-auto object-contain block pointer-events-none"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* Right: Transparent Cutout */}
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-white/80 px-2.5 py-1 rounded-md mb-2 shadow-xs">
                Background Removed
              </span>
              <div
                className="shadow-xl rounded-xl overflow-hidden max-h-[220px] sm:max-h-[500px] transition-colors duration-150"
                style={hoverBgStyle}
              >
                <img
                  src={effectiveAfterUrl}
                  alt="Cutout Result"
                  style={cutoutShadowStyle}
                  className="max-h-[200px] sm:max-h-[480px] w-auto object-contain block pointer-events-none"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Cutout Only Mode */}
        {viewMode === 'cutout-only' && (
          <div
            className="w-full h-full flex items-center justify-center p-2 sm:p-4"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div
              className="shadow-2xl rounded-xl overflow-hidden transition-colors duration-150"
              style={hoverBgStyle}
            >
              <img
                src={effectiveAfterUrl}
                alt="Cutout only"
                style={cutoutShadowStyle}
                className="max-h-[300px] sm:max-h-[560px] w-auto object-contain block pointer-events-none"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        )}

        {/* 4. Alpha Mask Only Mode */}
        {viewMode === 'mask-only' && maskUrl && (
          <div
            className="w-full h-full flex items-center justify-center p-2 sm:p-4"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div className="shadow-2xl rounded-xl overflow-hidden bg-black">
              <img
                src={maskUrl}
                alt="Alpha Matte Mask"
                className="max-h-[300px] sm:max-h-[560px] w-auto object-contain block pointer-events-none"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
