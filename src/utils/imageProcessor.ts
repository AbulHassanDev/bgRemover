import { BackgroundSettings, ApiSettings, CropRect } from '../types';

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load an image safely from URL or base64 data URL with LRU memory caching
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (imageCache.size > 40) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) imageCache.delete(firstKey);
      }
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(new Error(`Failed to load image from source: ${e}`));
    img.src = src;
  });
}

/**
 * Convert hex color string to rgba CSS string
 */
export function hexToRgba(hex: string, alpha: number): string {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Convert Canvas to Blob helper
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      type,
      quality
    );
  });
}

/**
 * Extract an alpha mask (grayscale visual dataUrl) from a transparent cutout image
 */
export function extractMaskFromCutout(cutoutImg: HTMLImageElement): Promise<string> {
  return new Promise((resolve) => {
    const w = cutoutImg.naturalWidth || cutoutImg.width;
    const h = cutoutImg.naturalHeight || cutoutImg.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(cutoutImg, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      data[i] = a;
      data[i + 1] = a;
      data[i + 2] = a;
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
}

/**
 * Convert Image or URL to Base64
 */
export async function imageToBase64(imgOrUrl: HTMLImageElement | string): Promise<string> {
  if (typeof imgOrUrl === 'string' && imgOrUrl.startsWith('data:')) {
    return imgOrUrl;
  }
  const img = typeof imgOrUrl === 'string' ? await loadImage(imgOrUrl) : imgOrUrl;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export interface RemovalResult {
  processedUrl: string;
  maskDataUrl: string;
  width: number;
  height: number;
  engineUsed?: 'cloud-api' | 'neural-wasm' | 'fast-fallback' | 'fast-client';
  fallbackReason?: string;
}

/**
 * Helper: render an HTMLImageElement to a bounded-resolution ImageData / RGBA buffer
 */
function getOriginalImageData(img: HTMLImageElement): {
  width: number;
  height: number;
  data: Uint8ClampedArray;
} {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, width, height);
  return {
    width,
    height,
    data: ctx.getImageData(0, 0, width, height).data,
  };
}

/**
 * Bilinearly resample a grayscale alpha map (0..1 Float32Array) from srcW x srcH to dstW x dstH
 */
function resampleAlphaBilinear(
  srcAlpha: Float32Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Float32Array {
  if (srcW === dstW && srcH === dstH) {
    return srcAlpha;
  }
  const out = new Float32Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const sy = Math.max(0, Math.min(srcH - 1.0001, (y + 0.5) * scaleY - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(srcH - 1, y0 + 1);
    const fy = sy - y0;
    const fy1 = 1 - fy;

    for (let x = 0; x < dstW; x++) {
      const sx = Math.max(0, Math.min(srcW - 1.0001, (x + 0.5) * scaleX - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const fx = sx - x0;
      const fx1 = 1 - fx;

      const a00 = srcAlpha[y0 * srcW + x0];
      const a10 = srcAlpha[y0 * srcW + x1];
      const a01 = srcAlpha[y1 * srcW + x0];
      const a11 = srcAlpha[y1 * srcW + x1];

      out[y * dstW + x] =
        (a00 * fx1 + a10 * fx) * fy1 + (a01 * fx1 + a11 * fx) * fy;
    }
  }
  return out;
}

/**
 * Studio-grade cutout refiner:
 * 1. Cleans faint background alpha haze & isolated micro-speckles while preserving fine hair strands
 * 2. Applies narrow-band joint RGB-guided edge snapping so upscaled neural mattes hug sharp full-res contours
 * 3. Performs foreground color decontamination (de-halo / de-fringe) on semi-transparent edges
 *    to remove white/colored halos on dark hair, blazers, hijabs, and product silhouettes
 */
async function refineCutoutWithOriginal(
  origImg: HTMLImageElement,
  alphaMap: Float32Array,
  alphaW: number,
  alphaH: number,
  options: { guidedWeight?: number; defringeStrength?: number } = {}
): Promise<{ processedUrl: string; maskDataUrl: string; width: number; height: number }> {
  const { width: origW, height: origH, data: origPx } = getOriginalImageData(origImg);
  const guidedWeight = options.guidedWeight ?? 0.28;
  const defringeStrength = options.defringeStrength ?? 0.92;

  const fullAlpha = resampleAlphaBilinear(alphaMap, alphaW, alphaH, origW, origH);
  const cleanedAlpha = new Float32Array(origW * origH);

  // Pass 1: Alpha hygiene + isolated noise dust suppression
  for (let y = 0; y < origH; y++) {
    const rowOff = y * origW;
    for (let x = 0; x < origW; x++) {
      const idx = rowOff + x;
      let a = fullAlpha[idx];
      if (a <= 0.03) {
        cleanedAlpha[idx] = 0;
        continue;
      }
      if (a >= 0.965) {
        cleanedAlpha[idx] = 1;
        continue;
      }
      // Suppress isolated faint haze dots (< 0.14) surrounded by empty space
      if (a < 0.14 && x > 0 && x < origW - 1 && y > 0 && y < origH - 1) {
        const nbrAvg =
          (fullAlpha[idx - 1] +
            fullAlpha[idx + 1] +
            fullAlpha[idx - origW] +
            fullAlpha[idx + origW]) *
          0.25;
        if (nbrAvg < 0.065) {
          a *= nbrAvg / 0.065;
          if (a < 0.025) a = 0;
        }
      }
      cleanedAlpha[idx] = a;
    }
  }

  // Pass 2: Narrow-band joint color-guided edge alignment
  const refinedAlpha = new Float32Array(cleanedAlpha);
  const invTwoSigmaSq = 1 / (2 * 26 * 26);

  if (guidedWeight > 0) {
    for (let y = 1; y < origH - 1; y++) {
      const rowOff = y * origW;
      for (let x = 1; x < origW - 1; x++) {
        const idx = rowOff + x;
        const aC = cleanedAlpha[idx];
        // Only refine transition boundary pixels
        if (aC <= 0.015 || aC >= 0.985) continue;

        const pC = idx * 4;
        const rC = origPx[pC];
        const gC = origPx[pC + 1];
        const bC = origPx[pC + 2];

        let wSum = 0;
        let aSum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const nRow = (y + dy) * origW;
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = nRow + (x + dx);
            const np = nIdx * 4;
            const dr = origPx[np] - rC;
            const dg = origPx[np + 1] - gC;
            const db = origPx[np + 2] - bC;
            const distSq = dr * dr + dg * dg + db * db;
            const spatial = dx === 0 && dy === 0 ? 1.5 : dx === 0 || dy === 0 ? 1.0 : 0.7;
            const w = spatial * Math.exp(-distSq * invTwoSigmaSq);
            wSum += w;
            aSum += w * cleanedAlpha[nIdx];
          }
        }

        if (wSum > 0) {
          const guided = aSum / wSum;
          if (Math.abs(guided - aC) < 0.42) {
            refinedAlpha[idx] = aC * (1 - guidedWeight) + guided * guidedWeight;
          }
        }
      }
    }
  }

  // Pass 3: Build output RGBA with Foreground Color Decontamination (De-Halo) + Alpha Mask Canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = origW;
  outCanvas.height = origH;
  const outCtx = outCanvas.getContext('2d')!;
  const outImgData = outCtx.createImageData(origW, origH);
  const outPx = outImgData.data;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = origW;
  maskCanvas.height = origH;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImgData = maskCtx.createImageData(origW, origH);
  const maskPx = maskImgData.data;

  // Search offsets ordered by proximity (radii 1..4)
  const searchOffsets: Array<[number, number, number]> = [];
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (dx === 0 && dy === 0) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 18) {
        searchOffsets.push([dx, dy, 1 / (1 + Math.sqrt(d2))]);
      }
    }
  }

  for (let y = 0; y < origH; y++) {
    const rowOff = y * origW;
    for (let x = 0; x < origW; x++) {
      const idx = rowOff + x;
      const pIdx = idx * 4;
      const origA = origPx[pIdx + 3] / 255;
      const a = Math.max(0, Math.min(1, refinedAlpha[idx] * origA));
      const aByte = Math.round(a * 255);

      maskPx[pIdx] = aByte;
      maskPx[pIdx + 1] = aByte;
      maskPx[pIdx + 2] = aByte;
      maskPx[pIdx + 3] = 255;

      if (aByte === 0) {
        outPx[pIdx] = 0;
        outPx[pIdx + 1] = 0;
        outPx[pIdx + 2] = 0;
        outPx[pIdx + 3] = 0;
        continue;
      }

      let r = origPx[pIdx];
      let g = origPx[pIdx + 1];
      let b = origPx[pIdx + 2];

      // Decontaminate semi-transparent edge pixels (removes bright/colored background halos)
      if (defringeStrength > 0 && aByte > 4 && aByte < 244) {
        let fgR = 0;
        let fgG = 0;
        let fgB = 0;
        let fgW = 0;

        for (let k = 0; k < searchOffsets.length; k++) {
          const [dx, dy, proxW] = searchOffsets[k];
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= origW || ny < 0 || ny >= origH) continue;
          const nIdx = ny * origW + nx;
          const na = refinedAlpha[nIdx];
          if (na >= 0.92) {
            const np = nIdx * 4;
            const w = proxW * na;
            fgR += origPx[np] * w;
            fgG += origPx[np + 1] * w;
            fgB += origPx[np + 2] * w;
            fgW += w;
          }
        }

        if (fgW > 0) {
          fgR /= fgW;
          fgG /= fgW;
          fgB /= fgW;
          // Higher defringe weight near lower alpha where background bleed is strongest
          const blend = Math.min(0.95, defringeStrength * Math.pow(1 - a, 0.65));
          r = Math.round(r * (1 - blend) + fgR * blend);
          g = Math.round(g * (1 - blend) + fgG * blend);
          b = Math.round(b * (1 - blend) + fgB * blend);
        }
      }

      outPx[pIdx] = r;
      outPx[pIdx + 1] = g;
      outPx[pIdx + 2] = b;
      outPx[pIdx + 3] = aByte;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  maskCtx.putImageData(maskImgData, 0, 0);

  const processedBlob = await canvasToBlob(outCanvas, 'image/png');
  const processedUrl = URL.createObjectURL(processedBlob);
  const maskDataUrl = maskCanvas.toDataURL('image/png');

  return {
    processedUrl,
    maskDataUrl,
    width: origW,
    height: origH,
  };
}

/**
 * High-Precision Server / Hybrid AI Neural Background Removal (ISNet deep learning model).
 * Uses configured server provider if available, otherwise executes ISNet
 * neural segmentation directly on-device via runtime-loaded WebAssembly.
 */
export async function removeBackgroundServer(
  img: HTMLImageElement,
  onProgress?: (percent: number, stage: string) => void,
  apiSettings?: ApiSettings
): Promise<RemovalResult> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(10, 'Initializing Neural AI Engine...');

  const hasBackend = await isExpressProxyAvailable();
  if (hasBackend) {
    try {
      const base64 = await imageToBase64(img);
      const res = await fetch('/api/ai/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.resultBase64) {
          onProgress?.(85, 'Extracting alpha mask & perfecting fine edges...');
          const cutoutImg = await loadImage(data.resultBase64);
          const maskDataUrl = await extractMaskFromCutout(cutoutImg);
          onProgress?.(100, 'Complete');
          return {
            processedUrl: data.resultBase64,
            maskDataUrl,
            width: origW,
            height: origH,
            engineUsed: 'cloud-api',
          };
        }
      }
    } catch {
      // Static host or offline — fall through cleanly to client neural WASM
    }
  }

  return await removeBackgroundNeuralWasm(img, onProgress, apiSettings);
}

/**
 * High-Resolution Geodesic Edge-Barrier Client Segmenter (Turbo / Offline fallback).
 * Uses multi-border background color modeling, edge-weighted priority-queue propagation,
 * interior hole closure (protecting foreheads, eyes, shirts), and bilinear guided alpha refinement.
 */
export async function removeBackgroundFastClient(
  img: HTMLImageElement,
  onProgress?: (percent: number, stage: string) => void
): Promise<RemovalResult> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(20, 'Analyzing high-resolution contours & borders...');
  await new Promise((r) => setTimeout(r, 15));

  const maxDim = 960;
  const scale = Math.min(1, maxDim / Math.max(origW, origH));
  const workW = Math.max(48, Math.round(origW * scale));
  const workH = Math.max(48, Math.round(origH * scale));
  const totalPx = workW * workH;

  const workCanvas = document.createElement('canvas');
  workCanvas.width = workW;
  workCanvas.height = workH;
  const workCtx = workCanvas.getContext('2d', { willReadFrequently: true })!;
  workCtx.imageSmoothingEnabled = true;
  workCtx.imageSmoothingQuality = 'high';
  workCtx.drawImage(img, 0, 0, workW, workH);

  const px = workCtx.getImageData(0, 0, workW, workH).data;

  onProgress?.(40, 'Building edge-barrier & border saliency map...');
  await new Promise((r) => setTimeout(r, 15));

  // 1. Compute perceptual Sobel edge magnitude (0..255)
  const edges = new Float32Array(totalPx);
  for (let y = 1; y < workH - 1; y++) {
    const row = y * workW;
    for (let x = 1; x < workW - 1; x++) {
      const idxL = (row + x - 1) * 4;
      const idxR = (row + x + 1) * 4;
      const idxU = ((y - 1) * workW + x) * 4;
      const idxD = ((y + 1) * workW + x) * 4;

      const gx =
        Math.abs(px[idxR] - px[idxL]) * 0.3 +
        Math.abs(px[idxR + 1] - px[idxL + 1]) * 0.59 +
        Math.abs(px[idxR + 2] - px[idxL + 2]) * 0.11;
      const gy =
        Math.abs(px[idxD] - px[idxU]) * 0.3 +
        Math.abs(px[idxD + 1] - px[idxU + 1]) * 0.59 +
        Math.abs(px[idxD + 2] - px[idxU + 2]) * 0.11;

      edges[row + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.35);
    }
  }

  // 2. Sample perimeter seeds (top, upper-left, upper-right, and safe lower outer corners)
  const seedIndices: number[] = [];
  const stepX = Math.max(2, Math.floor(workW / 48));
  const stepY = Math.max(2, Math.floor(workH / 48));

  for (let x = 2; x < workW - 2; x += stepX) {
    seedIndices.push(2 * workW + x); // top edge
    // Only seed bottom edge in outer 18% corners to avoid cutting off torso/subject base
    if (x < workW * 0.18 || x > workW * 0.82) {
      seedIndices.push((workH - 3) * workW + x);
    }
  }
  for (let y = 2; y < workH - 2; y += stepY) {
    const idxL = y * workW + 2;
    const idxR = y * workW + (workW - 3);
    if (y < workH * 0.75 || edges[idxL] < 12) seedIndices.push(idxL);
    if (y < workH * 0.75 || edges[idxR] < 12) seedIndices.push(idxR);
  }

  // Build compact border background color palette (representative clusters)
  const palette: Array<[number, number, number]> = [];
  for (const sIdx of seedIndices) {
    if (edges[sIdx] > 28) continue;
    const p = sIdx * 4;
    const r = px[p];
    const g = px[p + 1];
    const b = px[p + 2];
    const hasClose = palette.some(
      ([pr, pg, pb]) =>
        Math.abs(pr - r) * 0.3 + Math.abs(pg - g) * 0.59 + Math.abs(pb - b) * 0.11 < 18
    );
    if (!hasClose && palette.length < 16) {
      palette.push([r, g, b]);
    }
  }

  // 3. Zero-spatial-tax Bucketed Dial's Geodesic Distance (512 half-unit buckets: 0..255.5, O(N))
  const MAX_BUCKET = 510;
  const dist = new Uint16Array(totalPx).fill(65535);
  const seedRefR = new Uint8Array(totalPx);
  const seedRefG = new Uint8Array(totalPx);
  const seedRefB = new Uint8Array(totalPx);
  const buckets: number[][] = Array.from({ length: MAX_BUCKET + 1 }, () => []);

  for (const sIdx of seedIndices) {
    if (edges[sIdx] > 28) continue;
    const p = sIdx * 4;
    dist[sIdx] = 0;
    seedRefR[sIdx] = px[p];
    seedRefG[sIdx] = px[p + 1];
    seedRefB[sIdx] = px[p + 2];
    buckets[0].push(sIdx);
  }

  // Ensure corner pixels are seeded if all perimeter seeds were edged
  if (buckets[0].length === 0) {
    const corners = [
      2 * workW + 2,
      2 * workW + (workW - 3),
      (workH - 3) * workW + 2,
      (workH - 3) * workW + (workW - 3),
    ];
    for (const sIdx of corners) {
      const p = sIdx * 4;
      dist[sIdx] = 0;
      seedRefR[sIdx] = px[p];
      seedRefG[sIdx] = px[p + 1];
      seedRefB[sIdx] = px[p + 2];
      buckets[0].push(sIdx);
      if (palette.length < 4) palette.push([px[p], px[p + 1], px[p + 2]]);
    }
  }

  const dx4 = [1, -1, 0, 0];
  const dy4 = [0, 0, 1, -1];

  onProgress?.(60, 'Tracing geodesic foreground boundaries...');
  await new Promise((r) => setTimeout(r, 10));

  for (let cost = 0; cost <= MAX_BUCKET; cost++) {
    const bucket = buckets[cost];
    while (bucket.length > 0) {
      const pos = bucket.pop()!;
      if (dist[pos] < cost) continue;

      const x = pos % workW;
      const y = (pos - x) / workW;
      const p4 = pos * 4;
      const pr = px[p4];
      const pg = px[p4 + 1];
      const pb = px[p4 + 2];
      const sr = seedRefR[pos];
      const sg = seedRefG[pos];
      const sb = seedRefB[pos];

      for (let k = 0; k < 4; k++) {
        const nx = x + dx4[k];
        const ny = y + dy4[k];
        if (nx < 0 || nx >= workW || ny < 0 || ny >= workH) continue;

        const nPos = ny * workW + nx;
        const np4 = nPos * 4;
        const nr = px[np4];
        const ng = px[np4 + 1];
        const nb = px[np4 + 2];

        // Perceptual local jump + distance to nearest border palette color + Sobel edge barrier
        const dLocal =
          Math.abs(nr - pr) * 0.3 +
          Math.abs(ng - pg) * 0.59 +
          Math.abs(nb - pb) * 0.11;

        let minPalDist =
          Math.abs(nr - sr) * 0.3 +
          Math.abs(ng - sg) * 0.59 +
          Math.abs(nb - sb) * 0.11;
        for (let pi = 0; pi < palette.length; pi++) {
          const pal = palette[pi];
          const dp =
            Math.abs(nr - pal[0]) * 0.3 +
            Math.abs(ng - pal[1]) * 0.59 +
            Math.abs(nb - pal[2]) * 0.11;
          if (dp < minPalDist) minPalDist = dp;
        }

        const edgeVal = edges[nPos];
        // Smooth gradients & studio vignettes (dLocal <= 4 && edgeVal <= 12 && minPalDist <= 38) incur ZERO step cost!
        const localPenalty = dLocal > 4.0 ? (dLocal - 3.5) * 2.4 : 0;
        const palPenalty = minPalDist > 38 ? (minPalDist - 38) * 0.9 : 0;
        const edgeBarrier = edgeVal > 14 ? (edgeVal - 12) * 5.5 : 0;

        const stepHalfUnits = Math.round(localPenalty + palPenalty + edgeBarrier);
        const nextCost = Math.min(MAX_BUCKET, cost + stepHalfUnits);

        if (nextCost < dist[nPos] && nextCost < MAX_BUCKET) {
          dist[nPos] = nextCost;
          seedRefR[nPos] = sr;
          seedRefG[nPos] = sg;
          seedRefB[nPos] = sb;
          buckets[nextCost].push(nPos);
        }
      }
    }
  }

  // 4. Convert geodesic distance (half-units) into soft foreground probability & close interior holes
  const bgReachable = new Uint8Array(totalPx);
  const bgStack: number[] = [];
  const bgThreshold = 140; // = 70 cost units

  for (let x = 0; x < workW; x++) {
    for (const y of [0, workH - 1]) {
      const idx = y * workW + x;
      if (dist[idx] <= bgThreshold && !bgReachable[idx]) {
        bgReachable[idx] = 1;
        bgStack.push(idx);
      }
    }
  }
  for (let y = 0; y < workH; y++) {
    for (const x of [0, workW - 1]) {
      const idx = y * workW + x;
      if (dist[idx] <= bgThreshold && !bgReachable[idx]) {
        bgReachable[idx] = 1;
        bgStack.push(idx);
      }
    }
  }

  while (bgStack.length > 0) {
    const pos = bgStack.pop()!;
    const x = pos % workW;
    const y = (pos - x) / workW;
    for (let k = 0; k < 4; k++) {
      const nx = x + dx4[k];
      const ny = y + dy4[k];
      if (nx < 0 || nx >= workW || ny < 0 || ny >= workH) continue;
      const nPos = ny * workW + nx;
      if (!bgReachable[nPos] && dist[nPos] <= bgThreshold) {
        bgReachable[nPos] = 1;
        bgStack.push(nPos);
      }
    }
  }

  const workAlpha = new Float32Array(totalPx);
  for (let i = 0; i < totalPx; i++) {
    if (!bgReachable[i]) {
      // Interior hole protection: keep enclosed regions fully foreground
      workAlpha[i] = 1.0;
    } else {
      const d = dist[i];
      if (d <= 76) workAlpha[i] = 0.0;
      else if (d >= bgThreshold) workAlpha[i] = 1.0;
      else workAlpha[i] = (d - 76) / (bgThreshold - 76);
    }
  }

  onProgress?.(85, 'Applying bilinear guided edge refinement...');
  const refined = await refineCutoutWithOriginal(img, workAlpha, workW, workH, {
    guidedWeight: 0.45,
    defringeStrength: 0.85,
  });

  onProgress?.(100, 'Complete');
  return {
    ...refined,
    engineUsed: 'fast-client',
  };
}

