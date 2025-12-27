import { useEffect, useState } from 'react';

export default function ApiErrorToast() {
  const [errors, setErrors] = useState<Array<{id:number; message:string}>>([]);

  useEffect(() => {
    let idCounter = 1;
    const handler = (e: any) => {
      const detail = e?.detail || {};
      const message = detail.message || detail.error || JSON.stringify(detail) || 'API error';
      const id = idCounter++;
      setErrors((s) => [{ id, message }, ...s]);
      // auto dismiss
      setTimeout(() => {
        setErrors((s) => s.filter((x) => x.id !== id));
      }, 8000);
      // also keep console record
      // eslint-disable-next-line no-console
      console.warn('[ApiErrorToast] ', detail);
    };

    window.addEventListener('kisanbuddy:api-error', handler as EventListener);
    return () => window.removeEventListener('kisanbuddy:api-error', handler as EventListener);
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {errors.map((err) => (
        <div key={err.id} className="max-w-sm bg-red-600 text-white rounded shadow-lg p-3 animate-fade-in">
          <div className="font-semibold">Server error</div>
          <div className="text-sm mt-1 break-words">{err.message}</div>
        </div>
      ))}
    </div>
  );
}
