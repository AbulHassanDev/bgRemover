import React, { useState, useRef } from 'react';
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Droplets,
  Sliders,
  Sun,
  Layers,
  RotateCw,
  Eye,
  Check,
  Compass,
  Move,
  RotateCcw,
} from 'lucide-react';
import { BackgroundSettings, BackgroundType, HoverBgPreview, GradientOption } from '../types';
import {
  SOLID_COLOR_PRESETS,
  GRADIENT_PRESETS,
  STOCK_BACKGROUNDS,
} from '../data/presets';

interface ShadowPreset {
  id: string;
  name: string;
  distance: number;
  blur: number;
  opacity: number;
  angle: number;
}

const SHADOW_PRESETS: ShadowPreset[] = [
  { id: 'subtle', name: 'Subtle', distance: 8, blur: 14, opacity: 28, angle: 135 },
  { id: 'floating', name: 'Floating', distance: 20, blur: 30, opacity: 40, angle: 135 },
  { id: 'ground', name: 'Ground', distance: 12, blur: 18, opacity: 45, angle: 90 },
  { id: 'crisp', name: 'Crisp', distance: 6, blur: 6, opacity: 55, angle: 135 },
  { id: 'dramatic', name: 'Dramatic', distance: 32, blur: 44, opacity: 60, angle: 135 },
];

const SHADOW_COLOR_SWATCHES = [
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Deep Slate', hex: '#0f172a' },
  { name: 'Warm Charcoal', hex: '#292524' },
  { name: 'Midnight Navy', hex: '#020617' },
  { name: 'Deep Indigo', hex: '#1e1b4b' },
];