let cachedImglyModule: any = null;
let cachedBackendAlive: boolean | null = null;

function hasConfiguredExpressBackend(): boolean {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  if (
    env?.VITE_ENABLE_API_HEALTH === 'true' ||
    env?.VITE_EXPRESS_BACKEND === 'true'
  ) {
    return true;
  }
  if (typeof document !== 'undefined') {
    const marker = document
      .querySelector('meta[name="clearcut-backend"]')
      ?.getAttribute('content');
    if (marker === 'express') {
      return true;
    }
  }
  return false;
}

export async function isExpressProxyAvailable(): Promise<boolean> {
  if (cachedBackendAlive !== null) return cachedBackendAlive;
  if (!hasConfiguredExpressBackend()) {
    cachedBackendAlive = false;
    return false;
  }
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) {
      cachedBackendAlive = false;
      return false;
    }
    const data = await res.json().catch(() => null);
    cachedBackendAlive = Boolean(data && data.status === 'ok');
  } catch {
    cachedBackendAlive = false;
  }
  return cachedBackendAlive;
}

async function loadImglyRuntime(): Promise<any> {
  if (cachedImglyModule) return cachedImglyModule;

  const hasProxy = await isExpressProxyAvailable();
  const urls = hasProxy
    ? [
        `${window.location.origin}/api/cdn/jsdelivr/npm/@imgly/background-removal@1.7.0/+esm`,
        'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
        'https://esm.sh/@imgly/background-removal@1.7.0?bundle',
      ]
    : [
        'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
        'https://esm.sh/@imgly/background-removal@1.7.0?bundle',
      ];

  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      cachedImglyModule = await import(/* @vite-ignore */ url);
      return cachedImglyModule;
    } catch (err) {
      console.warn(`Failed loading runtime from ${url}:`, err);
      lastErr = err;
    }
  }
  throw lastErr || new Error('Failed to load Neural WebAssembly runtime');
}

