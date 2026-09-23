import { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { BackgroundSettings, ImageEditSnapshot } from '../types';
import { SOLID_COLOR_PRESETS, GRADIENT_PRESETS, STOCK_BACKGROUNDS } from '../data/presets';

const MAX_HISTORY_LENGTH = 40;

interface UseEditHistoryProps {
  currentProcessedUrl: string | null;
  currentMaskUrl: string | null;
  currentOriginalUrl?: string | null;
  currentDimensions?: { width: number; height: number } | null;
  isImageReady: boolean;
  bgSettings: BackgroundSettings;
  setProcessedAndMask: (processedUrl: string, maskUrl: string | null) => void;
  setBgSettings: Dispatch<SetStateAction<BackgroundSettings>>;
  isEdgeRefinerOpen: boolean;
  isCropModalOpen?: boolean;
  isEnhanceModalOpen?: boolean;
  onToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  onRestoreSnapshotState?: (
    processedUrl: string,
    maskUrl: string | null,
    originalUrl?: string,
    dimensions?: { width: number; height: number }
  ) => void;
}

// Check if background settings have functionally changed
export function hasBackgroundChanged(a: BackgroundSettings, b: BackgroundSettings): boolean {
  if (a.type !== b.type) return true;
  if (a.type === 'solid' && a.solidColor.toLowerCase() !== b.solidColor.toLowerCase()) return true;
  if (a.type === 'gradient' && (a.gradientId !== b.gradientId || a.gradientAngle !== b.gradientAngle)) return true;
  if (a.type === 'stock' && a.stockImageUrl !== b.stockImageUrl) return true;
  if (a.type === 'custom' && a.customImageUrl !== b.customImageUrl) return true;
  if (a.type === 'blur' && a.blurIntensity !== b.blurIntensity) return true;
  if (a.opacity !== b.opacity || a.brightness !== b.brightness || a.contrast !== b.contrast) return true;
  // Shadow changes
  if (a.shadowEnabled !== b.shadowEnabled) return true;
  if (a.shadowEnabled) {
    if (a.shadowDistance !== b.shadowDistance) return true;
    if (a.shadowBlur !== b.shadowBlur) return true;
    if (a.shadowOpacity !== b.shadowOpacity) return true;
    if (a.shadowAngle !== b.shadowAngle) return true;
    if (a.shadowColor !== b.shadowColor) return true;
  }
  return false;
}

// Generate friendly label describing the background change
export function getBackgroundChangeDescription(
  newBg: BackgroundSettings,
  prevBg?: BackgroundSettings
): string {
  // Check shadow changes first if type didn't change
  if (prevBg && prevBg.type === newBg.type) {
    if (prevBg.shadowEnabled !== newBg.shadowEnabled) {
      return newBg.shadowEnabled ? 'Enable Drop Shadow' : 'Remove Drop Shadow';
    }
    if (
      newBg.shadowEnabled &&
      (prevBg.shadowDistance !== newBg.shadowDistance ||
        prevBg.shadowBlur !== newBg.shadowBlur ||
        prevBg.shadowOpacity !== newBg.shadowOpacity ||
        prevBg.shadowAngle !== newBg.shadowAngle)
    ) {
      return `Drop Shadow (Dist: ${newBg.shadowDistance}px, Blur: ${newBg.shadowBlur}px, Opacity: ${newBg.shadowOpacity}%)`;
    }
  }

  if (prevBg && newBg.type !== prevBg.type) {
    switch (newBg.type) {
      case 'transparent':
        return 'Clear / Transparent Background';
      case 'solid': {
        const found = SOLID_COLOR_PRESETS.find(
          (c) => c.hex.toLowerCase() === newBg.solidColor.toLowerCase()
        );
        return `Solid Color (${found ? found.name : newBg.solidColor})`;
      }
      case 'gradient': {
        const grad = GRADIENT_PRESETS.find((g) => g.id === newBg.gradientId);
        return `Gradient (${grad ? grad.name : 'Custom'})`;
      }
      case 'stock': {
        const stock = STOCK_BACKGROUNDS.find((s) => s.url === newBg.stockImageUrl);
        return `Stock Backdrop (${stock ? stock.title : 'Photo'})`;
      }
      case 'custom':
        return 'Custom Upload Backdrop';
      case 'blur':
        return `Blurred Original Backdrop (${newBg.blurIntensity}px)`;
    }
  }

  switch (newBg.type) {
    case 'transparent':
      return 'Clear / Transparent Background';
    case 'solid': {
      const found = SOLID_COLOR_PRESETS.find(
        (c) => c.hex.toLowerCase() === newBg.solidColor.toLowerCase()
      );
      return `Solid Color: ${found ? found.name : newBg.solidColor}`;
    }
    case 'gradient': {
      const grad = GRADIENT_PRESETS.find((g) => g.id === newBg.gradientId);
      return `Gradient: ${grad ? grad.name : 'Custom'} (${newBg.gradientAngle}°)`;
    }
    case 'stock': {
      const stock = STOCK_BACKGROUNDS.find((s) => s.url === newBg.stockImageUrl);
      return `Stock Backdrop: ${stock ? stock.title : 'Photo'}`;
    }
    case 'custom':
      return 'Custom Upload Backdrop';
    case 'blur':
      return `Blur: ${newBg.blurIntensity}px`;
    default:
      return 'Background adjustments';
  }
}

export function useEditHistory({
  currentProcessedUrl,
  currentMaskUrl,
  currentOriginalUrl,
  currentDimensions,
  isImageReady,
  bgSettings,
  setProcessedAndMask,
  setBgSettings,
  isEdgeRefinerOpen,
  isCropModalOpen,
  isEnhanceModalOpen,
  onToast,
  onRestoreSnapshotState,
}: UseEditHistoryProps) {
  const [history, setHistory] = useState<ImageEditSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Guards against recording states while undoing/redoing
  const isTraversingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs up-to-date for callbacks
  const historyRef = useRef(history);
  historyRef.current = history;
  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;
  const bgSettingsRef = useRef(bgSettings);
  bgSettingsRef.current = bgSettings;
  const processedUrlRef = useRef(currentProcessedUrl);
  processedUrlRef.current = currentProcessedUrl;
  const maskUrlRef = useRef(currentMaskUrl);
  maskUrlRef.current = currentMaskUrl;
  const dimensionsRef = useRef(currentDimensions);
  dimensionsRef.current = currentDimensions;
  const originalUrlRef = useRef(currentOriginalUrl);
  originalUrlRef.current = currentOriginalUrl;

  // Initialize history when a fresh image cutout is created
  const initHistory = useCallback(
    (
      initialProcessedUrl: string,
      initialMaskUrl: string | null,
      initialBg: BackgroundSettings,
      initialOriginalUrl?: string,
      initialDimensions?: { width: number; height: number }
    ) => {
      const firstSnapshot: ImageEditSnapshot = {
        id: `snap-${Date.now()}-init`,
        timestamp: Date.now(),
        description: 'Initial Cutout',
        category: 'initial',
        processedUrl: initialProcessedUrl,
        maskDataUrl: initialMaskUrl,
        bgSettings: { ...initialBg },
        originalUrl: initialOriginalUrl,
        dimensions: initialDimensions,
      };
      setHistory([firstSnapshot]);
      setHistoryIndex(0);
    },
    []
  );

  // Clear history on image unload
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Record a manual brush stroke refinement from EdgeRefinerModal
  const recordBrushEdit = useCallback(
    (newProcessedUrl: string, newMaskUrl: string | null, description = 'Brush Edge Refinement') => {
      if (isTraversingRef.current) return;

      const newSnapshot: ImageEditSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        description,
        category: 'brush',
        processedUrl: newProcessedUrl,
        maskDataUrl: newMaskUrl,
        bgSettings: { ...bgSettingsRef.current },
      };

      const currHist = historyRef.current;
      const currIdx = historyIndexRef.current;
      const nextHistory = currHist.slice(0, currIdx + 1);
      nextHistory.push(newSnapshot);

      if (nextHistory.length > MAX_HISTORY_LENGTH) {
        nextHistory.shift();
      }

      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setProcessedAndMask(newProcessedUrl, newMaskUrl);
    },
    [setProcessedAndMask]
  );

  // Record a canvas crop and aspect ratio trim
  const recordCropEdit = useCallback(
    (
      newProcessedUrl: string,
      newMaskUrl: string | null,
      newOriginalUrl: string,
      newDimensions: { width: number; height: number },
      description = 'Crop Canvas'
    ) => {
      if (isTraversingRef.current) return;

      const newSnapshot: ImageEditSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        description,
        category: 'crop',
        processedUrl: newProcessedUrl,
        maskDataUrl: newMaskUrl,
        bgSettings: { ...bgSettingsRef.current },
        originalUrl: newOriginalUrl,
        dimensions: { ...newDimensions },
      };

      const currHist = historyRef.current;
      const currIdx = historyIndexRef.current;
      const nextHistory = currHist.slice(0, currIdx + 1);
      nextHistory.push(newSnapshot);

      if (nextHistory.length > MAX_HISTORY_LENGTH) {
        nextHistory.shift();
      }

      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      if (onRestoreSnapshotState) {
        onRestoreSnapshotState(newProcessedUrl, newMaskUrl, newOriginalUrl, newDimensions);
      } else {
        setProcessedAndMask(newProcessedUrl, newMaskUrl);
      }
    },
    [onRestoreSnapshotState, setProcessedAndMask]
  );

  // Record an AI picture enhancement or fine color grading edit
  const recordEnhanceEdit = useCallback(
    (
      newProcessedUrl: string,
      enhanceParams?: any,
      description = 'AI Picture Enhancement'
    ) => {
      if (isTraversingRef.current) return;

      const newSnapshot: ImageEditSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        description,
        category: 'enhance',
        processedUrl: newProcessedUrl,
        maskDataUrl: maskUrlRef.current,
        bgSettings: { ...bgSettingsRef.current },
        dimensions: dimensionsRef.current ? { ...dimensionsRef.current } : undefined,
        originalUrl: originalUrlRef.current || undefined,
        enhanceParams: enhanceParams ? { ...enhanceParams } : undefined,
      };

      const currHist = historyRef.current;
      const currIdx = historyIndexRef.current;
      const nextHistory = currHist.slice(0, currIdx + 1);
      nextHistory.push(newSnapshot);

      if (nextHistory.length > MAX_HISTORY_LENGTH) {
        nextHistory.shift();
      }

      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setProcessedAndMask(newProcessedUrl, maskUrlRef.current);
    },
    [setProcessedAndMask]
  );

  // Monitor background settings changes and record snapshots to history (debounced for sliders)
  useEffect(() => {
    if (!isImageReady || !processedUrlRef.current || isTraversingRef.current) {
      return;
    }

    const currIndex = historyIndexRef.current;
    const currHistory = historyRef.current;
    if (currIndex < 0 || !currHistory[currIndex]) {
      return;
    }

    const currentSavedBg = currHistory[currIndex].bgSettings;
    if (!hasBackgroundChanged(currentSavedBg, bgSettings)) {
      return;
    }

    // Debounce to collapse rapid slider motions into a single clean undo step
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Type or preset change is instant (100ms), sliders are 350ms
    const isTypeChange = currentSavedBg.type !== bgSettings.type;
    const delay = isTypeChange ? 80 : 320;

    debounceTimerRef.current = setTimeout(() => {
      if (isTraversingRef.current) return;

      const latestIdx = historyIndexRef.current;
      const latestHist = historyRef.current;
      const lastSnap = latestHist[latestIdx];

      if (lastSnap && !hasBackgroundChanged(lastSnap.bgSettings, bgSettings)) {
        return;
      }

      const description = getBackgroundChangeDescription(bgSettings, lastSnap?.bgSettings);

      const newSnapshot: ImageEditSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        description,
        category: 'background',
        processedUrl: processedUrlRef.current!,
        maskDataUrl: maskUrlRef.current,
        bgSettings: { ...bgSettings },
      };

      const nextHistory = latestHist.slice(0, latestIdx + 1);
      nextHistory.push(newSnapshot);

      if (nextHistory.length > MAX_HISTORY_LENGTH) {
        nextHistory.shift();
      }

      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [bgSettings, isImageReady]);

  // Undo execution
  const undo = useCallback(() => {
    const currIdx = historyIndexRef.current;
    const currHist = historyRef.current;

    if (currIdx <= 0 || currHist.length === 0) return;

    const targetIdx = currIdx - 1;
    const targetSnapshot = currHist[targetIdx];
    const undoneSnapshot = currHist[currIdx];

    isTraversingRef.current = true;
    setHistoryIndex(targetIdx);

    if (onRestoreSnapshotState) {
      onRestoreSnapshotState(
        targetSnapshot.processedUrl,
        targetSnapshot.maskDataUrl,
        targetSnapshot.originalUrl,
        targetSnapshot.dimensions
      );
    } else {
      setProcessedAndMask(targetSnapshot.processedUrl, targetSnapshot.maskDataUrl);
    }
    setBgSettings({ ...targetSnapshot.bgSettings });

    onToast(`Undone: ${undoneSnapshot.description}`, 'info');

    setTimeout(() => {
      isTraversingRef.current = false;
    }, 120);
  }, [setProcessedAndMask, setBgSettings, onToast, onRestoreSnapshotState]);

  // Redo execution
  const redo = useCallback(() => {
    const currIdx = historyIndexRef.current;
    const currHist = historyRef.current;

    if (currIdx >= currHist.length - 1 || currHist.length === 0) return;

    const targetIdx = currIdx + 1;
    const targetSnapshot = currHist[targetIdx];

    isTraversingRef.current = true;
    setHistoryIndex(targetIdx);

    if (onRestoreSnapshotState) {
      onRestoreSnapshotState(
        targetSnapshot.processedUrl,
        targetSnapshot.maskDataUrl,
        targetSnapshot.originalUrl,
        targetSnapshot.dimensions
      );
    } else {
      setProcessedAndMask(targetSnapshot.processedUrl, targetSnapshot.maskDataUrl);
    }
    setBgSettings({ ...targetSnapshot.bgSettings });

    onToast(`Redone: ${targetSnapshot.description}`, 'info');

    setTimeout(() => {
      isTraversingRef.current = false;
    }, 120);
  }, [setProcessedAndMask, setBgSettings, onToast, onRestoreSnapshotState]);

  // Jump to specific state in history
  const jumpToStep = useCallback(
    (targetIdx: number) => {
      const currHist = historyRef.current;
      if (targetIdx < 0 || targetIdx >= currHist.length || targetIdx === historyIndexRef.current) {
        return;
      }

      const targetSnapshot = currHist[targetIdx];

      isTraversingRef.current = true;
      setHistoryIndex(targetIdx);

      if (onRestoreSnapshotState) {
        onRestoreSnapshotState(
          targetSnapshot.processedUrl,
          targetSnapshot.maskDataUrl,
          targetSnapshot.originalUrl,
          targetSnapshot.dimensions
        );
      } else {
        setProcessedAndMask(targetSnapshot.processedUrl, targetSnapshot.maskDataUrl);
      }
      setBgSettings({ ...targetSnapshot.bgSettings });

      onToast(`Jumped to: ${targetSnapshot.description}`, 'info');

      setTimeout(() => {
        isTraversingRef.current = false;
      }, 120);
    },
    [setProcessedAndMask, setBgSettings, onToast, onRestoreSnapshotState]
  );

  // Revert all edits back to the initial cutout
  const revertToInitial = useCallback(() => {
    if (historyRef.current.length === 0 || historyIndexRef.current === 0) return;
    jumpToStep(0);
  }, [jumpToStep]);

  // Keyboard shortcuts listener (Ctrl+Z, Cmd+Z, Ctrl+Y, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when inside form inputs, textareas, or when modal is open
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable ||
        isEdgeRefinerOpen ||
        isCropModalOpen
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (!modKey) return;

      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if (key === 'z' && !e.shiftKey) {
        if (historyIndexRef.current > 0) {
          e.preventDefault();
          undo();
        }
      }
      // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      else if ((key === 'z' && e.shiftKey) || key === 'y') {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isEdgeRefinerOpen, isCropModalOpen, isEnhanceModalOpen]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undoDescription = canUndo ? history[historyIndex]?.description : null;
  const redoDescription = canRedo ? history[historyIndex + 1]?.description : null;

  return {
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
  };
}
