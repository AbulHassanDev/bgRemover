import React, { useRef } from 'react';
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
} from 'lucide-react';
import { BackgroundSettings, BackgroundType } from '../types';
import {
  SOLID_COLOR_PRESETS,
  GRADIENT_PRESETS,
  STOCK_BACKGROUNDS,
} from '../data/presets';

interface BackgroundCustomizerProps {
  bgSettings: BackgroundSettings;
  setBgSettings: React.Dispatch<React.SetStateAction<BackgroundSettings>>;
}

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  bgSettings,
  setBgSettings,
}) => {
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const setType = (type: BackgroundType) => {
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
          <div className="flex flex-wrap items-center gap-2">
            {SOLID_COLOR_PRESETS.map((color) => (
              <button
                key={color.hex}
                title={color.name}
                onClick={() => setBgSettings((p) => ({ ...p, solidColor: color.hex }))}
                style={{ backgroundColor: color.hex }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all shadow-2xs ${
                  bgSettings.solidColor === color.hex
                    ? 'border-indigo-600 scale-110 ring-2 ring-indigo-200'
                    : 'border-white hover:scale-105'
                }`}
              />
            ))}

            {/* Custom Hex Color Picker Input */}
            <div className="flex items-center gap-1.5 ml-auto">
              <input
                type="color"
                value={bgSettings.solidColor || '#ffffff'}
                onChange={(e) =>
                  setBgSettings((p) => ({ ...p, solidColor: e.target.value }))
                }
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GRADIENT_PRESETS.map((grad) => (
              <button
                key={grad.id}
                onClick={() =>
                  setBgSettings((p) => ({
                    ...p,
                    gradientId: grad.id,
                    gradientAngle: grad.angle,
                  }))
                }
                style={{ background: grad.css }}
                className={`h-12 rounded-xl p-2 flex flex-col justify-end text-left transition-all border ${
                  bgSettings.gradientId === grad.id
                    ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-sm'
                    : 'border-transparent hover:opacity-90'
                }`}
              >
                <span className="text-[10px] font-bold text-white drop-shadow-md">
                  {grad.name}
                </span>
              </button>
            ))}
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
              onChange={(e) =>
                setBgSettings((p) => ({ ...p, gradientAngle: Number(e.target.value) }))
              }
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
    </div>
  );
};
