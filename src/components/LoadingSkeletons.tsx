import React from 'react';
import { Loader2 } from 'lucide-react';

export const StudioWorkspaceSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading studio workspace"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse"
    >
      {/* Left Canvas Skeleton */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-44 bg-slate-200 rounded-xl" />
          <div className="h-8 w-32 bg-slate-200 rounded-xl" />
        </div>
        <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" />
            <span>Preparing Studio Canvas...</span>
          </div>
        </div>
      </div>

      {/* Right Controls Skeleton */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="h-5 w-40 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-24 bg-slate-100 rounded-xl" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="h-5 w-32 bg-slate-200 rounded-lg" />
          <div className="h-11 bg-indigo-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const BatchQueueSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading batch queue studio"
      className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse"
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-2">
          <div className="h-6 w-52 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-indigo-100 rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" />
          <span>Loading Batch Queue &amp; ZIP Engine...</span>
        </div>
      </div>
    </div>
  );
};

export const ModalLoadingBackdrop: React.FC<{ label?: string }> = ({
  label = 'Loading Studio Tool...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl px-6 py-4 shadow-xl border border-slate-200 flex items-center gap-3 text-sm font-semibold text-slate-800">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
};
