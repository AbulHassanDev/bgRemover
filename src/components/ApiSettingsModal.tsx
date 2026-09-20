import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Cloud,
  Zap,
  Check,
  X,
  Key,
  ExternalLink,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';
import { ApiSettings, EngineMode, CloudProvider } from '../types';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiSettings: ApiSettings;
  onSaveSettings: (settings: ApiSettings) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiSettings,
  onSaveSettings,
  onToast,
}) => {
  const [localSettings, setLocalSettings] = useState<ApiSettings>(apiSettings);

  useEffect(() => {
    setLocalSettings(apiSettings);
  }, [apiSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onToast('Processing engine settings saved!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Engine & API Settings
              </h3>
              <p className="text-[11px] text-slate-500">
                Choose between on-device Neural AI, Ultra-Fast Client, or Cloud APIs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Mode Selection */}
        <div className="space-y-4 my-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">
              Processing Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: AI Neural Server (Recommended) */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({ ...p, engineMode: 'neural-server' }))
                }
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                  localSettings.engineMode === 'neural-server'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  {localSettings.engineMode === 'neural-server' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">AI Neural Engine</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Deep learning ISNet model. Fastest, pristine edges, no browser lag.
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded inline-block">
                  Pristine Quality • 2-3s
                </div>
              </button>

              {/* Option 2: Neural WASM AI (On-Device) */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({ ...p, engineMode: 'wasm-neural' }))
                }
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  localSettings.engineMode === 'wasm-neural'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  {localSettings.engineMode === 'wasm-neural' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Client WebAssembly</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Runs on-device via browser WebAssembly & Web Workers.
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-semibold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded inline-block">
                  100% Offline
                </div>
              </button>

              {/* Option 3: Edge Floodfill */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({ ...p, engineMode: 'fast-client' }))
                }
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  localSettings.engineMode === 'fast-client'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {localSettings.engineMode === 'fast-client' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Turbo Edge Fill</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Fast corner flood & Sobel edge boundary segmentation.
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded inline-block">
                  Instant &lt;1s
                </div>
              </button>

              {/* Option 4: Cloud API */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((p) => ({ ...p, engineMode: 'cloud-api' }))
                }
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  localSettings.engineMode === 'cloud-api'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  {localSettings.engineMode === 'cloud-api' && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Cloud API Keys</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    remove.bg, fal.ai BirefNet, or Hugging Face.
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-semibold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded inline-block">
                  Pro Cloud
                </div>
              </button>
            </div>
          </div>

          {/* Cloud API Configuration Section */}
          {localSettings.engineMode === 'cloud-api' && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Cloud Provider
                </span>
                <span className="text-[10px] text-slate-500">Stored safely in browser</span>
              </div>

              {/* Provider Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                {(['removebg', 'falai', 'huggingface'] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() =>
                      setLocalSettings((p) => ({ ...p, cloudProvider: prov }))
                    }
                    className={`py-1.5 rounded-lg font-semibold transition-all ${
                      localSettings.cloudProvider === prov
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {prov === 'removebg'
                      ? 'remove.bg'
                      : prov === 'falai'
                      ? 'fal.ai'
                      : 'HuggingFace'}
                  </button>
                ))}
              </div>

              {/* Provider Specific Input */}
              {localSettings.cloudProvider === 'removebg' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">remove.bg API Key:</span>
                    <a
                      href="https://www.remove.bg/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Get Key <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="e.g. your-removebg-api-key"
                    value={localSettings.removeBgApiKey}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        removeBgApiKey: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Official remove.bg API key. Gives 50 free preview calls/month.
                  </p>
                </div>
              )}

              {localSettings.cloudProvider === 'falai' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">fal.ai API Key:</span>
                    <a
                      href="https://fal.ai/dashboard/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Get Key <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="e.g. fal_key_xxxxxxxx"
                    value={localSettings.falAiApiKey}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        falAiApiKey: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Uses state-of-the-art BiRefNet-v2 model for high-resolution edge quality.
                  </p>
                </div>
              )}

              {localSettings.cloudProvider === 'huggingface' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Hugging Face Token:</span>
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Get Token <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="e.g. hf_xxxxxxxx"
                    value={localSettings.huggingFaceApiKey}
                    onChange={(e) =>
                      setLocalSettings((p) => ({
                        ...p,
                        huggingFaceApiKey: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Uses open-weights Bria RMBG-1.4 model via free Hugging Face Inference API.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Speed Note */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>100% Client-Side Default:</strong> Images are processed directly inside your browser using WebAssembly. No photos are uploaded to any server unless you explicitly enable Cloud API mode.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            Save Engine Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
