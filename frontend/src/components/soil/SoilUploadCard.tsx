import React, { useRef } from 'react'

type Props = {
  onFiles: (files: File[] | null) => void
  previews: string[]
}

export default function SoilUploadCard({ onFiles, previews }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files
    onFiles(f && f.length ? Array.from(f) : null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dt = e.dataTransfer.files
    onFiles(dt && dt.length ? Array.from(dt) : null)
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">Photos</div>
        <div className="text-xs text-neutral-600">Add coin or ruler for scale</div>
      </div>

      <div className="mt-3">
        <div
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
          onDrop={handleDrop}
          className="rounded-xl p-6 text-center border-2 border-dashed border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition cursor-pointer"
          role="button"
          aria-label="Drop or click to select photos"
        >
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" aria-hidden />
          <div className="text-lg text-neutral-900 font-medium">Drop or click to add photos</div>
          <div className="text-sm text-neutral-600 mt-2">1–4 photos · daylight · include scale</div>
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow-sm">Select photos</button>
          </div>
        </div>
      </div>
    </div>
  )
}
