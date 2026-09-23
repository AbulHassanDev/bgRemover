import { EnhanceParams, EnhancePreset } from '../types';
import { loadImage } from './imageProcessor';

export const DEFAULT_ENHANCE_PARAMS: EnhanceParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  clarity: 0,
  warmth: 0,
  tint: 0,
  dehaze: 0,
  shadows: 0,
  highlights: 0,
  edgeCleanliness: 0,
  vignette: 0,
};

export const ENHANCE_PRESETS: EnhancePreset[] = [
  {
    id: 'auto-smart',
    name: 'Auto Smart Fix',
    badge: 'AI Smart',
    description: 'Balanced studio exposure, crisp edge clarity, and natural color pop',
    params: {
      brightness: 6,
      contrast: 10,
      saturation: 10,
      vibrance: 16,
      clarity: 28,
      warmth: 2,
      tint: 0,
      dehaze: 12,
      shadows: 14,
      highlights: -8,
      edgeCleanliness: 35,
      vignette: 0,
    },
  },
  {
    id: 'studio-portrait',
    name: 'Studio Portrait Glow',
    badge: 'Portraits',
    description: 'Flattering warm skin tone, lifted shadows, and gentle rim light',
    params: {
      brightness: 8,
      contrast: 8,
      saturation: 6,
      vibrance: 14,
      clarity: 16,
      warmth: 12,
      tint: -2,
      dehaze: 6,
      shadows: 20,
      highlights: -12,
      edgeCleanliness: 45,
      vignette: 10,
    },
  },
  {
    id: 'product-punch',
    name: 'E-Commerce Punch',
    badge: 'Products',
    description: 'Maximum micro-contrast, crisp texture definition, and neutral whites',
    params: {
      brightness: 5,
      contrast: 18,
      saturation: 12,
      vibrance: 16,
      clarity: 45,
      warmth: -4,
      tint: 0,
      dehaze: 22,
      shadows: 10,
      highlights: -6,
      edgeCleanliness: 55,
      vignette: 0,
    },
  },
  {
    id: 'vibrant-pop',
    name: 'Vibrant Color Pop',
    badge: 'Rich Colors',
    description: 'Dynamic color vibrancy, lively saturation, and sunny brilliance',
    params: {
      brightness: 4,
      contrast: 14,
      saturation: 28,
      vibrance: 34,
      clarity: 22,
      warmth: 4,
      tint: 0,
      dehaze: 16,
      shadows: 8,
      highlights: -4,
      edgeCleanliness: 30,
      vignette: 4,
    },
  },
  {
    id: 'cinematic-mood',
    name: 'Cinematic Moody',
    badge: 'Stylized',
    description: 'Deep dramatic shadows, stylized filmic contrast, and edge focus',
    params: {
      brightness: -4,
      contrast: 26,
      saturation: -6,
      vibrance: 8,
      clarity: 32,
      warmth: -8,
      tint: 4,
      dehaze: 24,
      shadows: -16,
      highlights: 10,
      edgeCleanliness: 25,
      vignette: 30,
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour Warmth',
    badge: 'Warm',
    description: 'Sun-drenched golden tones with soft highlights and warm shadows',
    params: {
      brightness: 6,
      contrast: 10,
      saturation: 18,
      vibrance: 22,
      clarity: 18,
      warmth: 28,
      tint: 4,
      dehaze: 10,
      shadows: 16,
      highlights: -12,
      edgeCleanliness: 30,
      vignette: 14,
    },
  },
  {
    id: 'crisp-neutral',
    name: 'Clean Minimalist',
    badge: 'Neutral',
    description: 'Neutral daylight calibration, lifted shadow detail, and clean tones',
    params: {
      brightness: 8,
      contrast: 12,
      saturation: 0,
      vibrance: 6,
      clarity: 32,
      warmth: -6,
      tint: 0,
      dehaze: 16,
      shadows: 22,
      highlights: -16,
      edgeCleanliness: 40,
      vignette: 0,
    },
  },
  {
    id: 'hdr-recovery',
    name: 'HDR Dynamic Recover',
    badge: 'HDR',
    description: 'Aggressive shadow retrieval and highlight recovery for high-contrast scenes',
    params: {
      brightness: 2,
      contrast: 16,
      saturation: 14,
      vibrance: 18,
      clarity: 38,
      warmth: 0,
      tint: 0,
      dehaze: 24,
      shadows: 40,
      highlights: -38,
      edgeCleanliness: 35,
      vignette: 0,
    },
  },
];

/**
 * Check if current parameters deviate from default neutral values
 */
export function hasEnhanceChanges(params: EnhanceParams): boolean {
  return (
    params.brightness !== 0 ||
    params.contrast !== 0 ||
    params.saturation !== 0 ||
    params.vibrance !== 0 ||
    params.clarity !== 0 ||
    params.warmth !== 0 ||
    params.tint !== 0 ||
    params.dehaze !== 0 ||
    params.shadows !== 0 ||
    params.highlights !== 0 ||
    params.edgeCleanliness !== 0 ||
    params.vignette !== 0
  );
}

/**
 * High-performance 2D Canvas enhancement processor.
 * Executes color curves, white balance matrix, edge defringing, and unsharp mask.
 */
export function applyEnhanceToCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  params: EnhanceParams
): void {
  const width = 'naturalWidth' in source ? source.naturalWidth || source.width : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight || source.height : source.height;

  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Draw source image to canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  // If no adjustments, source is already drawn
  if (!hasEnhanceChanges(params)) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // Normalized parameters
  const b = params.brightness; // -50 to 50
  const c = params.contrast; // -50 to 50
  const sat = params.saturation; // -50 to 50
  const vib = params.vibrance; // -50 to 50
  const warmth = params.warmth; // -50 to 50
  const tint = params.tint; // -50 to 50
  const dehaze = params.dehaze; // 0 to 100
  const shadows = params.shadows; // -50 to 50
  const highlights = params.highlights; // -50 to 50
  const edgeCleanliness = params.edgeCleanliness; // 0 to 100
  const vignette = params.vignette; // 0 to 100

  // 1. Precalculate 256-entry Tone Curve LUT (Contrast + Brightness + Dehaze + Shadows + Highlights)
  const lut = new Uint8Array(256);
  const contrastFactor = (259 * (c * 2.55 + 255)) / (255 * (259 - c * 2.55));
  const dehazeBlackPoint = Math.round((dehaze / 100) * 22);

  for (let i = 0; i < 256; i++) {
    let val = i;

    // Dehaze black point lift & expansion
    if (dehazeBlackPoint > 0) {
      val = Math.max(0, val - dehazeBlackPoint) * (255 / (255 - dehazeBlackPoint));
    }

    // Shadows boost (affects lower half)
    if (shadows !== 0) {
      const shadowWeight = Math.max(0, 1 - val / 140);
      val += shadows * 0.9 * shadowWeight;
    }

    // Highlights recovery/boost (affects upper half)
    if (highlights !== 0) {
      const highlightWeight = Math.max(0, (val - 115) / 140);
      val += highlights * 0.9 * highlightWeight;
    }

    // Brightness offset
    val += b * 1.5;

    // Contrast S-curve around mid-tone 128
    val = contrastFactor * (val - 128) + 128;

    lut[i] = Math.max(0, Math.min(255, Math.round(val)));
  }

  // Multipliers for Warmth (Red/Blue) and Tint (Green)
  const rWarmthMult = 1 + (warmth * 0.007);
  const bWarmthMult = 1 - (warmth * 0.007);
  const gTintMult = 1 - (tint * 0.006);

  // Saturation & Vibrance factors
  const satMult = 1 + (sat * 0.018);
  const vibFactor = vib * 0.015;

  // Process all pixels
  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // Transparent pixel

    let r = data[i];
    let g = data[i + 1];
    let bl = data[i + 2];

    // Apply Tone LUT
    r = lut[r];
    g = lut[g];
    bl = lut[bl];

    // Apply White Balance & Tint
    r = Math.min(255, r * rWarmthMult);
    g = Math.min(255, g * gTintMult);
    bl = Math.min(255, bl * bWarmthMult);

    // Apply Saturation & Vibrance
    const maxVal = Math.max(r, Math.max(g, bl));
    const minVal = Math.min(r, Math.min(g, bl));
    const currentSat = maxVal === 0 ? 0 : (maxVal - minVal) / 255;

    // Vibrance boosts less-saturated colors more
    const pixelVibBoost = 1 + (vibFactor * (1 - currentSat));
    const totalSatMult = satMult * pixelVibBoost;

    if (totalSatMult !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * bl;
      r = Math.max(0, Math.min(255, gray + (r - gray) * totalSatMult));
      g = Math.max(0, Math.min(255, gray + (g - gray) * totalSatMult));
      bl = Math.max(0, Math.min(255, gray + (bl - gray) * totalSatMult));
    }

    // Edge Cleanliness / De-halo for boundary semi-transparent pixels (Alpha 15 to 240)
    if (edgeCleanliness > 0 && a > 15 && a < 240) {
      const edgeWeight = (1 - (a / 255)) * (edgeCleanliness / 100);
      // Suppress saturated background edge fringe
      const avg = (r + g + bl) / 3;
      r = r * (1 - edgeWeight * 0.4) + avg * (edgeWeight * 0.4);
      g = g * (1 - edgeWeight * 0.4) + avg * (edgeWeight * 0.4);
      bl = bl * (1 - edgeWeight * 0.4) + avg * (edgeWeight * 0.4);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = bl;
  }

  // 2. Apply Clarity (Sharpness / Unsharp Masking using spatial convolution)
  if (params.clarity > 0) {
    applyClarityFilter(imgData, width, height, params.clarity);
  }

  // 3. Apply Vignette if enabled
  if (vignette > 0) {
    applyVignette(data, width, height, vignette);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Fast spatial 3x3 unsharp convolution kernel for micro-contrast & edge clarity
 */
function applyClarityFilter(imgData: ImageData, width: number, height: number, clarity: number): void {
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  const k = (clarity / 100) * 0.75; // kernel strength

  // Fast stride loop avoiding borders
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const rowAbove = (y - 1) * width;
    const rowBelow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (rowOffset + x) * 4;
      const alpha = src[idx + 3];
      if (alpha === 0) continue;

      // 4-neighbor cross laplacian
      const idxUp = (rowAbove + x) * 4;
      const idxDown = (rowBelow + x) * 4;
      const idxLeft = (rowOffset + (x - 1)) * 4;
      const idxRight = (rowOffset + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const laplacian = 4 * center - src[idxUp + c] - src[idxDown + c] - src[idxLeft + c] - src[idxRight + c];
        dst[idx + c] = Math.max(0, Math.min(255, Math.round(center + laplacian * k)));
      }
    }
  }
}

/**
 * Apply subtle vignette shading from center to edges
 */
function applyVignette(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  const strength = (intensity / 100) * 0.75;

  for (let y = 0; y < height; y++) {
    const dy = y - centerY;
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      if (dist > 0.45) {
        const factor = 1 - Math.pow((dist - 0.45) / 0.55, 2) * strength;
        const idx = (row + x) * 4;
        data[idx] = Math.round(data[idx] * factor);
        data[idx + 1] = Math.round(data[idx + 1] * factor);
        data[idx + 2] = Math.round(data[idx + 2] * factor);
      }
    }
  }
}

/**
 * Render enhanced image into a new data URL
 */
export async function renderEnhancedDataUrl(
  sourceUrl: string,
  params: EnhanceParams,
  mimeType = 'image/png'
): Promise<string> {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  applyEnhanceToCanvas(img, canvas, params);
  return canvas.toDataURL(mimeType, 0.98);
}
