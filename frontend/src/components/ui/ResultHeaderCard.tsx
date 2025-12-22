import React from 'react';
import { Badge, Card, Button, ConfidenceMeter } from './index';

interface Props {
  diagnosis: string;
  diagnosisHindi?: string;
  crop?: string;
  confidence: number; // 0..1
  severity?: 'low' | 'medium' | 'high' | string;
  imageSrc?: string | null;
  onSave?: () => void;
  onShare?: () => void;
}

export default function ResultHeaderCard({ diagnosis, diagnosisHindi, crop, confidence, severity, imageSrc, onSave, onShare }: Props) {
  const severityLabel = severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low';

  return (
    <Card className="p-4" role="region" aria-label="Diagnosis summary">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden bg-neutral-50 border border-neutral-100 flex items-center justify-center">
          {imageSrc ? (
            <img src={imageSrc} alt="captured" className="w-full h-full object-cover" />
          ) : (
            <div className="text-neutral-400">No image</div>
          )}
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between w-full">
            <div className="grow">
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-neutral-900">{diagnosisHindi || diagnosis}</h2>
              {diagnosisHindi && <div className="text-sm text-neutral-600 mt-1">{diagnosis}</div>}
              <div className="mt-3 flex items-center gap-2">
                {crop && <Badge size="md">{crop}</Badge>}
                <Badge variant={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'success'} size="md">{severityLabel} Severity</Badge>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center gap-3 mt-3 md:mt-0 md:ml-4">
              <div className="flex items-center gap-2">
                <ConfidenceMeter value={confidence} size="md" />
                <div className="text-sm text-neutral-500">Confidence</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={onSave}>Save</Button>
                <Button variant="ghost" onClick={onShare}>Share</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
