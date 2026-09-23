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

/**
 * High-Precision Server AI Neural Background Removal (ISNet deep learning model)
 * Fast, robust, and zero memory/download strain on client browsers.
 */
export async function removeBackgroundServer(
  img: HTMLImageElement,
  onProgress?: (percent: number, stage: string) => void
): Promise<{ processedUrl: string; maskDataUrl: string; width: number; height: number }> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(15, 'Sending image to Neural AI Engine...');
  const base64 = await imageToBase64(img);

  onProgress?.(45, 'AI Neural ISNet model segmenting foreground...');
  const res = await fetch('/api/ai/remove-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Server AI processing failed (${res.status})`);
  }

  onProgress?.(85, 'Extracting alpha mask & perfecting fine edges...');
  const data = await res.json();
  if (!data.resultBase64) {
    throw new Error('Server AI did not return cutout image.');
  }

  const cutoutImg = await loadImage(data.resultBase64);
  const maskDataUrl = await extractMaskFromCutout(cutoutImg);

  onProgress?.(100, 'Complete');

  return {
    processedUrl: data.resultBase64,
    maskDataUrl,
    width: origW,
    height: origH,
  };
}

/**
 * Intelligent client-side edge-preserving flood fill for fast/offline preview.
 * Strictly avoids punching holes inside salient subjects.
 */
export async function removeBackgroundFastClient(
  img: HTMLImageElement,
  onProgress?: (percent: number, stage: string) => void
): Promise<{ processedUrl: string; maskDataUrl: string; width: number; height: number }> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(20, 'Analyzing image composition & edges...');
  await new Promise((r) => setTimeout(r, 20));

  const maxDim = 400;
  const scale = Math.min(1, maxDim / Math.max(origW, origH));
  const workW = Math.max(30, Math.round(origW * scale));
  const workH = Math.max(30, Math.round(origH * scale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = workW;
  workCanvas.height = workH;
  const workCtx = workCanvas.getContext('2d', { willReadFrequently: true })!;
  workCtx.drawImage(img, 0, 0, workW, workH);

  const srcData = workCtx.getImageData(0, 0, workW, workH);
  const px = srcData.data;

  onProgress?.(45, 'Detecting background boundaries...');
  await new Promise((r) => setTimeout(r, 20));

  // Compute Sobel gradient magnitude for edge detection
  const edges = new Float32Array(workW * workH);
  for (let y = 1; y < workH - 1; y++) {
    for (let x = 1; x < workW - 1; x++) {
      const idx = (y * workW + x) * 4;
      const idxLeft = (y * workW + (x - 1)) * 4;
      const idxRight = (y * workW + (x + 1)) * 4;
      const idxUp = ((y - 1) * workW + x) * 4;
      const idxDown = ((y + 1) * workW + x) * 4;

      const gx =
        Math.abs(px[idxRight] - px[idxLeft]) +
        Math.abs(px[idxRight + 1] - px[idxLeft + 1]) +
        Math.abs(px[idxRight + 2] - px[idxLeft + 2]);
      const gy =
        Math.abs(px[idxDown] - px[idxUp]) +
        Math.abs(px[idxDown + 1] - px[idxUp + 1]) +
        Math.abs(px[idxDown + 2] - px[idxUp + 2]);

      edges[y * workW + x] = Math.min(255, (gx + gy) / 3);
    }
  }

  // Sample corner colors (top-left, top-right, bottom-left, bottom-right)
  const cornerCoords = [
    [2, 2],
    [workW - 3, 2],
    [2, workH - 3],
    [workW - 3, workH - 3],
  ];

  const mask = new Float32Array(workW * workH).fill(1.0);
  const visited = new Uint8Array(workW * workH);
  const queue: number[] = [];

  // Corner background seeds
  for (const [cx, cy] of cornerCoords) {
    const cIdx = (cy * workW + cx) * 4;
    const r0 = px[cIdx];
    const g0 = px[cIdx + 1];
    const b0 = px[cIdx + 2];

    const startPos = cy * workW + cx;
    if (!visited[startPos]) {
      queue.push(startPos);
      visited[startPos] = 1;
      mask[startPos] = 0;
    }

    // Flood fill only through non-edges with similar color
    const colorTolerance = 45;
    while (queue.length > 0) {
      const pos = queue.pop()!;
      const qx = pos % workW;
      const qy = Math.floor(pos / workW);
      const qIdx = pos * 4;

      const neighbors = [
        [qx + 1, qy],
        [qx - 1, qy],
        [qx, qy + 1],
        [qx, qy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= workW || ny < 0 || ny >= workH) continue;
        const nPos = ny * workW + nx;
        if (visited[nPos]) continue;

        // Stop at strong edges
        if (edges[nPos] > 38) continue;

        const nIdx = nPos * 4;
        const dr = Math.abs(px[nIdx] - r0);
        const dg = Math.abs(px[nIdx + 1] - g0);
        const db = Math.abs(px[nIdx + 2] - b0);

        if (dr < colorTolerance && dg < colorTolerance && db < colorTolerance) {
          visited[nPos] = 1;
          mask[nPos] = 0;
          queue.push(nPos);
        }
      }
    }
  }

  // Smooth the mask
  const smoothedMask = new Float32Array(workW * workH);
  for (let y = 0; y < workH; y++) {
    for (let x = 0; x < workW; x++) {
      let sum = 0;
      let cnt = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= workH) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= workW) continue;
          sum += mask[ny * workW + nx];
          cnt++;
        }
      }
      smoothedMask[y * workW + x] = sum / cnt;
    }
  }

  onProgress?.(80, 'Rendering high-resolution cutout...');
  await new Promise((r) => setTimeout(r, 20));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = origW;
  outCanvas.height = origH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.drawImage(img, 0, 0);

  const outData = outCtx.getImageData(0, 0, origW, origH);
  const outPx = outData.data;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = origW;
  maskCanvas.height = origH;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.createImageData(origW, origH);
  const maskPx = maskData.data;

  const scaleX = workW / origW;
  const scaleY = workH / origH;

  for (let y = 0; y < origH; y++) {
    const wy = Math.min(workH - 1, Math.floor(y * scaleY));
    for (let x = 0; x < origW; x++) {
      const wx = Math.min(workW - 1, Math.floor(x * scaleX));
      const a = smoothedMask[wy * workW + wx];
      const pIdx = (y * origW + x) * 4;

      outPx[pIdx + 3] = Math.round(outPx[pIdx + 3] * a);

      const mVal = Math.round(a * 255);
      maskPx[pIdx] = mVal;
      maskPx[pIdx + 1] = mVal;
      maskPx[pIdx + 2] = mVal;
      maskPx[pIdx + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  maskCtx.putImageData(maskData, 0, 0);

  const processedBlob = await canvasToBlob(outCanvas, 'image/png');
  const processedUrl = URL.createObjectURL(processedBlob);
  const maskDataUrl = maskCanvas.toDataURL('image/png');

  onProgress?.(100, 'Complete');

  return {
    processedUrl,
    maskDataUrl,
    width: origW,
    height: origH,
  };
}

/**
 * Neural AI WebAssembly Background Removal via @imgly/background-removal
 * using quantized models and local proxy for guaranteed reliability.
 */
export async function removeBackgroundNeuralWasm(
  img: HTMLImageElement,
  onProgress?: (percent: number, stage: string) => void
): Promise<{ processedUrl: string; maskDataUrl: string; width: number; height: number }> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  onProgress?.(10, 'Initializing Neural AI model weights...');

  try {
    const imgly = await import('@imgly/background-removal');

    onProgress?.(25, 'Loading quantized ISNet neural weights...');

    const canvas = document.createElement('canvas');
    canvas.width = origW;
    canvas.height = origH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const inputBlob = await canvasToBlob(canvas, 'image/png');

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('WASM download timeout. Switching to Neural Server engine.')), 30000);
    });

    const removalPromise = imgly.removeBackground(inputBlob, {
      publicPath: `${window.location.origin}/api/imgly/`,
      model: 'isnet_quint8',
      rescale: true,
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.min(95, Math.max(25, Math.round((current / total) * 100)));
          const stageName = key.includes('fetch')
            ? `Downloading AI weights (${pct}%)...`
            : key.includes('compute')
            ? `Neural segmentation (${pct}%)...`
            : `Processing AI layers (${pct}%)...`;
          onProgress?.(pct, stageName);
        }
      },
      output: {
        format: 'image/png',
        quality: 0.95,
      },
    });

    const resultBlob = await Promise.race([removalPromise, timeoutPromise]);
    onProgress?.(95, 'Extracting alpha mask & perfecting fine edges...');

    const processedUrl = URL.createObjectURL(resultBlob);
    const cutoutImg = await loadImage(processedUrl);
    const maskDataUrl = await extractMaskFromCutout(cutoutImg);

    onProgress?.(100, 'Complete');

    return {
      processedUrl,
      maskDataUrl,
      width: origW,
      height: origH,
    };
  } catch (err: any) {
    console.warn('Neural WASM model encountered an issue, falling back to Server Neural engine:', err);
    onProgress?.(40, 'WASM notice: Switching to High-Precision AI Server engine...');
    return await removeBackgroundServer(img, onProgress);
  }
}

