import React, { useEffect, useRef, useState } from 'react';

interface CaptureRevealProps {
  image: string;
  loading: boolean;
  result: any | null;
  compactPreview?: boolean;
  children?: React.ReactNode;
}

export default function CaptureReveal({ image, loading, result, compactPreview = false, children }: CaptureRevealProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    // When result becomes available, trigger shrink animation
    if (result) {
      // small defer so CSS transitions feel natural
      const t = setTimeout(() => setShrunk(true), 180);
      return () => clearTimeout(t);
    }
    setShrunk(false);
  }, [result]);

  return (
    <div className="w-full">
      <div className={`relative transition-all duration-500 ${shrunk ? 'max-w-[200px]' : 'w-full'} mx-auto`}>
        <div className={`overflow-hidden rounded-2xl bg-neutral-100 ${shrunk ? 'shadow-sm' : 'shadow-lg'} transition-all duration-500`}>
          <img
            ref={imgRef}
            src={image}
            alt="Captured leaf"
            className={`object-cover w-full ${shrunk ? 'h-[200px] aspect-square transform scale-95' : 'h-[420px] md:h-[520px]'} transition-all duration-700 ease-out`}
          />
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mb-3" />
              <div className="text-sm text-neutral-700">Analyzing image…</div>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-4 transition-opacity duration-500 ${shrunk ? 'opacity-100 animate-scale-in' : 'opacity-0 pointer-events-none'}`}>
        {children}
      </div>
    </div>
  );
}
