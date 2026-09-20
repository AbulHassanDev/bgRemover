import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, SplitSquareVertical, Eye, ZoomIn, ZoomOut, Maximize2, Sparkles } from 'lucide-react';
import { ViewMode, BackgroundSettings } from '../types';

interface ComparisonSliderProps {
  originalUrl: string;
  processedUrl: string;
  maskUrl: string | null;
  bgSettings: BackgroundSettings;
  compositedUrl?: string | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenEdgeRefiner: () => void;
  onResetImage: () => void;
  dimensions: { width: number; height: number };
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  processedUrl,
  maskUrl,
  bgSettings,
  compositedUrl,
  viewMode,
  setViewMode,
  onOpenEdgeRefiner,
  dimensions,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Active display url for the right/after side
  const afterDisplayUrl = compositedUrl || processedUrl;

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

        {/* Action Buttons: Edge Refiner Studio & Dimensions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-open-edge-refiner"
            onClick={onOpenEdgeRefiner}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-200 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Erase / Restore Brush</span>
            <span className="sm:hidden">Brush Refine</span>
          </button>

          {/* Image Dimensions Info */}
          <div className="hidden md:flex items-center text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
            {dimensions.width} × {dimensions.height} px
          </div>
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
            <div className="relative max-w-full max-h-full aspect-auto shadow-2xl rounded-lg overflow-hidden flex items-center justify-center">
              {/* After Image (Background cutout / composited) */}
              <img
                src={afterDisplayUrl}
                alt="Cutout result"
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
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
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
              <div className="shadow-xl rounded-xl overflow-hidden max-h-[220px] sm:max-h-[500px]">
                <img
                  src={afterDisplayUrl}
                  alt="Cutout Result"
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
            <div className="shadow-2xl rounded-xl overflow-hidden">
              <img
                src={afterDisplayUrl}
                alt="Cutout only"
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
