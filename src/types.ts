export type ProcessStatus = 'idle' | 'analyzing' | 'processing' | 'completed' | 'error';

export interface ImageItem {
  id: string;
  name: string;
  size: number;
  type: string;
  originalUrl: string;
  processedUrl: string | null;
  maskDataUrl: string | null; // alpha mask as grayscale base64
  status: ProcessStatus;
  progress: number;
  progressStage: string;
  dimensions: {
    width: number;
    height: number;
  };
  error: string | null;
  aiInfo?: {
    subjectType?: string;
    confidence?: number;
    edgeComplexity?: string;
    backgroundDescription?: string;
  };
  refineHistory?: string[]; // undo history data URLs
  historyIndex?: number;
}

export type BackgroundType = 'transparent' | 'solid' | 'gradient' | 'stock' | 'custom' | 'blur';

export interface GradientOption {
  id: string;
  name: string;
  from: string;
  to: string;
  angle: number;
  css: string;
}

export interface HoverBgPreview {
  type: 'solid' | 'gradient';
  name: string;
  color?: string;
  gradientId?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientCss?: string;
  angle?: number;
}

export interface StockBackground {
  id: string;
  title: string;
  category: 'studio' | 'office' | 'nature' | 'urban' | 'abstract' | 'luxury';
  url: string;
  thumbnail: string;
}

export interface BackgroundSettings {
  type: BackgroundType;
  solidColor: string;
  gradientId: string;
  gradientAngle: number;
  stockImageId: string;
  stockImageUrl: string;
  customImageUrl: string | null;
  blurIntensity: number; // 0 to 40 px
  opacity: number; // 0 to 100
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  checkerPattern: 'checker-light' | 'checker-dark' | 'checker-contrast';
  checkerSize: number; // 8 to 32
  // Drop Shadow Controls
  shadowEnabled: boolean;
  shadowDistance: number; // 0 to 80 px
  shadowBlur: number; // 0 to 60 px
  shadowOpacity: number; // 0 to 100 %
  shadowAngle?: number; // 0 to 360 degrees (default 135)
  shadowColor?: string; // hex or rgba, default '#000000'
}

export interface BrushSettings {
  mode: 'erase' | 'restore' | 'pan';
  size: number; // 2 to 150
  hardness: number; // 0 to 100
  opacity: number; // 10 to 100
  showMaskOverlay: boolean;
  maskColor: string; // '#ef4444' | '#22c55e' | '#3b82f6'
  maskOpacity: number; // 20 to 80
}

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.6 to 1.0
  resolution: 'original' | 'standard' | 'high' | 'custom';
  customWidth?: number;
  customHeight?: number;
  includeBackground: boolean;
  backgroundColorIfJpg: string;
}

export interface SampleImage {
  id: string;
  title: string;
  category: 'Portrait' | 'Product' | 'Pet' | 'Vehicle' | 'Plant' | 'Executive';
  difficulty: 'Hair detail' | 'Clean edges' | 'Fine fur' | 'Complex reflections' | 'Translucent leaves' | 'Studio Portrait';
  url: string;
  thumbnail: string;
}

export type ViewMode = 'slider' | 'side-by-side' | 'cutout-only' | 'mask-only';
export type AppTab = 'editor' | 'batch' | 'compare';

export type EngineMode = 'neural-server' | 'wasm-neural' | 'fast-client' | 'cloud-api';
export type CloudProvider = 'removebg' | 'falai' | 'huggingface';

export interface ApiSettings {
  engineMode: EngineMode;
  cloudProvider: CloudProvider;
  removeBgApiKey: string;
  falAiApiKey: string;
  huggingFaceApiKey: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPresetId =
  | 'free'
  | '1:1'
  | '4:5'
  | '16:9'
  | '9:16'
  | '4:3'
  | '3:2'
  | 'original';

export interface AspectRatioOption {
  id: AspectRatioPresetId;
  name: string;
  ratio: number | null; // width / height, or null for free
  description?: string;
  badge?: string;
}

export type EditCategory = 'initial' | 'brush' | 'background' | 'crop' | 'enhance';

export interface EnhanceParams {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  vibrance: number; // -50 to 50
  clarity: number; // 0 to 100 (unsharp mask sharpness)
  warmth: number; // -50 to 50 (color temp)
  tint: number; // -50 to 50 (green/magenta)
  dehaze: number; // 0 to 100
  shadows: number; // -50 to 50
  highlights: number; // -50 to 50
  edgeCleanliness: number; // 0 to 100 (de-halo / defringe edges)
  vignette: number; // 0 to 100
}

export interface EnhancePreset {
  id: string;
  name: string;
  badge?: string;
  description: string;
  params: EnhanceParams;
}

export interface AIEnhanceAnalysisResult {
  suggestedParams: EnhanceParams;
  reasoning: string;
  detectedIssues: string[];
  recommendedPreset: string;
  qualityScore?: number;
}

export interface ImageEditSnapshot {
  id: string;
  timestamp: number;
  description: string;
  category: EditCategory;
  processedUrl: string;
  maskDataUrl: string | null;
  bgSettings: BackgroundSettings;
  dimensions?: { width: number; height: number };
  originalUrl?: string;
  enhanceParams?: EnhanceParams;
}
