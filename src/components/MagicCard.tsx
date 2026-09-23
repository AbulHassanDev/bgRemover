import React, { useRef, useState, useCallback } from 'react';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  interactiveTilt?: boolean;
}

export const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className = '',
  gradientSize = 350,
  gradientColor = '#6366f1',
  gradientOpacity = 0.22,
  interactiveTilt = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (interactiveTilt) {
        // Calculate tilt angles (-8deg to +8deg)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = -((y - centerY) / centerY) * 6;
        const tiltY = ((x - centerX) / centerX) * 6;
        setTilt({ x: tiltX, y: tiltY });
      }
    },
    [interactiveTilt]
  );

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos({ x: -1000, y: -1000 });
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: isHovered && interactiveTilt
          ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`group relative rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Magic UI Radial Spotlight that tracks mouse */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(${gradientSize}px circle at ${mousePos.x}px ${mousePos.y}px, ${gradientColor} 0%, rgba(99, 102, 241, 0.1) 40%, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      {/* Shimmering Animated Gradient Border effect */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.6) 0%, rgba(99, 102, 241, 0.4) 30%, transparent 70%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
        aria-hidden="true"
      />

      {/* Ambient Top Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/4 -translate-y-1/2 w-1/2 h-24 bg-indigo-500/20 blur-3xl rounded-full"
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
