import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCanvasCardProps {
  className?: string;
  intensity?: number;
  interactive?: boolean;
}

export const ThreeCanvasCard: React.FC<ThreeCanvasCardProps> = ({
  className = '',
  intensity = 1.0,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 400;
    let isVisible = true;
    let animationFrameId: number;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8 * intensity);
    scene.add(ambientLight);

    const cursorLight = new THREE.PointLight(0x818cf8, 3 * intensity, 15);
    cursorLight.position.set(0, 0, 4);
    scene.add(cursorLight);

    const violetAccent = new THREE.PointLight(0xc084fc, 2.5 * intensity, 15);
    violetAccent.position.set(-3, -2, 3);
    scene.add(violetAccent);

    const cyanAccent = new THREE.PointLight(0x38bdf8, 2 * intensity, 15);
    cyanAccent.position.set(3, 2, 2);
    scene.add(cyanAccent);

    // 3. 3D Elegant Holographic Wave Grid (Undulating Particle Mesh)
    const cols = 32;
    const rows = 32;
    const count = cols * rows;
    const waveGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const originalY = new Float32Array(count);

    const baseColor1 = new THREE.Color(0x6366f1); // Indigo
    const baseColor2 = new THREE.Color(0xa855f7); // Purple
    const baseColor3 = new THREE.Color(0x38bdf8); // Sky

    let idx = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const u = (i / (cols - 1) - 0.5) * 10;
        const v = (j / (rows - 1) - 0.5) * 8;
        const y = Math.sin(i * 0.4) * Math.cos(j * 0.4) * 0.6;

        positions[idx * 3] = u;
        positions[idx * 3 + 1] = v;
        positions[idx * 3 + 2] = y - 1.5;
        originalY[idx] = y;

        // Gradient blend across diagonal
        const t = (i + j) / (cols + rows);
        const col = t < 0.5 ? baseColor1.clone().lerp(baseColor2, t * 2) : baseColor2.clone().lerp(baseColor3, (t - 0.5) * 2);
        colors[idx * 3] = col.r;
        colors[idx * 3 + 1] = col.g;
        colors[idx * 3 + 2] = col.b;

        idx++;
      }
    }

    waveGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    waveGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circular soft glow texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(230,230,255,0.7)');
    grad.addColorStop(0.7, 'rgba(129,140,248,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(canvas);

    const waveMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const wavePoints = new THREE.Points(waveGeo, waveMat);
    scene.add(wavePoints);

    // 4. Sleek Floating Holographic Aperture Ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.025, 24, 80);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.25;
    scene.add(ring);

    // Secondary subtle concentric ring
    const innerRingGeo = new THREE.TorusGeometry(1.6, 0.015, 20, 64);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.y = Math.PI * 0.35;
    scene.add(innerRing);

    // 5. Interactive Mouse Coordinates with Smooth Physics Damping
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-1, Math.min(1, x));
      mouse.targetY = Math.max(-1, Math.min(1, y));
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          width = newW;
          height = newH;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Viewport Visibility Check (pause rendering when off-screen)
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting;
      }
    });
    intersectionObserver.observe(container);

    // 8. Render Loop with Fluid Undulation
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth inertia mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Update cursor light
      cursorLight.position.x = mouse.x * 3.5;
      cursorLight.position.y = mouse.y * 3.5;

      // Wave particle movement
      const posArr = waveGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const u = posArr[i * 3];
        const v = posArr[i * 3 + 1];
        // Dynamic ripple influenced by cursor
        const distToMouse = Math.sqrt((u - mouse.x * 4) ** 2 + (v - mouse.y * 3) ** 2);
        const ripple = Math.sin(distToMouse * 1.5 - elapsed * 2.5) * 0.18;
        const wave = Math.sin(u * 0.8 + elapsed * 1.2) * Math.cos(v * 0.8 + elapsed * 0.9) * 0.35;
        posArr[i * 3 + 2] = originalY[i] + wave + ripple - 1.2;
      }
      waveGeo.attributes.position.needsUpdate = true;

      // Gentle orbital ring rotation
      ring.rotation.z = elapsed * 0.15;
      ring.rotation.x = Math.PI * 0.25 + mouse.y * 0.3;
      ring.rotation.y = mouse.x * 0.35;

      innerRing.rotation.z = -elapsed * 0.2;
      innerRing.rotation.y = Math.PI * 0.35 - mouse.x * 0.25;

      // Gentle camera parallax
      camera.position.x = mouse.x * 0.8;
      camera.position.y = mouse.y * 0.6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      waveGeo.dispose();
      waveMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, [intensity, interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-auto overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
