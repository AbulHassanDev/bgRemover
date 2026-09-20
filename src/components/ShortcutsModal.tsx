import React from 'react';
import { Keyboard, X, Sparkles, Check } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + V / ⌘ + V', desc: 'Paste image from clipboard anywhere' },
    { key: 'Spacebar + Drag', desc: 'Pan / Move canvas viewport' },
    { key: 'Scroll Wheel', desc: 'Zoom in / out on comparison canvas' },
    { key: 'Ctrl + Z / ⌘ + Z', desc: 'Undo manual brush refinement stroke' },
    { key: 'Ctrl + Y / ⌘ + Y', desc: 'Redo manual brush refinement stroke' },
    { key: 'E / B', desc: 'Quick switch to Erase / Restore brush' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Keyboard Shortcuts & Tips
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 my-4">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-600">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200 text-[11px] shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 mb-4">
          <strong>Edge Quality Tip:</strong> If your photo has fuzzy curly hair or translucent fur, use the <strong className="text-indigo-950">Erase / Restore Brushes</strong> with low hardness (20-40%) to achieve photorealistic alpha transitions.
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
