import React from 'react';
import {
  Layers,
  Wand2,
  Sparkles,
  Image as ImageIcon,
  Keyboard,
  Settings,
  Cpu,
  Zap,
  Cloud,
} from 'lucide-react';
import { AppTab, BackgroundSettings, ApiSettings } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  batchCount: number;
  bgSettings: BackgroundSettings;
  setBgSettings: React.Dispatch<React.SetStateAction<BackgroundSettings>>;
  apiSettings: ApiSettings;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  batchCount,
  bgSettings,
  setBgSettings,
  apiSettings,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
            <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 bg-clip-text text-transparent">
                ClearCut AI
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-100/80">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500" />
                <span className="hidden sm:inline">Precision Edge</span>
                <span className="sm:hidden">HD</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              AI Background Remover & Edge Matting Studio
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            id="tab-single-editor"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Studio</span>
            <span className="xs:hidden">Edit</span>
          </button>

          <button
            id="tab-batch-queue"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'batch'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch</span>
            {batchCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold ml-0.5">
                {batchCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Engine Mode Badge / Trigger */}
          <button
            id="btn-engine-settings"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            title="Configure AI Engine (Neural WASM, Turbo Client, or Cloud API)"
          >
            {apiSettings.engineMode === 'wasm-neural' && (
              <>
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline text-indigo-900">Neural AI</span>
              </>
            )}
            {apiSettings.engineMode === 'fast-client' && (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline text-amber-900">Turbo</span>
              </>
            )}
            {apiSettings.engineMode === 'cloud-api' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline text-sky-900">Cloud API</span>
              </>
            )}
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Checkerboard Pattern Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              title="Light Checkerboard Pattern"
              onClick={() =>
                setBgSettings((prev) => ({ ...prev, checkerPattern: 'checker-light' }))
              }
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-all ${
                bgSettings.checkerPattern === 'checker-light'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded bg-checker-light border border-slate-300" />
            </button>
            <button
              title="Dark Checkerboard Pattern"
              onClick={() =>
                setBgSettings((prev) => ({ ...prev, checkerPattern: 'checker-dark' }))
              }
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-all ${
                bgSettings.checkerPattern === 'checker-dark'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded bg-checker-dark border border-slate-700" />
            </button>
            <button
              title="High-Contrast Cyan Grid"
              onClick={() =>
                setBgSettings((prev) => ({ ...prev, checkerPattern: 'checker-contrast' }))
              }
              className={`hidden md:flex w-6 h-6 sm:w-7 sm:h-7 rounded-md items-center justify-center transition-all ${
                bgSettings.checkerPattern === 'checker-contrast'
                  ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded bg-checker-contrast border border-sky-600" />
            </button>
          </div>

          {/* Shortcuts / Help Info */}
          <button
            id="btn-shortcuts"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts & Help"
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
