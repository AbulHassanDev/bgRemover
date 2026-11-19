import React, { useEffect } from 'react';
import { Wand2, Check } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
  stage: string;
  onCancel?: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  progress,
  stage,
  onCancel,
}) => {
  const stages = [
    { label: 'Color & Saliency Analysis', min: 0 },
    { label: 'Background Perimeter Modeling', min: 20 },
    { label: 'Alpha Trimap & Hair Boundary', min: 45 },
    { label: 'Edge Feathering & Defringing', min: 70 },
  ];

  useEffect(() => {
    if (!onCancel) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-overlay-title"
      aria-describedby="processing-overlay-stage"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center flex flex-col items-center">
        {/* Animated AI Wand Icon */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center" aria-hidden="true">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <Wand2 className="w-8 h-8" />
          </div>
        </div>

        <h3 id="processing-overlay-title" className="text-lg font-bold text-slate-900 mb-1">
          Removing Background
        </h3>
        <p id="processing-overlay-stage" aria-live="polite" className="text-xs text-slate-600 max-w-xs mb-6">
          {stage || 'Neural edge detection and alpha channel extraction in progress...'}
        </p>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-indigo-700 font-bold">Neural Engine</span>
            <span className="text-slate-700 font-bold">{clampedProgress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Background removal progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clampedProgress}
            className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 mb-6 text-left space-y-2">
          {stages.map((st, i) => {
            const isDone = clampedProgress >= (stages[i + 1]?.min ?? 100);
            const isCurrent = clampedProgress >= st.min && !isDone;
            return (
              <div
                key={st.label}
                className={`flex items-center gap-2.5 text-xs transition-colors ${
                  isDone
                    ? 'text-emerald-700 font-semibold'
                    : isCurrent
                    ? 'text-indigo-700 font-bold'
                    : 'text-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCurrent
                      ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <Check className="w-2.5 h-2.5" aria-hidden="true" /> : i + 1}
                </div>
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Cancel Processing
          </button>
        )}
      </div>
    </div>
  );
};