/**
 * Extract normalized alpha channel (0..1 Float32Array) from an HTMLImageElement cutout
 */
function extractAlphaArrayFromImage(cutoutImg: HTMLImageElement): {
  alpha: Float32Array;
  width: number;
  height: number;
} {
  const width = cutoutImg.naturalWidth || cutoutImg.width;
  const height = cutoutImg.naturalHeight || cutoutImg.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(cutoutImg, 0, 0, width, height);
  const px = ctx.getImageData(0, 0, width, height).data;
  const alpha = new Float32Array(width * height);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = px[i * 4 + 3] / 255;
  }
  return { alpha, width, height };
}

/**
 * Neural AI WebAssembly Background Removal via @imgly/background-removal (ISNet FP16 / Q8)
 * loaded dynamically by external CDN / proxy URL at runtime (zero bundle bloat),
 * followed by full-resolution guided edge alignment and foreground color decontamination.
 */
export async function removeBackgroundNeuralWasm(
  img: HTMLImageElement,
  onProgress?: (percent: number, stage: string) => void,
  apiSettings?: ApiSettings
): Promise<RemovalResult> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(8, 'Initializing Neural AI runtime...');

  try {
    const [imgly, hasProxy] = await Promise.all([
      loadImglyRuntime(),
      isExpressProxyAvailable(),
    ]);

    // Prepare an inference-sized PNG blob (<= 2048px preserves full ISNet 1024px detail while preventing OOM)
    const inferMaxDim = 2048;
    const inferScale = Math.min(1, inferMaxDim / Math.max(origW, origH));
    const inferW = Math.max(1, Math.round(origW * inferScale));
    const inferH = Math.max(1, Math.round(origH * inferScale));

    const inferCanvas = document.createElement('canvas');
    inferCanvas.width = inferW;
    inferCanvas.height = inferH;
    const inferCtx = inferCanvas.getContext('2d')!;
    inferCtx.imageSmoothingEnabled = true;
    inferCtx.imageSmoothingQuality = 'high';
    inferCtx.drawImage(img, 0, 0, inferW, inferH);
    const inputBlob = await canvasToBlob(inferCanvas, 'image/png');

    const publicPath = hasProxy
      ? `${window.location.origin}/api/imgly/`
      : 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';

    const precision = apiSettings?.modelPrecision || 'high';
    const modelsToTry: Array<'isnet_fp16' | 'isnet_quint8'> =
      precision === 'balanced' ? ['isnet_quint8'] : ['isnet_fp16', 'isnet_quint8'];

    let resultBlob: Blob | null = null;
    let lastNeuralError: unknown = null;

    for (const modelName of modelsToTry) {
      const modelLabel =
        modelName === 'isnet_fp16' ? 'Studio HD ISNet (FP16)' : 'Fast ISNet (Q8)';
      onProgress?.(18, `Loading ${modelLabel} neural weights...`);

      let stallTimer: ReturnType<typeof setTimeout> | null = null;
      let hardTimer: ReturnType<typeof setTimeout> | null = null;

      try {
        resultBlob = await new Promise<Blob>((resolve, reject) => {
          const clearTimers = () => {
            if (stallTimer) clearTimeout(stallTimer);
            if (hardTimer) clearTimeout(hardTimer);
          };

          const resetStallTimer = () => {
            if (stallTimer) clearTimeout(stallTimer);
            stallTimer = setTimeout(() => {
              clearTimers();
              reject(new Error(`${modelLabel} stalled during download or inference.`));
            }, 50000);
          };

          resetStallTimer();
          hardTimer = setTimeout(() => {
            clearTimers();
            reject(new Error(`${modelLabel} exceeded 180s processing limit.`));
          }, 180000);

          imgly
            .removeBackground(inputBlob, {
              publicPath,
              model: modelName,
              device: 'cpu',
              proxyToWorker: false,
              rescale: true,
              fetchArgs: hasProxy ? undefined : { mode: 'cors', credentials: 'omit' },
              progress: (key: string, current: number, total: number) => {
                resetStallTimer();
                if (total > 0) {
                  const pct = Math.min(90, Math.max(20, Math.round((current / total) * 88)));
                  const stageName = key.includes('fetch')
                    ? `Loading ${modelLabel} weights (${pct}%)...`
                    : key.includes('compute')
                    ? `Deep neural segmentation (${pct}%)...`
                    : `Processing AI layers (${pct}%)...`;
                  onProgress?.(pct, stageName);
                }
              },
              output: {
                format: 'image/png',
                quality: 1.0,
              },
            })
            .then((blob: Blob) => {
              clearTimers();
              resolve(blob);
            })
            .catch((err: unknown) => {
              clearTimers();
              reject(err);
            });
        });

        if (resultBlob) break;
      } catch (modelErr) {
        lastNeuralError = modelErr;
        console.warn(`${modelLabel} failed, checking next neural option:`, modelErr);
      }
    }

    if (!resultBlob) {
      throw lastNeuralError || new Error('Neural ISNet segmentation did not return output');
    }

    onProgress?.(92, 'De-haloing edges & refining alpha matte...');
    const rawCutoutUrl = URL.createObjectURL(resultBlob);
    let rawAlpha: Float32Array;
    let alphaW: number;
    let alphaH: number;
    try {
      const rawCutoutImg = await loadImage(rawCutoutUrl);
      const extracted = extractAlphaArrayFromImage(rawCutoutImg);
      rawAlpha = extracted.alpha;
      alphaW = extracted.width;
      alphaH = extracted.height;
    } finally {
      URL.revokeObjectURL(rawCutoutUrl);
    }

    const refined = await refineCutoutWithOriginal(img, rawAlpha, alphaW, alphaH, {
      guidedWeight: 0.24,
      defringeStrength: 0.94,
    });

    onProgress?.(100, 'Complete');

    return {
      ...refined,
      engineUsed: 'neural-wasm',
    };
  } catch (err: any) {
    const reason = err?.message || 'Neural runtime unavailable';
    console.warn('Neural WASM model encountered an issue, falling back to Fast Client engine:', err);
    onProgress?.(35, 'Neural offline fallback: Running high-res edge segmentation...');
    const fallbackResult = await removeBackgroundFastClient(img, onProgress);
    return {
      ...fallbackResult,
      engineUsed: 'fast-fallback',
      fallbackReason: reason,
    };
  }
}

