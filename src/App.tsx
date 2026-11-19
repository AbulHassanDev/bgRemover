import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  ImageItem,
  BackgroundSettings,
  ViewMode,
  AppTab,
  SampleImage,
  ApiSettings,
  HoverBgPreview,
  EnhanceParams,
} from './types';
import { Navbar } from './components/Navbar';
import { HeroDropzone } from './components/HeroDropzone';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Footer } from './components/Footer';
import { SeoManager } from './components/SeoManager';
import { SeoLandingSections } from './components/SeoLandingSections';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  StudioWorkspaceSkeleton,
  BatchQueueSkeleton,
  ModalLoadingBackdrop,
} from './components/LoadingSkeletons';
import { getSeoRoute } from './data/seoContent';
import { SAMPLE_IMAGES } from './data/presets';
import { registerAgenticTools } from './utils/agentBridge';
import { useEditHistory } from './hooks/useEditHistory';

const ComparisonSlider = lazy(() =>
  import('./components/ComparisonSlider').then((m) => ({ default: m.ComparisonSlider }))
);
const EdgeRefinerModal = lazy(() =>
  import('./components/EdgeRefinerModal').then((m) => ({ default: m.EdgeRefinerModal }))
);
const BackgroundCustomizer = lazy(() =>
  import('./components/BackgroundCustomizer').then((m) => ({ default: m.BackgroundCustomizer }))
);
const ExportPanel = lazy(() =>
  import('./components/ExportPanel').then((m) => ({ default: m.ExportPanel }))
);
const BatchQueue = lazy(() =>
  import('./components/BatchQueue').then((m) => ({ default: m.BatchQueue }))
);
const ProcessingOverlay = lazy(() =>
  import('./components/ProcessingOverlay').then((m) => ({ default: m.ProcessingOverlay }))
);
const ShortcutsModal = lazy(() =>
  import('./components/ShortcutsModal').then((m) => ({ default: m.ShortcutsModal }))
);
const ApiSettingsModal = lazy(() =>
  import('./components/ApiSettingsModal').then((m) => ({ default: m.ApiSettingsModal }))
);
const EditHistoryControls = lazy(() =>
  import('./components/EditHistoryControls').then((m) => ({ default: m.EditHistoryControls }))
);
const CropModal = lazy(() =>
  import('./components/CropModal').then((m) => ({ default: m.CropModal }))
);
const AIEnhanceModal = lazy(() =>
  import('./components/AIEnhanceModal').then((m) => ({ default: m.AIEnhanceModal }))
);
import {
  removeBackgroundClient,
  loadImage,
  renderCompositedCanvas,
  isExpressProxyAvailable,
} from './utils/imageProcessor';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Upload,
  Info,
  ShieldCheck,
  CheckCircle2,
  Crop,
  Wand2,
} from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === 'undefined') return 'editor';
    return new URLSearchParams(window.location.search).get('tab') === 'batch' ? 'batch' : 'editor';
  });
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [batchQueue, setQueue] = useState<ImageItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [mobileSection, setMobileSection] = useState<'canvas' | 'background' | 'export'>('canvas');

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
    shadowEnabled: false,
    shadowDistance: 15,
    shadowBlur: 20,
    shadowOpacity: 35,
    shadowAngle: 135,
    shadowColor: '#000000',
  });

  // Composited preview data URL
  const [compositedUrl, setCompositedUrl] = useState<string | null>(null);

  // Live hover preview state for real-time background styling
  const [hoverBgPreview, setHoverBgPreview] = useState<HoverBgPreview | null>(null);

  // Engine & API Settings State (Persisted in localStorage)
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    try {
      const saved = localStorage.getItem('clearcut_api_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.engineMode || parsed.engineMode === 'fast-client') {
          parsed.engineMode = 'neural-server';
        }
        if (!parsed.modelPrecision) {
          parsed.modelPrecision = 'high';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved api settings:', e);
    }
    return {
      engineMode: 'neural-server',
      cloudProvider: 'removebg',
      modelPrecision: 'high',
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
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const studioPrefetchedRef = useRef(false);
  const didHandleUrlParamsRef = useRef(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const prefetchStudioChunks = useCallback(() => {
    if (studioPrefetchedRef.current) return;
    studioPrefetchedRef.current = true;
    void import('./components/ProcessingOverlay');
    void import('./components/ComparisonSlider');
    void import('./components/BackgroundCustomizer');
    void import('./components/ExportPanel');
  }, []);

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

      // Generate compact thumbnail data URL for fast AI analysis
      let analysisPayload: string = url;
      try {
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          analysisPayload = canvas.toDataURL('image/jpeg', 0.82);
        }
      } catch {
        // Fallback to sending original URL for server-side resolution
        analysisPayload = url;
      }

      // Async Gemini AI analysis in background when Express backend is present
      isExpressProxyAvailable()
        .then((hasBackend) => {
          if (!hasBackend) return null;
          return fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: analysisPayload, mimeType: 'image/jpeg' }),
          }).then((r) => (r.ok ? r.json() : null));
        })
        .then((res) => {
          if (res?.success && res.data) {
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

      initHistory(result.processedUrl, result.maskDataUrl, bgSettings, url, { width: result.width, height: result.height });
      if (result.engineUsed === 'fast-fallback') {
        addToast(
          `Neural model unavailable (${result.fallbackReason || 'offline'}); used high-res geodesic edge fallback.`,
          'info'
        );
      } else {
        addToast('Background removed successfully!', 'success');
      }
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
    } finally {
      setLoadingSampleId(null);
    }
  };

  const handleFileSelected = (file: File) => {
    const url = URL.createObjectURL(file);
    processSingleImage(url, file.name, file.size, file.type);
  };

  const handleBatchFilesSelected = (files: File[]) => {
    const availableSlots = Math.max(0, 10 - batchQueue.length);
    if (availableSlots === 0) {
      addToast('Batch queue limit (10 images) reached. Clear items to add more.', 'info');
      setActiveTab('batch');
      return;
    }
    if (files.length > availableSlots) {
      addToast(`Added ${availableSlots} images (batch queue limit is 10 at a time).`, 'info');
    }

    const newItems: ImageItem[] = files.slice(0, availableSlots).map((file) => ({
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      maskDataUrl: null,
      status: 'idle',
      progress: 0,
      progressStage: 'Queued',
      dimensions: { width: 0, height: 0 },
      error: null,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setActiveTab('batch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast(`Queued ${newItems.length} image${newItems.length === 1 ? '' : 's'} in Batch Studio.`, 'success');
  };

  const handleSampleSelected = async (sample: SampleImage) => {
    setLoadingSampleId(sample.id);
    processSingleImage(sample.url, `${sample.title}.jpg`, 1024 * 1024, 'image/jpeg');
  };

  // Recompute composited background whenever background settings change
  useEffect(() => {
    if (!currentImage?.processedUrl || !currentImage?.originalUrl) {
      setCompositedUrl(null);
      return;
    }

    if (
      bgSettings.type === 'transparent' &&
      (!bgSettings.shadowEnabled || bgSettings.shadowOpacity === 0)
    ) {
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
  const setProcessedAndMask = useCallback((newProcessedUrl: string, newMaskUrl: string | null) => {
    setCurrentImage((prev) =>
      prev
        ? {
            ...prev,
            processedUrl: newProcessedUrl,
            maskDataUrl: newMaskUrl,
          }
        : null
    );
  }, []);

  // Restore complete snapshot state including canvas dimensions & originalUrl during undo/redo
  const handleRestoreSnapshotState = useCallback(
    (
      processedUrl: string,
      maskUrl: string | null,
      originalUrl?: string,
      dimensions?: { width: number; height: number }
    ) => {
      setCurrentImage((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          processedUrl,
          maskDataUrl: maskUrl,
          ...(originalUrl ? { originalUrl } : {}),
          ...(dimensions ? { dimensions } : {}),
        };
      });
    },
    []
  );

  // Global Undo / Redo Edit History Stack
  const {
    history,
    historyIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToStep,
    revertToInitial,
    initHistory,
    recordBrushEdit,
    recordCropEdit,
    recordEnhanceEdit,
    clearHistory,
    undoDescription,
    redoDescription,
  } = useEditHistory({
    currentProcessedUrl: currentImage?.processedUrl || null,
    currentMaskUrl: currentImage?.maskDataUrl || null,
    currentOriginalUrl: currentImage?.originalUrl || null,
    currentDimensions: currentImage?.dimensions || null,
    isImageReady: currentImage?.status === 'completed',
    bgSettings,
    setProcessedAndMask,
    onRestoreSnapshotState: handleRestoreSnapshotState,
    setBgSettings,
    isEdgeRefinerOpen,
    isCropModalOpen,
    isEnhanceModalOpen,
    onToast: addToast,
  });

  // Handle manual brush edits applied from EdgeRefinerModal
  const handleApplyBrushEdits = (newProcessedUrl: string, newMaskUrl: string) => {
    if (!currentImage) return;
    recordBrushEdit(newProcessedUrl, newMaskUrl, 'Erase / Restore Brush Edits');
    addToast('Manual edge brush edits applied!', 'success');
  };

  // Handle AI Picture Enhancement applied from AIEnhanceModal
  const handleApplyEnhance = (
    enhancedUrl: string,
    enhanceParams: EnhanceParams,
    scope: 'cutout' | 'composite'
  ) => {
    if (!currentImage) return;
    if (scope === 'composite') {
      setCompositedUrl(enhancedUrl);
      addToast('Applied AI picture enhancement to composite!', 'success');
    } else {
      recordEnhanceEdit(enhancedUrl, enhanceParams, 'AI Picture Enhancement');
      setCurrentImage((prev) => (prev ? { ...prev, processedUrl: enhancedUrl } : null));
      addToast('Applied AI picture enhancement to cutout subject!', 'success');
    }
  };

  // Handle canvas crop & aspect ratio applied from CropModal
  const handleApplyCrop = (
    croppedProcessedUrl: string,
    croppedMaskUrl: string | null,
    croppedOriginalUrl: string,
    newDimensions: { width: number; height: number },
    ratioLabel: string
  ) => {
    if (!currentImage) return;

    setCurrentImage((prev) =>
      prev
        ? {
            ...prev,
            originalUrl: croppedOriginalUrl,
            processedUrl: croppedProcessedUrl,
            maskDataUrl: croppedMaskUrl,
            dimensions: newDimensions,
          }
        : null
    );

    recordCropEdit(
      croppedProcessedUrl,
      croppedMaskUrl,
      croppedOriginalUrl,
      newDimensions,
      `Crop Canvas (${ratioLabel})`
    );

    addToast(
      `Canvas cropped to ${newDimensions.width} × ${newDimensions.height} px (${ratioLabel})`,
      'success'
    );
  };

  // Keyboard shortcut 'c' for crop modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable ||
        isEdgeRefinerOpen ||
        isCropModalOpen ||
        isSettingsOpen ||
        isShortcutsOpen
      ) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        if (currentImage && currentImage.status === 'completed' && activeTab === 'editor') {
          e.preventDefault();
          setIsCropModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImage, activeTab, isEdgeRefinerOpen, isCropModalOpen, isSettingsOpen, isShortcutsOpen]);

  // Sync browser back/forward navigation for vertical SEO routes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get('tab') === 'batch' ? 'batch' : 'editor');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Network connectivity resilience & idle chunk prefetching
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      addToast('You are offline — local image background removal continues working on your device.', 'info');
    };
    const handleOnline = () => {
      setIsOffline(false);
      addToast('Internet connection restored.', 'success');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(() => prefetchStudioChunks(), { timeout: 3000 });
    } else {
      timerId = setTimeout(() => prefetchStudioChunks(), 2500);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (idleId !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [addToast, prefetchStudioChunks]);

  const handleResetToUpload = () => {
    if (
      currentImage?.originalUrl?.startsWith('blob:') &&
      !batchQueue.some((item) => item.originalUrl === currentImage.originalUrl)
    ) {
      URL.revokeObjectURL(currentImage.originalUrl);
    }
    setLoadingSampleId(null);
    clearHistory();
    setCurrentImage(null);
    setCompositedUrl(null);
    setBgSettings((prev) => ({ ...prev, type: 'transparent' }));
  };

  const handleNavigateRoute = (path: string) => {
    const normalized = path || '/';
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setCurrentPath(normalized);
    handleResetToUpload();
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToCeo = () => {
    const el = document.getElementById('about-ceo-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Agentic Browsing: URL ?sample=<id> deep-linking & progressive WebMCP tool bridge
  const agentBridgeRef = useRef({
    currentPath,
    activeTab,
    hasImage: Boolean(currentImage),
    imageStatus: currentImage?.status ?? null,
    batchCount: batchQueue.length,
    navigateRoute: handleNavigateRoute,
    openBatch: () => {
      setActiveTab('batch');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    selectSample: handleSampleSelected,
    resetStudio: handleResetToUpload,
  });

  useEffect(() => {
    agentBridgeRef.current = {
      currentPath,
      activeTab,
      hasImage: Boolean(currentImage),
      imageStatus: currentImage?.status ?? null,
      batchCount: batchQueue.length,
      navigateRoute: handleNavigateRoute,
      openBatch: () => {
        setActiveTab('batch');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      selectSample: handleSampleSelected,
      resetStudio: handleResetToUpload,
    };
  });

  useEffect(() => {
    if (didHandleUrlParamsRef.current || typeof window === 'undefined') return;
    didHandleUrlParamsRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const sampleId = params.get('sample');
    if (sampleId) {
      const matched = SAMPLE_IMAGES.find((s) => s.id === sampleId);
      if (matched) {
        handleSampleSelected(matched);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return registerAgenticTools({
      getState: () => ({
        currentPath: agentBridgeRef.current.currentPath,
        activeTab: agentBridgeRef.current.activeTab,
        hasImage: agentBridgeRef.current.hasImage,
        imageStatus: agentBridgeRef.current.imageStatus,
        batchCount: agentBridgeRef.current.batchCount,
      }),
      navigateRoute: (path) => agentBridgeRef.current.navigateRoute(path),
      openBatch: () => agentBridgeRef.current.openBatch(),
      selectSample: (sample) => agentBridgeRef.current.selectSample(sample),
      resetStudio: () => agentBridgeRef.current.resetStudio(),
    });
  }, []);

  const activeSeoRoute = getSeoRoute(currentPath);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-blue-600 focus:text-white focus:text-xs focus:font-bold focus:shadow-lg"
      >
        Skip to studio
      </a>
      <SeoManager pathname={currentPath} />

      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-900"
        >
          Offline mode active — local device background removal &amp; exports remain 100% functional.
        </div>
      )}

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
        onScrollToCeo={handleScrollToCeo}
        onNavigateHome={() => handleNavigateRoute('/')}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col">
        <ErrorBoundary onReset={handleResetToUpload}>
          {/* TAB 1: Studio Editor */}
          {activeTab === 'editor' && (
            <>
              {!currentImage ? (
                /* Idle / Dropzone Hero View + Indexable SEO Landing Content */
                <>
                  <HeroDropzone
                    onFileSelected={handleFileSelected}
                    onBatchFilesSelected={handleBatchFilesSelected}
                    onOpenBatch={() => {
                      setActiveTab('batch');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onSampleSelected={handleSampleSelected}
                    onError={(msg) => addToast(msg, 'error')}
                    isLoading={loadingSampleId !== null}
                    loadingSampleId={loadingSampleId}
                    onPrefetchStudio={prefetchStudioChunks}
                    seoRoute={activeSeoRoute}
                  />
                  <SeoLandingSections
                    currentPath={activeSeoRoute.path}
                    onNavigateRoute={handleNavigateRoute}
                    onOpenBatch={() => {
                      setActiveTab('batch');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </>
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

                  {/* AI & Edge Matting Status Badge and Edit History Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Global Undo / Redo & Timeline Stack */}
                    <Suspense fallback={null}>
                      <EditHistoryControls
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={undo}
                        onRedo={redo}
                        onJumpToStep={jumpToStep}
                        onRevertToInitial={revertToInitial}
                        history={history}
                        historyIndex={historyIndex}
                        undoDescription={undoDescription}
                        redoDescription={redoDescription}
                      />
                    </Suspense>

                    <button
                      id="btn-top-ai-enhance"
                      onClick={() => setIsEnhanceModalOpen(true)}
                      title="AI Picture Enhancer: Exposure, clarity, sharpness, and color grading"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-xs shadow-indigo-300 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-white" />
                      <span className="hidden sm:inline">AI Enhance</span>
                      <span className="sm:hidden">Enhance</span>
                    </button>

                    <button
                      id="btn-top-crop-modal"
                      onClick={() => setIsCropModalOpen(true)}
                      title="Crop Canvas & Aspect Ratio (C)"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                    >
                      <Crop className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">Crop Canvas</span>
                      <span className="sm:hidden">Crop</span>
                    </button>

                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cutout Ready</span>
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
                      aria-label="Re-run AI background removal"
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile/Tablet Section Switcher (Visible on < lg viewports) */}
                <div className="flex lg:hidden items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                  <button
                    id="mobile-tab-canvas"
                    onClick={() => setMobileSection('canvas')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mobileSection === 'canvas'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Canvas & Slider
                  </button>
                  <button
                    id="mobile-tab-background"
                    onClick={() => setMobileSection('background')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mobileSection === 'background'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Backgrounds
                  </button>
                  <button
                    id="mobile-tab-export"
                    onClick={() => setMobileSection('export')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mobileSection === 'export'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Export HD
                  </button>
                </div>

                {/* Main Workspace Layout: Comparison Canvas on Left, Controls on Right */}
                <Suspense fallback={<StudioWorkspaceSkeleton />}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left 7 Columns: Canvas Comparison */}
                    <div className={`lg:col-span-7 flex flex-col ${mobileSection !== 'canvas' ? 'hidden lg:flex' : ''}`}>
                      <ComparisonSlider
                        originalUrl={currentImage.originalUrl}
                        processedUrl={currentImage.processedUrl || currentImage.originalUrl}
                        maskUrl={currentImage.maskDataUrl}
                        bgSettings={bgSettings}
                        compositedUrl={compositedUrl}
                        hoverBgPreview={hoverBgPreview}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        onOpenEdgeRefiner={() => setIsEdgeRefinerOpen(true)}
                        onOpenCropModal={() => setIsCropModalOpen(true)}
                        onOpenEnhanceModal={() => setIsEnhanceModalOpen(true)}
                        onResetImage={handleResetToUpload}
                        dimensions={currentImage.dimensions}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={undo}
                        onRedo={redo}
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
                    <div className={`lg:col-span-5 flex flex-col gap-6 ${mobileSection === 'canvas' ? 'hidden lg:flex' : ''}`}>
                      <div className={mobileSection === 'export' ? 'hidden lg:block' : ''}>
                        <BackgroundCustomizer
                          bgSettings={bgSettings}
                          setBgSettings={setBgSettings}
                          cutoutPreviewUrl={currentImage.processedUrl}
                          onHoverPreview={setHoverBgPreview}
                        />
                      </div>

                      <div className={mobileSection === 'background' ? 'hidden lg:block' : ''}>
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
                </Suspense>
              </div>
            )}
          </>
        )}

        {/* TAB 2: Batch Queue */}
        {activeTab === 'batch' && (
          <Suspense fallback={<BatchQueueSkeleton />}>
            <BatchQueue
              queue={batchQueue}
              setQueue={setQueue}
              onOpenInEditor={(item) => {
                setCurrentImage(item);
                if (item.processedUrl) {
                  initHistory(item.processedUrl, item.maskDataUrl, bgSettings);
                }
                setActiveTab('editor');
              }}
              bgSettings={bgSettings}
              apiSettings={apiSettings}
              onToast={addToast}
            />
          </Suspense>
        )}
        </ErrorBoundary>
      </main>

      {/* Magic UI Animated Modern Footer with 3D Three.js CEO Card */}
      <Footer
        onLoadCeoSample={(sampleUrl, sampleName) => {
          processSingleImage(sampleUrl, sampleName, 1024 * 1024, 'image/jpeg');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateRoute={handleNavigateRoute}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Lazy-Loaded Studio Modals & Overlays */}
      <Suspense
        fallback={
          currentImage?.status === 'processing' ||
          isSettingsOpen ||
          isEdgeRefinerOpen ||
          isCropModalOpen ||
          isEnhanceModalOpen ||
          isShortcutsOpen ? (
            <ModalLoadingBackdrop
              label={
                currentImage?.status === 'processing'
                  ? 'Initializing AI Background Engine...'
                  : 'Loading Studio Tool...'
              }
            />
          ) : null
        }
      >
        {currentImage?.status === 'processing' && (
          <ProcessingOverlay
            progress={currentImage.progress}
            stage={currentImage.progressStage}
            onCancel={handleResetToUpload}
          />
        )}

        {isSettingsOpen && (
          <ApiSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            apiSettings={apiSettings}
            onSaveSettings={handleSaveApiSettings}
            onToast={addToast}
          />
        )}

        {currentImage && isEdgeRefinerOpen && (
          <EdgeRefinerModal
            isOpen={isEdgeRefinerOpen}
            onClose={() => setIsEdgeRefinerOpen(false)}
            originalUrl={currentImage.originalUrl}
            maskUrl={currentImage.maskDataUrl}
            onApplyEdits={handleApplyBrushEdits}
          />
        )}

        {currentImage && isCropModalOpen && (
          <CropModal
            isOpen={isCropModalOpen}
            onClose={() => setIsCropModalOpen(false)}
            originalUrl={currentImage.originalUrl}
            processedUrl={currentImage.processedUrl || currentImage.originalUrl}
            maskUrl={currentImage.maskDataUrl}
            dimensions={currentImage.dimensions}
            onApplyCrop={handleApplyCrop}
            onToast={addToast}
          />
        )}

        {currentImage && isEnhanceModalOpen && (
          <AIEnhanceModal
            isOpen={isEnhanceModalOpen}
            onClose={() => setIsEnhanceModalOpen(false)}
            originalUrl={currentImage.originalUrl}
            processedUrl={currentImage.processedUrl || currentImage.originalUrl}
            compositedUrl={compositedUrl}
            onApplyEnhance={handleApplyEnhance}
            onToast={addToast}
          />
        )}

        {isShortcutsOpen && (
          <ShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        )}
      </Suspense>

      {/* Global Toast Notification System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
