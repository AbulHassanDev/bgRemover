import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  History,
  Sparkles,
  Paintbrush,
  Palette,
  Crop,
  RotateCcw,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import { ImageEditSnapshot } from '../types';

interface EditHistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToStep: (index: number) => void;
  onRevertToInitial: () => void;
  history: ImageEditSnapshot[];
  historyIndex: number;
  undoDescription: string | null;
  redoDescription: string | null;
  compact?: boolean;
}

export const EditHistoryControls: React.FC<EditHistoryControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpToStep,
  onRevertToInitial,
  history,
  historyIndex,
  undoDescription,
  redoDescription,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMac =
    typeof window !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const undoShortcut = isMac ? '⌘Z' : 'Ctrl+Z';
  const redoShortcut = isMac ? '⌘⇧Z' : 'Ctrl+Y';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalEdits = Math.max(0, history.length - 1);
  const currentStep = Math.max(0, historyIndex);

  const getCategoryIcon = (category: ImageEditSnapshot['category']) => {
    switch (category) {
      case 'brush':
        return <Paintbrush className="w-3.5 h-3.5 text-emerald-600" />;
      case 'background':
        return <Palette className="w-3.5 h-3.5 text-sky-600" />;
      case 'crop':
        return <Crop className="w-3.5 h-3.5 text-amber-600" />;
      case 'initial':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Control Buttons Group */}
      <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
        {/* Undo Button */}
        <button
          id="btn-global-undo"
          onClick={onUndo}
          disabled={!canUndo}
          title={
            canUndo && undoDescription
              ? `Undo: ${undoDescription} (${undoShortcut})`
              : `Undo (${undoShortcut})`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            canUndo
              ? 'text-slate-700 hover:text-slate-950 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
              : 'text-slate-300 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          {!compact && (
            <>
              <span className="hidden sm:inline">Undo</span>
              <kbd className="hidden md:inline text-[9px] font-mono text-slate-400 bg-slate-200/60 px-1 py-0.2 rounded">
                {undoShortcut}
              </kbd>
            </>
          )}
        </button>

        {/* Redo Button */}
        <button
          id="btn-global-redo"
          onClick={onRedo}
          disabled={!canRedo}
          title={
            canRedo && redoDescription
              ? `Redo: ${redoDescription} (${redoShortcut})`
              : `Redo (${redoShortcut})`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            canRedo
              ? 'text-slate-700 hover:text-slate-950 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
              : 'text-slate-300 cursor-not-allowed opacity-50'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
          {!compact && (
            <>
              <span className="hidden sm:inline">Redo</span>
              <kbd className="hidden md:inline text-[9px] font-mono text-slate-400 bg-slate-200/60 px-1 py-0.2 rounded">
                {redoShortcut}
              </kbd>
            </>
          )}
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* History Timeline Trigger */}
        <button
          id="btn-edit-history-menu"
          onClick={() => setIsOpen(!isOpen)}
          title="View Image Edit History Timeline"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isOpen
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <History className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono text-[11px] text-slate-700 font-bold">
            {history.length > 0 ? `${currentStep}/${totalEdits}` : '0'}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>
      </div>

      {/* History Timeline Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-40 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">Edit History Stack</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {history.length} snapshots
            </span>
          </div>

          {/* Quick Actions: Reset to initial cutout */}
          {history.length > 1 && (
            <div className="mb-2">
              <button
                onClick={() => {
                  onRevertToInitial();
                  setIsOpen(false);
                }}
                disabled={historyIndex === 0}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  historyIndex === 0
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert to Initial AI Cutout</span>
              </button>
            </div>
          )}

          {/* History List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No edit history recorded yet
              </div>
            ) : (
              history.map((snap, idx) => {
                const isCurrent = idx === historyIndex;
                const isPast = idx < historyIndex;
                const isFuture = idx > historyIndex;

                return (
                  <button
                    key={snap.id}
                    onClick={() => {
                      onJumpToStep(idx);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                        : isPast
                        ? 'hover:bg-slate-50 text-slate-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-400 font-normal opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isPast
                            ? 'bg-slate-100'
                            : 'bg-slate-50 opacity-60'
                        }`}
                      >
                        {isCurrent ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          getCategoryIcon(snap.category)
                        )}
                      </div>
                      <div className="truncate">
                        <p className="truncate text-xs leading-tight">
                          {snap.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {idx === 0 ? 'Original' : `Edit #${idx}`}
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded-full shrink-0">
                        Current
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              Undo: <kbd className="font-mono text-slate-600">{undoShortcut}</kbd>
            </span>
            <span>
              Redo: <kbd className="font-mono text-slate-600">{redoShortcut}</kbd>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