/**
 * Cloud API Background Removal (remove.bg / fal.ai / Hugging Face)
 */
export async function removeBackgroundCloudApi(
  img: HTMLImageElement,
  apiSettings: ApiSettings,
  onProgress?: (percent: number, stage: string) => void
): Promise<RemovalResult> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(20, `Uploading to ${apiSettings.cloudProvider} Cloud AI...`);

  const base64 = await imageToBase64(img);

  let endpoint = '/api/ai/removebg-proxy';
  let body: any = { imageBase64: base64, apiKey: apiSettings.removeBgApiKey };

  if (apiSettings.cloudProvider === 'falai') {
    endpoint = '/api/ai/falai-proxy';
    body = { imageBase64: base64, apiKey: apiSettings.falAiApiKey };
  } else if (apiSettings.cloudProvider === 'huggingface') {
    endpoint = '/api/ai/huggingface-remove';
    body = { imageBase64: base64, hfToken: apiSettings.huggingFaceApiKey };
  }

  onProgress?.(50, `Generating deep alpha matte via ${apiSettings.cloudProvider}...`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Cloud API failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data.resultBase64) {
    throw new Error('Cloud API did not return cutout image.');
  }

  onProgress?.(90, 'Finalizing edge alpha matting...');
  const cutoutImg = await loadImage(data.resultBase64);
  const maskDataUrl = await extractMaskFromCutout(cutoutImg);

  onProgress?.(100, 'Complete');

  return {
    processedUrl: data.resultBase64,
    maskDataUrl,
    width: origW,
    height: origH,
    engineUsed: 'cloud-api',
  };
}

