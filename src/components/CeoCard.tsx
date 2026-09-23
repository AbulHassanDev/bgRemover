import React, { useState, useEffect, useRef } from 'react';
import { Wand2, ArrowRight } from 'lucide-react';

interface CeoCardProps {
  onLoadCeoSample?: (sampleUrl: string, sampleName: string) => void;
  className?: string;
}

export const CeoCard: React.FC<CeoCardProps> = ({
  onLoadCeoSample,
  className = '',
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>('/images/abulhassan_ceo.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and auto-sync photo to filesystem
  useEffect(() => {
    const cached = localStorage.getItem('clearcut_ceo_custom_photo');
    if (cached) {
      setPhotoUrl(cached);
      // Auto-sync client localStorage image to server disk so git commits and Vercel builds retain it
      if (cached.startsWith('data:image')) {
        fetch('/api/ceo-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: cached }),
        }).catch(() => {});
      }
      return;
    }

    fetch('/api/ceo-photo')
      .then((res) => res.json())
      .then((data) => {
        if (data.exists && data.url) {
          setPhotoUrl(data.url);
        }
      })
      .catch(() => {});
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setPhotoUrl(base64Data);
        localStorage.setItem('clearcut_ceo_custom_photo', base64Data);

        try {
          await fetch('/api/ceo-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
        } catch (err) {
          console.error('Failed to sync CEO photo to disk:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTryInEditor = () => {
    if (onLoadCeoSample) {
      onLoadCeoSample(photoUrl, 'AbulHassan_Founder_CEO.jpg');
    }
  };

  return (
    <div id="about-ceo-section" className={`w-full max-w-xl mx-auto px-2 sm:px-0 ${className}`}>
      {/* Hidden file selector allowing the owner to update the portrait */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* remove.bg Style Testimonial Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 md:p-10 flex flex-col justify-between text-left">
        {/* Top: Brand Logo / Company Identification */}
        <div className="flex items-center gap-2.5 pb-5 sm:pb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
            <Wand2 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            ClearCut AI
          </span>
        </div>

        {/* Center: Testimonial / Quote Statement */}
        <div className="py-2 sm:py-4">
          <p className="text-base sm:text-lg md:text-xl font-normal text-slate-800 leading-relaxed">
            “We engineered ClearCut AI because creators shouldn't have to choose between speed,
            sub-pixel accuracy, and privacy. Your photos are processed instantly in your browser
            with zero cloud storage.”
          </p>
        </div>

        {/* Bottom Profile Row: Pure remove.bg layout (Avatar + Name + Role) */}
        <div className="pt-5 sm:pt-6 mt-2 flex items-center gap-3.5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-100 shrink-0 cursor-pointer hover:ring-blue-300 transition-all"
            title="Click to update portrait image"
          >
            <img
              src={photoUrl}
              alt="AbulHassan, Founder & CEO"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
              AbulHassan
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Founder & CEO
            </p>
          </div>
        </div>
      </div>

      {/* remove.bg Style Bottom Link with Arrow */}
      {onLoadCeoSample && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleTryInEditor}
            className="inline-flex items-center gap-1.5 text-slate-800 hover:text-blue-600 font-semibold text-sm transition-colors cursor-pointer"
          >
            <span>Test Background Removal on Founder Portrait</span>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
};
