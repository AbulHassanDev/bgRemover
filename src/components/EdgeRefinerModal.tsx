import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Eraser,
  Paintbrush,
  Move,
  Undo2,
  Redo2,
  RotateCcw,
  Check,
  X,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { BrushSettings } from '../types';
import { loadImage } from '../utils/imageProcessor';

interface EdgeRefinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  maskUrl: string | null;
  onApplyEdits: (newProcessedUrl: string, newMaskUrl: string) => void;
}

export const EdgeRefinerModal: React.FC<EdgeRefinerModalProps> = ({
  isOpen,
  onClose,
  originalUrl,
  maskUrl,
  onApplyEdits,
}) => {
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    mode: 'erase',
    size: 32,
    hardness: 40,
    opacity: 100,
    showMaskOverlay: true,
    maskColor: '#ef4444',
    maskOpacity: 50,
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const origImgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvases on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initCanvases() {
      const orig = await loadImage(originalUrl);
      if (!isMounted) return;
      origImgRef.current = orig;

      const w = orig.naturalWidth || orig.width;
      const h = orig.naturalHeight || orig.height;

      // In-memory mask canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;

      if (maskUrl) {
        const maskImg = await loadImage(maskUrl);
        maskCtx.drawImage(maskImg, 0, 0, w, h);
      } else {
        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillRect(0, 0, w, h);
      }

      maskCanvasRef.current = maskCanvas;

      // Push initial state to history
      const initialData = maskCtx.getImageData(0, 0, w, h);
      setHistory([initialData]);
      setHistoryIndex(0);

      // Fit zoom on open
      if (containerRef.current) {
        const cw = Math.max(200, containerRef.current.clientWidth - 30);
        const ch = Math.max(200, containerRef.current.clientHeight - 30);
        const fitScale = Math.min(1, cw / w, ch / h);
        setZoom(fitScale || 1);
        setPan({ x: 0, y: 0 });
      }

      renderComposite();
    }

    initCanvases();

    return () => {
      isMounted = false;
    };
  }, [isOpen, originalUrl, maskUrl]);

  // Render display canvas
  const renderComposite = useCallback(() => {
    const orig = origImgRef.current;
    const maskCanvas = maskCanvasRef.current;
    const dispCanvas = displayCanvasRef.current;
    if (!orig || !maskCanvas || !dispCanvas) return;

    const w = orig.naturalWidth || orig.width;
    const h = orig.naturalHeight || orig.height;

    dispCanvas.width = w;
    dispCanvas.height = h;
    const ctx = dispCanvas.getContext('2d')!;

    ctx.clearRect(0, 0, w, h);

    if (brushSettings.showMaskOverlay) {
      // 1. Draw original image first
      ctx.drawImage(orig, 0, 0, w, h);

      // 2. Tint background areas with Ruby mask
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
      const maskData = maskCtx.getImageData(0, 0, w, h).data;

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = w;
      overlayCanvas.height = h;
      const oCtx = overlayCanvas.getContext('2d')!;
      const oImgData = oCtx.createImageData(w, h);
      const oData = oImgData.data;

      // Parse mask color (e.g. #ef4444)
      const hex = brushSettings.maskColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 239;
      const g = parseInt(hex.substring(2, 4), 16) || 68;
      const b = parseInt(hex.substring(4, 6), 16) || 68;
      const baseAlpha = (brushSettings.maskOpacity / 100) * 255;

      for (let i = 0; i < maskData.length; i += 4) {
        const maskVal = maskData[i]; // 0 = background, 255 = foreground
        const bgFactor = (255 - maskVal) / 255; // 1 = background, 0 = foreground

        oData[i] = r;
        oData[i + 1] = g;
        oData[i + 2] = b;
        oData[i + 3] = Math.round(bgFactor * baseAlpha);
      }

      oCtx.putImageData(oImgData, 0, 0);
      ctx.drawImage(overlayCanvas, 0, 0);
    } else {
      // Show actual transparent cutout
      const cutoutCanvas = document.createElement('canvas');
      cutoutCanvas.width = w;
      cutoutCanvas.height = h;
      const cCtx = cutoutCanvas.getContext('2d')!;
      cCtx.drawImage(orig, 0, 0);

      const cData = cCtx.getImageData(0, 0, w, h);
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
      const maskData = maskCtx.getImageData(0, 0, w, h).data;

      for (let i = 0; i < cData.data.length; i += 4) {
        const alpha = maskData[i] / 255;
        cData.data[i + 3] = Math.round(cData.data[i + 3] * alpha);
      }
      cCtx.putImageData(cData, 0, 0);
      ctx.drawImage(cutoutCanvas, 0, 0);
    }
  }, [brushSettings.showMaskOverlay, brushSettings.maskColor, brushSettings.maskOpacity]);

  // Handle canvas drawing stroke
  const drawBrushStroke = (x: number, y: number, isStart = false) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;

    const prev = lastPointRef.current || { x, y };
    const dist = Math.hypot(x - prev.x, y - prev.y);
    const steps = Math.max(1, Math.ceil(dist / 3));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curX = prev.x + (x - prev.x) * t;
      const curY = prev.y + (y - prev.y) * t;

      const radius = brushSettings.size / 2;
      const gradient = maskCtx.createRadialGradient(curX, curY, 0, curX, curY, radius);

      const targetVal = brushSettings.mode === 'erase' ? 0 : 255;
      const hardnessRatio = brushSettings.hardness / 100;
      const opacity = (brushSettings.opacity / 100);

      const colorInner = `rgba(${targetVal}, ${targetVal}, ${targetVal}, ${opacity})`;
      const colorOuter = `rgba(${targetVal}, ${targetVal}, ${targetVal}, 0)`;

      gradient.addColorStop(0, colorInner);
      gradient.addColorStop(Math.min(0.99, Math.max(0.01, hardnessRatio)), colorInner);
      gradient.addColorStop(1, colorOuter);

      maskCtx.fillStyle = gradient;
      maskCtx.beginPath();
      maskCtx.arc(curX, curY, radius, 0, Math.PI * 2);
      maskCtx.fill();
    }

    lastPointRef.current = { x, y };
    renderComposite();
  };

  const getCanvasCoords = (e: React.PointerEvent) => {
    const disp = displayCanvasRef.current;
    if (!disp) return { x: 0, y: 0 };
    const rect = disp.getBoundingClientRect();
    const scaleX = disp.width / rect.width;
    const scaleY = disp.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (brushSettings.mode === 'pan' || e.button === 1 || e.spaceKey) {
      isPanningRef.current = true;
      startPanRef.current = {
        x: pan.x,
        y: pan.y,
        startX: e.clientX,
        startY: e.clientY,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;
    drawBrushStroke(coords.x, coords.y, true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setCursorPos({
      x: e.clientX,
      y: e.clientY,
      visible: true,
    });

    if (isPanningRef.current) {
      const dx = e.clientX - startPanRef.current.startX;
      const dy = e.clientY - startPanRef.current.startY;
      setPan({
        x: startPanRef.current.x + dx,
        y: startPanRef.current.y + dy,
      });
      return;
    }

    if (isDrawingRef.current && brushSettings.mode !== 'pan') {
      const coords = getCanvasCoords(e);
      drawBrushStroke(coords.x, coords.y);
    }
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;

      // Push new state to history
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
        const data = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const newHist = history.slice(0, historyIndex + 1);
        newHist.push(data);
        setHistory(newHist);
        setHistoryIndex(newHist.length - 1);
      }
    }
    isPanningRef.current = false;
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const targetState = history[newIdx];
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas && targetState) {
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
        maskCtx.putImageData(targetState, 0, 0);
        setHistoryIndex(newIdx);
        renderComposite();
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const targetState = history[newIdx];
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas && targetState) {
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
        maskCtx.putImageData(targetState, 0, 0);
        setHistoryIndex(newIdx);
        renderComposite();
      }
    }
  };

  const handleReset = () => {
    if (history.length > 0) {
      const initialState = history[0];
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas && initialState) {
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
        maskCtx.putImageData(initialState, 0, 0);
        setHistory([initialState]);
        setHistoryIndex(0);
        renderComposite();
      }
    }
  };

  const handleSaveAndApply = () => {
    const orig = origImgRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!orig || !maskCanvas) return;

    const w = orig.naturalWidth || orig.width;
    const h = orig.naturalHeight || orig.height;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d')!;
    outCtx.drawImage(orig, 0, 0);

    const outData = outCtx.getImageData(0, 0, w, h);
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
    const maskData = maskCtx.getImageData(0, 0, w, h).data;

    for (let i = 0; i < outData.data.length; i += 4) {
      const alpha = maskData[i] / 255;
      outData.data[i + 3] = Math.round(outData.data[i + 3] * alpha);
    }

    outCtx.putImageData(outData, 0, 0);

    const newProcessedUrl = outCanvas.toDataURL('image/png');
    const newMaskUrl = maskCanvas.toDataURL('image/png');

    onApplyEdits(newProcessedUrl, newMaskUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl h-[94vh] sm:h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Manual Edge & Hair Refinement Studio
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block truncate">
                Retouch fine hair flyaways, furry edges, or recover background parts
              </p>
            </div>
          </div>

          {/* History Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Edits"
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100/60 min-h-0">
          {/* Left/Top Brush Controls Panel */}
          <div className="w-full md:w-72 lg:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 overflow-y-auto custom-scrollbar shrink-0 max-h-48 md:max-h-none">
            {/* Mode Selectors */}
            <div>
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Brush Tool
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200">
                <button
                  id="brush-mode-erase"
                  onClick={() => setBrushSettings((p) => ({ ...p, mode: 'erase' }))}
                  className={`flex flex-row md:flex-col items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                    brushSettings.mode === 'erase'
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Erase</span>
                </button>

                <button
                  id="brush-mode-restore"
                  onClick={() => setBrushSettings((p) => ({ ...p, mode: 'restore' }))}
                  className={`flex flex-row md:flex-col items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                    brushSettings.mode === 'restore'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Restore</span>
                </button>

                <button
                  id="brush-mode-pan"
                  onClick={() => setBrushSettings((p) => ({ ...p, mode: 'pan' }))}
                  className={`flex flex-row md:flex-col items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                    brushSettings.mode === 'pan'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Pan</span>
                </button>
              </div>
            </div>

            {/* Brush Size Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] sm:text-xs font-bold text-slate-700">Brush Size</label>
                <span className="text-[11px] sm:text-xs font-mono text-indigo-600 font-bold">
                  {brushSettings.size}px
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="150"
                value={brushSettings.size}
                onChange={(e) =>
                  setBrushSettings((p) => ({ ...p, size: Number(e.target.value) }))
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Brush Hardness Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] sm:text-xs font-bold text-slate-700">Edge Hardness</label>
                <span className="text-[11px] sm:text-xs font-mono text-indigo-600 font-bold">
                  {brushSettings.hardness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brushSettings.hardness}
                onChange={(e) =>
                  setBrushSettings((p) => ({ ...p, hardness: Number(e.target.value) }))
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Soft (Hair)</span>
                <span>Sharp</span>
              </div>
            </div>

            {/* Mask Overlay Toggle */}
            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Ruby QuickMask Overlay</span>
                <input
                  type="checkbox"
                  checked={brushSettings.showMaskOverlay}
                  onChange={(e) =>
                    setBrushSettings((p) => ({ ...p, showMaskOverlay: e.target.checked }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                />
              </div>

              {brushSettings.showMaskOverlay && (
                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {['#ef4444', '#10b981', '#3b82f6'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setBrushSettings((p) => ({ ...p, maskColor: col }))}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          brushSettings.maskColor === col
                            ? 'scale-110 ring-2 ring-indigo-300 border-white'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {brushSettings.maskOpacity}% Tint
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => setCursorPos((p) => ({ ...p, visible: false }))}
            className={`flex-1 relative overflow-hidden flex items-center justify-center select-none bg-checker-light cursor-crosshair min-h-0 ${
              brushSettings.mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {/* Dynamic Brush Ring Cursor */}
            {cursorPos.visible && brushSettings.mode !== 'pan' && (
              <div
                className="fixed pointer-events-none rounded-full border-2 border-slate-900/70 shadow-xs z-50 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                  width: brushSettings.size * zoom,
                  height: brushSettings.size * zoom,
                  backgroundColor:
                    brushSettings.mode === 'erase'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(34, 197, 94, 0.2)',
                  borderColor: brushSettings.mode === 'erase' ? '#ef4444' : '#16a34a',
                }}
              />
            )}

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-md border border-slate-200 text-xs">
              <button
                onClick={() => setZoom((p) => Math.max(0.25, p - 0.25))}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-700"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[10px] sm:text-[11px] font-semibold min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((p) => Math.min(4, p + 0.25))}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-700"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                title="Fit"
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-700"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actual Display Canvas */}
            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
                transition: isPanningRef.current ? 'none' : 'transform 0.05s ease-out',
              }}
              className="shadow-2xl rounded-lg overflow-hidden flex items-center justify-center"
            >
              <canvas
                ref={displayCanvasRef}
                className="max-w-none block"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
            {brushSettings.mode === 'erase'
              ? 'Erase mode: Drag over artifacts to delete.'
              : brushSettings.mode === 'restore'
              ? 'Restore mode: Drag to recover cut areas.'
              : 'Pan mode active.'}
          </span>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-apply-brush-edits"
              onClick={handleSaveAndApply}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
