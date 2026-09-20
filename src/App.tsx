import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ImageItem,
  BackgroundSettings,
  ViewMode,
  AppTab,
  SampleImage,
  ApiSettings,
} from './types';
import { Navbar } from './components/Navbar';
import { HeroDropzone } from './components/HeroDropzone';
import { ComparisonSlider } from './components/ComparisonSlider';
import { EdgeRefinerModal } from './components/EdgeRefinerModal';
import { BackgroundCustomizer } from './components/BackgroundCustomizer';
import { ExportPanel } from './components/ExportPanel';
import { BatchQueue } from './components/BatchQueue';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import {
  removeBackgroundClient,
  loadImage,
  renderCompositedCanvas,
} from './utils/imageProcessor';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Upload,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('editor');
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [batchQueue, setQueue] = useState<ImageItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');

  // Background Customization State
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>({
    type: 'transparent',
    solidColor: '#ffffff',
    gradientId: 'grad-sunset',
    gradientAngle: 135,
    stockImageId: 'stock-modern-studio',
    stockImageUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    customImageUrl: null,
    blurIntensity: 18,
    opacity: 100,
    brightness: 100,
    contrast: 100,
    checkerPattern: 'checker-light',
    checkerSize: 16,
  });

  // Composited preview data URL
  const [compositedUrl, setCompositedUrl] = useState<string | null>(null);

  // Engine & API Settings State (Persisted in localStorage)
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    try {
      const saved = localStorage.getItem('clearcut_api_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.engineMode || parsed.engineMode === 'fast-client') {
          parsed.engineMode = 'neural-server';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved api settings:', e);
    }
    return {
      engineMode: 'neural-server',
      cloudProvider: 'removebg',
      removeBgApiKey: '',
      falAiApiKey: '',
      huggingFaceApiKey: '',
    };
  });

  const handleSaveApiSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings);
    try {
      localStorage.setItem('clearcut_api_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to persist api settings:', e);
    }
  };

  // Modals & Overlays
  const [isEdgeRefinerOpen, setIsEdgeRefinerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Start background removal for a single image
  const processSingleImage = async (url: string, name: string, size: number, type: string) => {
    const newItem: ImageItem = {
      id: `img-${Date.now()}`,
      name,
      size,
      type,
      originalUrl: url,
      processedUrl: null,
      maskDataUrl: null,
      status: 'processing',
      progress: 5,
      progressStage: 'Loading high-res image and analyzing saliency...',
      dimensions: { width: 0, height: 0 },
      error: null,
    };

    setCurrentImage(newItem);
    setActiveTab('editor');

    try {
      const img = await loadImage(url);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      // Update dimensions
      setCurrentImage((prev) =>
        prev ? { ...prev, dimensions: { width: w, height: h } } : null
      );

      // Async Gemini AI analysis in background for meta tips
      fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: url, mimeType: type || 'image/jpeg' }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setCurrentImage((prev) =>
              prev
                ? {
                    ...prev,
                    aiInfo: {
                      subjectType: res.data.subjectType,
                      confidence: res.data.confidence,
                      edgeComplexity: res.data.edgeComplexity,
                      backgroundDescription: res.data.backgroundDescription,
                    },
                  }
                : null
            );
          }
        })
        .catch((err) => console.warn('AI analysis optional background notice:', err));

      // Neural WebAssembly / Turbo / Cloud API background removal execution
      const result = await removeBackgroundClient(
        img,
        (progress, stage) => {
          setCurrentImage((prev) =>
            prev ? { ...prev, progress, progressStage: stage } : null
          );
        },
        apiSettings
      );

      setCurrentImage((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              progress: 100,
              progressStage: 'Complete',
              processedUrl: result.processedUrl,
              maskDataUrl: result.maskDataUrl,
            }
          : null
      );

      addToast('Background removed successfully!', 'success');
    } catch (err: any) {
      console.error('Processing error:', err);
      setCurrentImage((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: err.message || 'Failed to process image',
              progressStage: 'Error encountered',
            }
          : null
      );
      addToast(err.message || 'Error removing background. Please retry.', 'error');
    }
  };

  const handleFileSelected = (file: File) => {
    const url = URL.createObjectURL(file);
    processSingleImage(url, file.name, file.size, file.type);
  };

  const handleSampleSelected = async (sample: SampleImage) => {
    processSingleImage(sample.url, `${sample.title}.jpg`, 1024 * 1024, 'image/jpeg');
  };

  // Recompute composited background whenever background settings change
  useEffect(() => {
    if (!currentImage?.processedUrl || !currentImage?.originalUrl) {
      setCompositedUrl(null);
      return;
    }

    if (bgSettings.type === 'transparent') {
      setCompositedUrl(null);
      return;
    }

    let isMounted = true;
    async function updateComposite() {
      try {
        const cutoutImg = await loadImage(currentImage!.processedUrl!);
        const origImg = await loadImage(currentImage!.originalUrl);
        const canvas = await renderCompositedCanvas(cutoutImg, origImg, bgSettings);
        if (isMounted) {
          setCompositedUrl(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        console.error('Composite update error:', e);
      }
    }

    updateComposite();

    return () => {
      isMounted = false;
    };
  }, [bgSettings, currentImage?.processedUrl, currentImage?.originalUrl]);

  // Handle manual brush edits applied from EdgeRefinerModal
  const handleApplyBrushEdits = (newProcessedUrl: string, newMaskUrl: string) => {
    if (!currentImage) return;
    setCurrentImage((prev) =>
      prev
        ? {
            ...prev,
            processedUrl: newProcessedUrl,
            maskDataUrl: newMaskUrl,
          }
        : null
    );
    addToast('Manual edge brush edits applied!', 'success');
  };

  const handleResetToUpload = () => {
    setCurrentImage(null);
    setCompositedUrl(null);
    setBgSettings((prev) => ({ ...prev, type: 'transparent' }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        batchCount={batchQueue.length}
        bgSettings={bgSettings}
        setBgSettings={setBgSettings}
        apiSettings={apiSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: Studio Editor */}
        {activeTab === 'editor' && (
          <>
            {!currentImage ? (
              /* Idle / Dropzone Hero View */
              <HeroDropzone
                onFileSelected={handleFileSelected}
                onSampleSelected={handleSampleSelected}
                onError={(msg) => addToast(msg, 'error')}
                isLoading={false}
              />
            ) : (
              /* Active Editing & Comparison Workspace */
              <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleResetToUpload}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Upload New</span>
                    </button>
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {currentImage.name}
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{currentImage.dimensions.width} × {currentImage.dimensions.height} px</span>
                        {currentImage.aiInfo?.subjectType && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold capitalize">
                              Detected: {currentImage.aiInfo.subjectType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI & Edge Matting Status Badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Background Removed</span>
                    </div>

                    <button
                      onClick={() =>
                        processSingleImage(
                          currentImage.originalUrl,
                          currentImage.name,
                          currentImage.size,
                          currentImage.type
                        )
                      }
                      title="Re-run AI background removal"
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Workspace Layout: Comparison Canvas on Left, Controls on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left 7 Columns: Canvas Comparison */}
                  <div className="lg:col-span-7 flex flex-col">
                    <ComparisonSlider
                      originalUrl={currentImage.originalUrl}
                      processedUrl={currentImage.processedUrl || currentImage.originalUrl}
                      maskUrl={currentImage.maskDataUrl}
                      bgSettings={bgSettings}
                      compositedUrl={compositedUrl}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      onOpenEdgeRefiner={() => setIsEdgeRefinerOpen(true)}
                      onResetImage={handleResetToUpload}
                      dimensions={currentImage.dimensions}
                    />

                    {/* AI Insights & Edge Detection Bar */}
                    {currentImage.aiInfo && (
                      <div className="mt-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-slate-700">
                            <strong>AI Edge Profile:</strong>{' '}
                            {currentImage.aiInfo.edgeComplexity || 'Fine hair & translucent boundary matting'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          {Math.round((currentImage.aiInfo.confidence || 0.96) * 100)}% Confidence
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right 5 Columns: Background Customizer & Export Panel */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <BackgroundCustomizer
                      bgSettings={bgSettings}
                      setBgSettings={setBgSettings}
                    />

                    <ExportPanel
                      originalUrl={currentImage.originalUrl}
                      processedUrl={currentImage.processedUrl || currentImage.originalUrl}
                      bgSettings={bgSettings}
                      dimensions={currentImage.dimensions}
                      fileName={currentImage.name}
                      onToast={addToast}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: Batch Queue */}
        {activeTab === 'batch' && (
          <BatchQueue
            queue={batchQueue}
            setQueue={setQueue}
            onOpenInEditor={(item) => {
              setCurrentImage(item);
              setActiveTab('editor');
            }}
            bgSettings={bgSettings}
            apiSettings={apiSettings}
            onToast={addToast}
          />
        )}
      </main>

      {/* Processing Animation Overlay */}
      {currentImage?.status === 'processing' && (
        <ProcessingOverlay
          progress={currentImage.progress}
          stage={currentImage.progressStage}
          onCancel={handleResetToUpload}
        />
      )}

      {/* AI Engine & API Key Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiSettings={apiSettings}
        onSaveSettings={handleSaveApiSettings}
        onToast={addToast}
      />

      {/* Manual Edge Erase/Restore Brush Studio Modal */}
      {currentImage && (
        <EdgeRefinerModal
          isOpen={isEdgeRefinerOpen}
          onClose={() => setIsEdgeRefinerOpen(false)}
          originalUrl={currentImage.originalUrl}
          maskUrl={currentImage.maskDataUrl}
          onApplyEdits={handleApplyBrushEdits}
        />
      )}

      {/* Keyboard Shortcuts & Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Global Toast Notification System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