/**
 * Cloud API Background Removal (remove.bg / fal.ai / Hugging Face)
 */
export async function removeBackgroundCloudApi(
  img: HTMLImageElement,
  apiSettings: ApiSettings,
  onProgress?: (percent: number, stage: string) => void
): Promise<{ processedUrl: string; maskDataUrl: string; width: number; height: number }> {
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
  };
}

/**
 * Unified background removal dispatcher honoring user settings
 */
export async function removeBackgroundClient(
  imgOrBlob: HTMLImageElement | Blob | string,
  onProgress?: (percent: number, stage: string) => void,
  apiSettings?: ApiSettings
): Promise<{ processedUrl: string; maskDataUrl: string; width: number; height: number }> {
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
      console.warn('Cloud API failed, falling back to Server Neural engine:', err);
      onProgress?.(30, `Cloud API notice: ${err.message}. Running AI Server engine...`);
      return await removeBackgroundServer(img, onProgress);
    }
  }

  if (mode === 'wasm-neural') {
    try {
      return await removeBackgroundNeuralWasm(img, onProgress);
    } catch (err: any) {
      console.warn('WASM engine failed, falling back to Server Neural engine:', err);
      onProgress?.(30, 'WASM notice: Running Server AI engine...');
      return await removeBackgroundServer(img, onProgress);
    }
  }

  if (mode === 'fast-client') {
    return await removeBackgroundFastClient(img, onProgress);
  }

  // Default: AI Neural Server Engine (ISNet deep learning model)
  try {
    return await removeBackgroundServer(img, onProgress);
  } catch (err: any) {
    console.warn('Server Neural engine failed, attempting client WASM fallback:', err);
    onProgress?.(30, 'Server notice: Running client-side neural model...');
    return await removeBackgroundNeuralWasm(img, onProgress);
  }
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

