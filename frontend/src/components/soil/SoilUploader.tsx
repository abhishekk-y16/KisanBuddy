import React from 'react';
import SoilUploadCard from '@/components/soil/SoilUploadCard';

type Props = {
  previews: string[];
  onFiles: (files: File[] | null) => void;
};

export default function SoilUploader({ previews, onFiles }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-neutral-900">Soil photos</h2>
          <p className="mt-1 text-sm text-neutral-600">Upload 1–4 clear photos (daylight). Include a coin or ruler for scale.</p>
        </div>
        <div className="text-sm text-neutral-500">Tip: surface + side + scale</div>
      </div>

      <div className="mt-4">
        <SoilUploadCard onFiles={onFiles} previews={previews} />
      </div>

      {previews && previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden bg-neutral-50 border border-neutral-200 shadow-sm">
              <img src={p} className="w-full h-32 object-cover" alt={`preview ${i + 1}`} />
              <div className="p-2 text-xs text-neutral-700">Photo {i + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