/**
 * Unified background removal dispatcher honoring user settings
 */
export async function removeBackgroundClient(
  imgOrBlob: HTMLImageElement | Blob | string,
  onProgress?: (percent: number, stage: string) => void,
  apiSettings?: ApiSettings
): Promise<RemovalResult> {
  let img: HTMLImageElement;

  if (typeof imgOrBlob === 'string') {
    img = await loadImage(imgOrBlob);
  } else if (imgOrBlob instanceof HTMLImageElement) {
    img = imgOrBlob;
  } else {
    const url = URL.createObjectURL(imgOrBlob);
    img = await loadImage(url);
  }

  const mode = apiSettings?.engineMode || 'neural-server';

  if (mode === 'cloud-api' && apiSettings) {
    try {
      return await removeBackgroundCloudApi(img, apiSettings, onProgress);
    } catch (err: any) {
      console.warn('Cloud API failed, falling back to Neural AI engine:', err);
      onProgress?.(30, `Cloud API notice: ${err.message}. Running Neural AI engine...`);
      return await removeBackgroundServer(img, onProgress, apiSettings);
    }
  }

  if (mode === 'wasm-neural') {
    return await removeBackgroundNeuralWasm(img, onProgress, apiSettings);
  }

  if (mode === 'fast-client') {
    return await removeBackgroundFastClient(img, onProgress);
  }

  // Default: AI Neural Engine (Server Cloud Key if set, otherwise On-Device ISNet Neural WASM)
  return await removeBackgroundServer(img, onProgress, apiSettings);
}

