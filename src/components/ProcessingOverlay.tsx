import React from 'react';
import { Sparkles, Wand2, Scissors, Check, Cpu } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center flex flex-col items-center">
        {/* Animated AI Wand Icon */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <Wand2 className="w-8 h-8" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Removing Background
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          {stage || 'Neural edge detection and alpha channel extraction in progress...'}
        </p>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-indigo-600 font-bold">Neural Engine</span>
            <span className="text-slate-700 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 mb-6 text-left space-y-2">
          {stages.map((st, i) => {
            const isDone = progress >= (stages[i + 1]?.min ?? 100);
            const isCurrent = progress >= st.min && !isDone;
            return (
              <div
                key={st.label}
                className={`flex items-center gap-2.5 text-xs transition-colors ${
                  isDone
                    ? 'text-emerald-700 font-semibold'
                    : isCurrent
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCurrent
                      ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-2.5 h-2.5" /> : i + 1}
                </div>
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
          >
            Cancel Processing
          </button>
        )}
      </div>
    </div>
  );
};
