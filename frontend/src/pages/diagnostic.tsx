import React from 'react';
import { DiagnosticModal as DiagnosticComponent } from '@/components/DiagnosticModal';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DiagnosticPage() {
  const recent = [
    { id: 1, crop: 'Tomato', date: '2025-12-18', result: 'Bacterial spot', confidence: 0.82 },
    { id: 2, crop: 'Wheat', date: '2025-12-14', result: 'Rust (early)', confidence: 0.73 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
                🔬 Crop Diagnostics
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 max-w-2xl">
                Upload a leaf photo to get instant AI-powered diagnosis with confidence scores and treatment recommendations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.open('/weather', '_self')}>
                Weather
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open('/market', '_self')}>
                Market
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Diagnostic Area */}
          <main className="lg:col-span-8">
            <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">Upload & Diagnose</h2>
                  <p className="text-sm text-neutral-600">
                    Take a clear photo of the affected leaf or plant part for accurate AI analysis
                  </p>
                </div>
                
                {/* Diagnostic Component */}
                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-dashed border-neutral-300">
                  <DiagnosticComponent inline />
                </div>
              </div>
            </Card>

            {/* Recent Scans - Only show if there are recent items */}
            {recent.length > 0 && (
              <Card variant="elevated" className="bg-white/90 backdrop-blur-sm mt-6">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">📋 Recent Scans</h2>
                  <div className="space-y-3">
                    {recent.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg hover:shadow-md transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🌱</span>
                            <div>
                              <h3 className="font-semibold text-neutral-900">{item.crop}</h3>
                              <p className="text-sm text-neutral-600">{item.result}</p>
                              <p className="text-xs text-neutral-500 mt-1">{item.date}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-neutral-700">
                            Confidence
                          </div>
                          <div className={`text-2xl font-bold ${
                            item.confidence >= 0.8 ? 'text-green-600' :
                            item.confidence >= 0.6 ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>
                            {Math.round(item.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </main>

          {/* Sidebar - Tips & Guidelines */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Photo Tips Card */}
            <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">📸 Photo Tips</h2>
                
                <div className="space-y-4">
                  {/* Essential Tips */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Do This
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-0.5">●</span>
                        <span className="text-neutral-700">
                          <strong>Clear focus:</strong> Ensure the affected area is sharp and in focus
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-0.5">●</span>
                        <span className="text-neutral-700">
                          <strong>Good lighting:</strong> Use natural daylight or bright, even indoor lighting
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-0.5">●</span>
                        <span className="text-neutral-700">
                          <strong>Plain background:</strong> Place leaf against contrasting, uncluttered surface
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-0.5">●</span>
                        <span className="text-neutral-700">
                          <strong>Multiple angles:</strong> Capture close-up and wider context shots
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Things to Avoid */}
                  <div className="pt-4 border-t border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      Avoid
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 mt-0.5">●</span>
                        <span className="text-neutral-700">Blurry or out-of-focus images</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 mt-0.5">●</span>
                        <span className="text-neutral-700">Heavy shadows or backlighting</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 mt-0.5">●</span>
                        <span className="text-neutral-700">Digital zoom (move closer instead)</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 mt-0.5">●</span>
                        <span className="text-neutral-700">Cluttered or busy backgrounds</span>
                      </li>
                    </ul>
                  </div>

                  {/* Pro Tips */}
                  <div className="pt-4 border-t border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <span>💡</span>
                      Pro Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-neutral-700">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 mt-0.5">→</span>
                        <span>Tap the screen to lock focus on the leaf before capturing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 mt-0.5">→</span>
                        <span>Include a reference object (coin/finger) to show scale</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 mt-0.5">→</span>
                        <span>Add context in the question box (irrigation, recent sprays, weather)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* How It Works */}
            <Card variant="elevated" className="bg-white/90 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">🤖 How It Works</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 text-sm">Upload Photo</h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Capture or upload a clear image of the affected plant part
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 text-sm">AI Analysis</h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Advanced computer vision identifies disease patterns and symptoms
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 text-sm">Get Results</h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Receive diagnosis with confidence score and treatment recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card variant="elevated" className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">📊 System Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-700">50+</div>
                    <div className="text-xs text-primary-600 mt-1">Diseases Detected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-700">85%</div>
                    <div className="text-xs text-primary-600 mt-1">Avg Accuracy</div>
                  </div>
                </div>
              </div>
            </Card>

          </aside>

        </div>
      </div>
    </div>
  );
}