/**
 * Composite cutout on top of selected background
 */
export async function renderCompositedCanvas(
  cutoutImg: HTMLImageElement,
  originalImg: HTMLImageElement,
  bgSettings: BackgroundSettings,
  targetWidth?: number,
  targetHeight?: number
): Promise<HTMLCanvasElement> {
  const w = targetWidth || cutoutImg.naturalWidth || cutoutImg.width;
  const h = targetHeight || cutoutImg.naturalHeight || cutoutImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw Background
  if (bgSettings.type === 'transparent') {
    ctx.clearRect(0, 0, w, h);
  } else if (bgSettings.type === 'solid') {
    ctx.fillStyle = bgSettings.solidColor || '#ffffff';
    ctx.fillRect(0, 0, w, h);
  } else if (bgSettings.type === 'gradient') {
    const angleRad = ((bgSettings.gradientAngle || 135) * Math.PI) / 180;
    const x0 = w / 2 - (Math.cos(angleRad) * w) / 2;
    const y0 = h / 2 - (Math.sin(angleRad) * h) / 2;
    const x1 = w / 2 + (Math.cos(angleRad) * w) / 2;
    const y1 = h / 2 + (Math.sin(angleRad) * h) / 2;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);

    if (bgSettings.gradientId === 'grad-sunset') {
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.5, '#ec4899');
      grad.addColorStop(1, '#6366f1');
    } else if (bgSettings.gradientId === 'grad-ocean') {
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, '#3b82f6');
    } else if (bgSettings.gradientId === 'grad-emerald') {
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#047857');
    } else if (bgSettings.gradientId === 'grad-violet') {
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(1, '#4338ca');
    } else if (bgSettings.gradientId === 'grad-studio') {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#cbd5e1');
    } else {
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#ec4899');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (bgSettings.type === 'blur') {
    ctx.save();
    if (bgSettings.blurIntensity > 0) {
      ctx.filter = `blur(${bgSettings.blurIntensity}px) brightness(${bgSettings.brightness || 100}%)`;
    }
    ctx.drawImage(originalImg, 0, 0, w, h);
    ctx.restore();
  } else if (bgSettings.type === 'stock' && bgSettings.stockImageUrl) {
    try {
      const stockImg = await loadImage(bgSettings.stockImageUrl);
      ctx.save();
      if (bgSettings.blurIntensity > 0) {
        ctx.filter = `blur(${bgSettings.blurIntensity}px)`;
      }
      ctx.drawImage(stockImg, 0, 0, w, h);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
  } else if (bgSettings.type === 'custom' && bgSettings.customImageUrl) {
    try {
      const customImg = await loadImage(bgSettings.customImageUrl);
      ctx.save();
      if (bgSettings.blurIntensity > 0) {
        ctx.filter = `blur(${bgSettings.blurIntensity}px)`;
      }
      ctx.drawImage(customImg, 0, 0, w, h);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
  }

  // 2. Draw Foreground Cutout (with natural drop shadow if enabled)
  if (
    bgSettings.shadowEnabled &&
    bgSettings.shadowOpacity > 0 &&
    (bgSettings.shadowDistance > 0 || bgSettings.shadowBlur > 0)
  ) {
    ctx.save();
    const angleRad = ((bgSettings.shadowAngle ?? 135) * Math.PI) / 180;
    // Scale shadow distance and blur proportionally to image resolution (baseline 800px)
    const scale = Math.max(0.4, Math.min(3, Math.max(w, h) / 800));
    const offsetX = Math.cos(angleRad) * bgSettings.shadowDistance * scale;
    const offsetY = Math.sin(angleRad) * bgSettings.shadowDistance * scale;
    const blur = bgSettings.shadowBlur * scale;
    const opacity = Math.min(1, Math.max(0, bgSettings.shadowOpacity / 100));

    ctx.shadowColor = hexToRgba(bgSettings.shadowColor || '#000000', opacity);
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;

    ctx.drawImage(cutoutImg, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(cutoutImg, 0, 0, w, h);
  }

  return canvas;
}

/**
 * Copy a transparent PNG directly to user clipboard
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    let pngBlob = blob;
    if (blob.type !== 'image/png') {
      const img = await loadImage(imageUrl);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext('2d')!;
      cx.drawImage(img, 0, 0);
      pngBlob = await canvasToBlob(c, 'image/png');
    }

    if (navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Clipboard write error:', e);
    return false;
  }
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Crop an image to a given bounding rectangle with optional target output resolution
 */
export async function cropImage(
  imageUrl: string,
  rect: CropRect,
  targetWidth?: number,
  targetHeight?: number,
  mimeType = 'image/png'
): Promise<string> {
  const img = await loadImage(imageUrl);
  const outW = Math.max(1, Math.round(targetWidth || rect.width));
  const outH = Math.max(1, Math.round(targetHeight || rect.height));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for cropping');

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clamp bounding rect to actual image bounds to avoid out-of-bounds artifacting
  const srcX = Math.max(0, Math.min(img.naturalWidth - 1, rect.x));
  const srcY = Math.max(0, Math.min(img.naturalHeight - 1, rect.y));
  const srcW = Math.max(1, Math.min(img.naturalWidth - srcX, rect.width));
  const srcH = Math.max(1, Math.min(img.naturalHeight - srcY, rect.height));

  ctx.drawImage(
    img,
    Math.round(srcX),
    Math.round(srcY),
    Math.round(srcW),
    Math.round(srcH),
    0,
    0,
    outW,
    outH
  );

  return canvas.toDataURL(mimeType);
}

/**
 * Synchronously crop all image layers (original, cutout, alpha mask) to keep them 100% aligned
 */
export async function cropAllLayers(
  originalUrl: string,
  processedUrl: string,
  maskUrl: string | null,
  cropRect: CropRect,
  targetWidth?: number,
  targetHeight?: number
): Promise<{
  croppedOriginalUrl: string;
  croppedProcessedUrl: string;
  croppedMaskUrl: string | null;
  dimensions: { width: number; height: number };
}> {
  const finalW = Math.max(1, Math.round(targetWidth || cropRect.width));
  const finalH = Math.max(1, Math.round(targetHeight || cropRect.height));

  const [croppedOrig, croppedProc, croppedMask] = await Promise.all([
    cropImage(originalUrl, cropRect, finalW, finalH, 'image/jpeg'),
    cropImage(processedUrl, cropRect, finalW, finalH, 'image/png'),
    maskUrl ? cropImage(maskUrl, cropRect, finalW, finalH, 'image/png') : Promise.resolve(null),
  ]);

  return {
    croppedOriginalUrl: croppedOrig,
    croppedProcessedUrl: croppedProc,
    croppedMaskUrl: croppedMask,
    dimensions: { width: finalW, height: finalH },
  };
}

