'use client'

import { useScreeningStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function ScreeningReport() {
  const { screeningData } = useScreeningStore();

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-gray-800 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/GlucoZap.png" alt="GlucoZap Logo" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold">GlucoZap</span>
            </Link>
            <Link href="/screening/screening">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Screening
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
          <h1 className="text-5xl font-bold mb-4">Screening Report</h1>
          <p className="text-lg text-white/70">Here is a summary of your screening results.</p>
        </div>

        <div className="space-y-8">
          {Object.entries(screeningData).map(([key, value]) => (
            <Card key={key} className="bg-white/5 border border-white/10">
              <CardHeader>
                <CardTitle className="capitalize text-emerald-400">{key.replace(/([A-Z])/g, ' $1')}</CardTitle>
              </CardHeader>
              <CardContent>
                {value ? (
                  <pre className="text-white/80 whitespace-pre-wrap font-mono text-sm">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p className="text-white/50">No data available for this test.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