interface BackgroundCustomizerProps {
  bgSettings: BackgroundSettings;
  setBgSettings: React.Dispatch<React.SetStateAction<BackgroundSettings>>;
  cutoutPreviewUrl?: string | null;
  onHoverPreview?: (preview: HoverBgPreview | null) => void;
}

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  bgSettings,
  setBgSettings,
  cutoutPreviewUrl,
  onHoverPreview,
}) => {
  const customBgInputRef = useRef<HTMLInputElement>(null);
  const [hoveredPreview, setHoveredPreview] = useState<HoverBgPreview | null>(null);

  const setType = (type: BackgroundType) => {
    handleHoverLeave();
    setBgSettings((prev) => ({ ...prev, type }));
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgSettings((prev) => ({
        ...prev,
        type: 'custom',
        customImageUrl: url,
      }));
    }
  };

  // Hover preview handlers
  const handleSolidHover = (color: { name: string; hex: string }) => {
    const preview: HoverBgPreview = {
      type: 'solid',
      name: color.name,
      color: color.hex,
    };
    setHoveredPreview(preview);
    onHoverPreview?.(preview);
  };

  const handleGradientHover = (grad: GradientOption) => {
    const angle = bgSettings.gradientAngle || grad.angle || 135;
    const dynamicCss = `linear-gradient(${angle}deg, ${grad.from}, ${grad.to})`;
    const preview: HoverBgPreview = {
      type: 'gradient',
      name: grad.name,
      gradientId: grad.id,
      gradientFrom: grad.from,
      gradientTo: grad.to,
      gradientCss: dynamicCss,
      angle,
    };
    setHoveredPreview(preview);
    onHoverPreview?.(preview);
  };

  const handleHoverLeave = () => {
    setHoveredPreview(null);
    onHoverPreview?.(null);
  };

  const handleSelectSolid = (hex: string) => {
    setBgSettings((p) => ({ ...p, type: 'solid', solidColor: hex }));
    handleHoverLeave();
  };

  const handleSelectGradient = (grad: GradientOption) => {
    setBgSettings((p) => ({
      ...p,
      type: 'gradient',
      gradientId: grad.id,
      gradientAngle: p.gradientAngle || grad.angle,
    }));
    handleHoverLeave();
  };

  // Helper to determine contrast
  const isColorDark = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
  };

  // Active or hovered state for solid colors
  const isHoveringSolid = hoveredPreview?.type === 'solid';
  const activeSolidHex = isHoveringSolid
    ? hoveredPreview?.color || '#ffffff'
    : bgSettings.solidColor || '#ffffff';
  const activeSolidName = isHoveringSolid
    ? hoveredPreview?.name
    : SOLID_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === activeSolidHex.toLowerCase())?.name ||
      'Custom Solid';

  // Active or hovered state for gradients
  const isHoveringGradient = hoveredPreview?.type === 'gradient';
  const activeGradientPreset = isHoveringGradient
    ? GRADIENT_PRESETS.find((g) => g.id === hoveredPreview?.gradientId) || GRADIENT_PRESETS[0]
    : GRADIENT_PRESETS.find((g) => g.id === bgSettings.gradientId) || GRADIENT_PRESETS[0];
  const activeGradientAngle = isHoveringGradient
    ? hoveredPreview?.angle || 135
    : bgSettings.gradientAngle || activeGradientPreset.angle || 135;
  const activeGradientCss = isHoveringGradient && hoveredPreview?.gradientCss
    ? hoveredPreview.gradientCss
    : `linear-gradient(${activeGradientAngle}deg, ${activeGradientPreset.from}, ${activeGradientPreset.to})`;
  const activeGradientName = isHoveringGradient
    ? hoveredPreview?.name
    : activeGradientPreset.name;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-5 flex flex-col gap-3 sm:gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Background Replacement</h3>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400">Backdrop customization</span>
      </div>

      {/* Category Tabs - Fully responsive grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] sm:text-xs font-semibold">
        <button
          id="bg-tab-transparent"
          onClick={() => setType('transparent')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all ${
            bgSettings.type === 'transparent'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-checker-light border border-slate-300 shrink-0" />
          <span className="truncate">Clear</span>
        </button>

        <button
          id="bg-tab-solid"
          onClick={() => setType('solid')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all ${
            bgSettings.type === 'solid'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-500 shrink-0" />
          <span className="truncate">Color</span>
        </button>

        <button
          id="bg-tab-gradient"
          onClick={() => setType('gradient')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all ${
            bgSettings.type === 'gradient'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-500 shrink-0" />
          <span className="truncate">Gradient</span>
        </button>

        <button
          id="bg-tab-stock"
          onClick={() => setType('stock')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all ${
            bgSettings.type === 'stock'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Scenes</span>
        </button>

        <button
          id="bg-tab-blur"
          onClick={() => setType('blur')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all ${
            bgSettings.type === 'blur'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 shrink-0" />
          <span className="truncate">Blur</span>
        </button>

        <button
          id="bg-tab-custom"
          onClick={() => {
            setType('custom');
            if (!bgSettings.customImageUrl) {
              customBgInputRef.current?.click();
            }
          }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all ${
            bgSettings.type === 'custom'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500 shrink-0" />
          <span className="truncate">Upload</span>
        </button>
      </div>

      {/* 1. Transparent State Message */}
      {bgSettings.type === 'transparent' && (
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-100">
          <span>Subject is on transparent PNG canvas.</span>
          <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">
            Alpha 100%
          </span>
        </div>
      )}

      {/* 2. Solid Color Selector */}
      {bgSettings.type === 'solid' && (
        <div className="space-y-3">
          {/* Live Preview Display Card for Solid Colors */}
          <div
            className="relative rounded-xl border border-slate-200/80 p-2.5 sm:p-3 flex items-center justify-between shadow-xs overflow-hidden transition-all duration-150"
            style={{
              backgroundColor: activeSolidHex,
              transition: 'background-color 0.15s ease-out',
            }}
          >
            {/* Translucent frosted pill ensuring 100% crisp contrast regardless of background */}
            <div className="flex items-center gap-2 bg-slate-900/85 text-white backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/20 shadow-xs">
              {isHoveringSolid ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 truncate">
                    {isHoveringSolid ? 'Live Hover Preview' : 'Active Color'}
                  </span>
                  <span className="text-[9px] text-slate-400">•</span>
                  <span className="text-xs font-bold text-white truncate">
                    {activeSolidName}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-300 uppercase">
                  {activeSolidHex}
                </span>
              </div>
            </div>

            {/* Right side: Mini subject preview thumbnail + Action hint */}
            <div className="flex items-center gap-2">
              {cutoutPreviewUrl && (
                <div
                  className="w-9 h-9 rounded-lg overflow-hidden border border-white/40 shadow-xs flex items-center justify-center p-0.5"
                  style={{ backgroundColor: activeSolidHex }}
                  title="Live subject cutout preview"
                >
                  <img
                    src={cutoutPreviewUrl}
                    alt="Cutout subject preview"
                    className="w-full h-full object-contain pointer-events-none"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              {isHoveringSolid ? (
                <span className="hidden xs:inline text-[10px] font-semibold bg-white/90 text-slate-900 px-2 py-1 rounded-md shadow-xs backdrop-blur-xs">
                  Click to apply
                </span>
              ) : (
                <span className="hidden xs:inline text-[10px] font-semibold bg-white/25 text-white px-2 py-1 rounded-md border border-white/30 backdrop-blur-xs">
                  Applied
                </span>
              )}
            </div>
          </div>

          {/* Color Presets Grid */}
          <div className="flex flex-wrap items-center gap-2">
            {SOLID_COLOR_PRESETS.map((color) => {
              const isSelected = bgSettings.solidColor?.toLowerCase() === color.hex.toLowerCase();
              const isHovered = isHoveringSolid && hoveredPreview?.color?.toLowerCase() === color.hex.toLowerCase();
              const dark = isColorDark(color.hex);

              return (
                <button
                  key={color.hex}
                  id={`bg-color-${color.hex.replace('#', '')}`}
                  title={`${color.name} (${color.hex}) - Hover for live preview, click to select`}
                  onClick={() => handleSelectSolid(color.hex)}
                  onMouseEnter={() => handleSolidHover(color)}
                  onMouseLeave={handleHoverLeave}
                  onFocus={() => handleSolidHover(color)}
                  onBlur={handleHoverLeave}
                  style={{ backgroundColor: color.hex }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all shadow-2xs relative group cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 scale-110 ring-2 ring-indigo-300 z-10'
                      : isHovered
                      ? 'border-white scale-120 ring-2 ring-emerald-400 shadow-md z-20'
                      : 'border-white hover:scale-110'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          dark ? 'text-white' : 'text-slate-900'
                        }`}
                      />
                    </span>
                  )}
                  {!isSelected && isHovered && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white animate-pulse" />
                  )}
                </button>
              );
            })}

            {/* Custom Hex Color Picker Input */}
            <div
              className="flex items-center gap-1.5 ml-auto pl-1"
              onMouseEnter={() =>
                handleSolidHover({
                  name: 'Custom Picker',
                  hex: bgSettings.solidColor || '#ffffff',
                })
              }
              onMouseLeave={handleHoverLeave}
            >
              <input
                id="custom-color-picker"
                type="color"
                value={bgSettings.solidColor || '#ffffff'}
                onChange={(e) => {
                  const val = e.target.value;
                  setBgSettings((p) => ({ ...p, solidColor: val }));
                  handleSolidHover({ name: 'Custom Color', hex: val });
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                title="Choose custom color (hover to preview)"
              />
              <span className="font-mono text-xs text-slate-600 uppercase">
                {bgSettings.solidColor || '#ffffff'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Gradient Selector */}
      {bgSettings.type === 'gradient' && (
        <div className="space-y-3">
          {/* Live Preview Display Card for Gradients */}
          <div
            className="relative rounded-xl border border-slate-200/80 p-2.5 sm:p-3 flex items-center justify-between shadow-xs overflow-hidden transition-all duration-150"
            style={{
              background: activeGradientCss,
              transition: 'background 0.15s ease-out',
            }}
          >
            {/* Translucent frosted pill ensuring 100% crisp contrast */}
            <div className="flex items-center gap-2 bg-slate-900/85 text-white backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/20 shadow-xs">
              {isHoveringGradient ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 truncate">
                    {isHoveringGradient ? 'Live Hover Preview' : 'Active Gradient'}
                  </span>
                  <span className="text-[9px] text-slate-400">•</span>
                  <span className="text-xs font-bold text-white truncate">
                    {activeGradientName}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-300">
                  {activeGradientAngle}° Angle
                </span>
              </div>
            </div>

            {/* Right side: Mini subject preview thumbnail + Action hint */}
            <div className="flex items-center gap-2">
              {cutoutPreviewUrl && (
                <div
                  className="w-9 h-9 rounded-lg overflow-hidden border border-white/40 shadow-xs flex items-center justify-center p-0.5"
                  style={{ background: activeGradientCss }}
                  title="Live subject cutout preview"
                >
                  <img
                    src={cutoutPreviewUrl}
                    alt="Cutout subject preview"
                    className="w-full h-full object-contain pointer-events-none"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              {isHoveringGradient ? (
                <span className="hidden xs:inline text-[10px] font-semibold bg-white/90 text-slate-900 px-2 py-1 rounded-md shadow-xs backdrop-blur-xs">
                  Click to apply
                </span>
              ) : (
                <span className="hidden xs:inline text-[10px] font-semibold bg-white/25 text-white px-2 py-1 rounded-md border border-white/30 backdrop-blur-xs">
                  Applied
                </span>
              )}
            </div>
          </div>

          {/* Gradients Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GRADIENT_PRESETS.map((grad) => {
              const isSelected = bgSettings.gradientId === grad.id;
              const isHovered = isHoveringGradient && hoveredPreview?.gradientId === grad.id;
              const displayAngle = bgSettings.gradientAngle || grad.angle || 135;
              const cardCss = `linear-gradient(${displayAngle}deg, ${grad.from}, ${grad.to})`;

              return (
                <button
                  key={grad.id}
                  id={`bg-grad-${grad.id}`}
                  title={`${grad.name} - Hover for live preview, click to select`}
                  onClick={() => handleSelectGradient(grad)}
                  onMouseEnter={() => handleGradientHover(grad)}
                  onMouseLeave={handleHoverLeave}
                  onFocus={() => handleGradientHover(grad)}
                  onBlur={handleHoverLeave}
                  style={{ background: cardCss }}
                  className={`group relative h-13 rounded-xl p-2 flex flex-col justify-between text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-300 shadow-sm scale-[1.02] z-10'
                      : isHovered
                      ? 'border-white ring-2 ring-emerald-400 shadow-md scale-[1.04] z-20'
                      : 'border-transparent hover:opacity-95 hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-mono text-white/90 drop-shadow-xs bg-black/30 px-1 py-0.5 rounded leading-none">
                      {displayAngle}°
                    </span>
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    {!isSelected && isHovered && (
                      <span className="text-[9px] font-semibold text-emerald-300 bg-black/50 px-1 py-0.5 rounded flex items-center gap-0.5 leading-none">
                        <Eye className="w-2.5 h-2.5" />
                        Preview
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-white drop-shadow-md truncate">
                    {grad.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              Angle: {bgSettings.gradientAngle || 135}°
            </span>
            <input
              type="range"
              min="0"
              max="360"
              step="45"
              value={bgSettings.gradientAngle || 135}
              onChange={(e) => {
                const angle = Number(e.target.value);
                setBgSettings((p) => ({ ...p, gradientAngle: angle }));
                if (hoveredPreview?.type === 'gradient' && hoveredPreview.gradientFrom && hoveredPreview.gradientTo) {
                  setHoveredPreview((p) =>
                    p
                      ? {
                          ...p,
                          angle,
                          gradientCss: `linear-gradient(${angle}deg, ${p.gradientFrom}, ${p.gradientTo})`,
                        }
                      : null
                  );
                }
              }}
              className="w-32 accent-indigo-600"
            />
          </div>
        </div>
      )}

      {/* 4. Stock Scenes Selector */}
      {bgSettings.type === 'stock' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
          {STOCK_BACKGROUNDS.map((stock) => (
            <button
              key={stock.id}
              onClick={() =>
                setBgSettings((p) => ({ ...p, stockImageUrl: stock.url }))
              }
              className={`group relative rounded-xl overflow-hidden aspect-video text-left border-2 transition-all ${
                bgSettings.stockImageUrl === stock.url
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-transparent hover:border-indigo-300'
              }`}
            >
              <img
                src={stock.thumbnail}
                alt={stock.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[10px] font-bold text-white truncate">
                  {stock.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 5. Depth Blur Sliders */}
      {(bgSettings.type === 'blur' || bgSettings.type === 'stock' || bgSettings.type === 'custom') && (
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>Background Blur Intensity</span>
            </label>
            <span className="font-mono text-indigo-600 font-bold">
              {bgSettings.blurIntensity}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={bgSettings.blurIntensity}
            onChange={(e) =>
              setBgSettings((p) => ({ ...p, blurIntensity: Number(e.target.value) }))
            }
            className="w-full accent-indigo-600"
          />
        </div>
      )}

      {/* 6. Custom Image Upload Trigger */}
      {bgSettings.type === 'custom' && (
        <div className="pt-2">
          <input
            ref={customBgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
          <button
            onClick={() => customBgInputRef.current?.click()}
            className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50/50 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Upload custom backdrop photo</span>
          </button>
        </div>
      )}

      {/* 7. Shadow Controls Section */}
      <div className="pt-3 border-t border-slate-200/80">
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/70 p-3 space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                bgSettings.shadowEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
              }`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Shadow Controls</h4>
                <p className="text-[10px] text-slate-500">Add depth and realism to subject</p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              id="shadow-toggle-button"
              type="button"
              onClick={() =>
                setBgSettings((prev) => ({
                  ...prev,
                  shadowEnabled: !prev.shadowEnabled,
                  // If enabling and current distance/blur were 0, give helpful defaults
                  shadowDistance: prev.shadowDistance || 16,
                  shadowBlur: prev.shadowBlur || 22,
                  shadowOpacity: prev.shadowOpacity || 35,
                }))
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                bgSettings.shadowEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              title={bgSettings.shadowEnabled ? 'Disable Drop Shadow' : 'Enable Drop Shadow'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  bgSettings.shadowEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Controls Body (visible or active) */}
          {bgSettings.shadowEnabled && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              {/* Presets Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mr-0.5">
                  Presets:
                </span>
                {SHADOW_PRESETS.map((preset) => {
                  const isPresetActive =
                    bgSettings.shadowDistance === preset.distance &&
                    bgSettings.shadowBlur === preset.blur &&
                    bgSettings.shadowOpacity === preset.opacity;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setBgSettings((prev) => ({
                          ...prev,
                          shadowEnabled: true,
                          shadowDistance: preset.distance,
                          shadowBlur: preset.blur,
                          shadowOpacity: preset.opacity,
                          shadowAngle: preset.angle,
                        }))
                      }
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap transition-all ${
                        isPresetActive
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Slider 1: Distance */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="shadow-distance-slider"
                    className="font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Move className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Shadow Distance</span>
                  </label>
                  <span className="font-mono text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-[11px]">
                    {bgSettings.shadowDistance}px
                  </span>
                </div>
                <input
                  id="shadow-distance-slider"
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={bgSettings.shadowDistance}
                  onChange={(e) =>
                    setBgSettings((p) => ({
                      ...p,
                      shadowDistance: Number(e.target.value),
                      shadowEnabled: true,
                    }))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Slider 2: Blur */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="shadow-blur-slider"
                    className="font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span>Shadow Blur</span>
                  </label>
                  <span className="font-mono text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-[11px]">
                    {bgSettings.shadowBlur}px
                  </span>
                </div>
                <input
                  id="shadow-blur-slider"
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={bgSettings.shadowBlur}
                  onChange={(e) =>
                    setBgSettings((p) => ({
                      ...p,
                      shadowBlur: Number(e.target.value),
                      shadowEnabled: true,
                    }))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Slider 3: Opacity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="shadow-opacity-slider"
                    className="font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>Shadow Opacity</span>
                  </label>
                  <span className="font-mono text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-[11px]">
                    {bgSettings.shadowOpacity}%
                  </span>
                </div>
                <input
                  id="shadow-opacity-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={bgSettings.shadowOpacity}
                  onChange={(e) =>
                    setBgSettings((p) => ({
                      ...p,
                      shadowOpacity: Number(e.target.value),
                      shadowEnabled: true,
                    }))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Angle & Color Row */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2.5">
                {/* Direction Buttons & Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="shadow-angle-slider"
                      className="font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Light Direction</span>
                    </label>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {bgSettings.shadowAngle ?? 135}°
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: '↖ Top-L', angle: 135 },
                      { label: '↑ Top', angle: 90 },
                      { label: '↗ Top-R', angle: 45 },
                      { label: '↓ Bottom', angle: 270 },
                    ].map((d) => (
                      <button
                        key={d.angle}
                        type="button"
                        onClick={() =>
                          setBgSettings((p) => ({
                            ...p,
                            shadowAngle: d.angle,
                            shadowEnabled: true,
                          }))
                        }
                        className={`flex-1 py-1 text-[10px] rounded border font-medium transition-colors ${
                          (bgSettings.shadowAngle ?? 135) === d.angle
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <input
                    id="shadow-angle-slider"
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={bgSettings.shadowAngle ?? 135}
                    onChange={(e) =>
                      setBgSettings((p) => ({
                        ...p,
                        shadowAngle: Number(e.target.value),
                        shadowEnabled: true,
                      }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Color and Reset Row */}
                <div className="flex items-center justify-between pt-1">
                  {/* Tint Swatches */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-medium">Tint:</span>
                    {SHADOW_COLOR_SWATCHES.map((swatch) => {
                      const isColorActive =
                        (bgSettings.shadowColor || '#000000').toLowerCase() ===
                        swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          title={swatch.name}
                          onClick={() =>
                            setBgSettings((p) => ({
                              ...p,
                              shadowColor: swatch.hex,
                              shadowEnabled: true,
                            }))
                          }
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            isColorActive
                              ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                              : 'border-slate-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        />
                      );
                    })}

                    {/* Custom Color Picker */}
                    <label
                      title="Custom shadow color"
                      className="w-5 h-5 rounded-full border border-slate-300 overflow-hidden cursor-pointer relative hover:scale-105 transition-transform inline-flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400"
                    >
                      <input
                        type="color"
                        value={bgSettings.shadowColor || '#000000'}
                        onChange={(e) =>
                          setBgSettings((p) => ({
                            ...p,
                            shadowColor: e.target.value,
                            shadowEnabled: true,
                          }))
                        }
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>

                  {/* Reset to defaults */}
                  <button
                    type="button"
                    onClick={() =>
                      setBgSettings((p) => ({
                        ...p,
                        shadowEnabled: true,
                        shadowDistance: 15,
                        shadowBlur: 20,
                        shadowOpacity: 35,
                        shadowAngle: 135,
                        shadowColor: '#000000',
                      }))
                    }
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                    title="Reset shadow settings to standard defaults"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
