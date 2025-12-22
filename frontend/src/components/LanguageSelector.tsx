import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-neutral-500">भाषा / Language</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="text-sm border border-neutral-200 rounded-md p-1"
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
      </select>
    </div>
  );
}
