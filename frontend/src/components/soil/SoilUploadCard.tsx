import React, { useRef, useState } from 'react'

type Props = {
  onFiles: (files: FileList | null) => void
  previews: string[]
}

export default function SoilUploadCard({ onFiles, previews }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    onFiles(e.dataTransfer.files)
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    onFiles(e.target.files)
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 transition hover:shadow-md">
      <label className="block text-sm font-semibold text-neutral-800">Soil Images</label>

      <div className="mt-3 flex gap-4 items-start">
        <div
          className={`flex-1 border-2 ${dragging ? 'border-primary-500 bg-primary-50' : 'border-dashed border-neutral-200'} rounded-md p-4 text-center cursor-pointer transition-colors`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); e.dataTransfer.dropEffect = 'copy' }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload soil images"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          <div className="text-lg font-medium text-neutral-700">Drag & drop images here or click to select</div>
          <div className="text-sm text-neutral-500 mt-2">Recommended 1–4 photos: surface, side, scale (include a coin/scale)</div>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-4 py-2 bg-primary-600 text-white rounded-xl">Choose files</button>
            <button type="button" className="px-3 py-2 border rounded-xl text-sm">Photo tips</button>
          </div>
        </div>

        <div className="w-48">
          <label className="block text-sm font-semibold text-neutral-800">Preview</label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {previews && previews.length ? (
              previews.slice(0,6).map((p, i) => (
                <div key={i} className="w-full h-24 overflow-hidden rounded border bg-neutral-50 flex items-center justify-center">
                  <img src={p} alt={`preview-${i}`} className="object-cover w-full h-full" />
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-500">No images selected</div>
            )}
          </div>
          {previews && previews.length > 0 && (
            <div className="mt-3 text-xs text-neutral-600">{previews.length} image(s) selected</div>
          )}
        </div>
      </div>
    </section>
  )
}
