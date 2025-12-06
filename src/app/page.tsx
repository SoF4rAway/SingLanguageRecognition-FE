"use client";

import { CameraProvider } from "@/components/camera/CameraContext";
import CameraView from "@/components/camera/CameraView";
import HandsPreview from "@/components/camera/HandsPreview";
import InferenceDisplay from "@/components/InferenceDisplay";
import { useSmoothedPrediction } from "@/hooks/useSmoothedPrediction";

function Dashboard() {
  // 1. Prediction State is lifted here so it can be passed to the Display
  const { stableResult, addPrediction } = useSmoothedPrediction(5);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SLR System</h1>
            <p className="text-slate-500 mt-1">Real-time Sign Language Recognition using Multi-Modal Fusion</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600">
              v1.0.0
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Main Camera (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <CameraView />

            {/* Result Display sits below camera for prominence */}
            <InferenceDisplay result={stableResult} />
          </div>

          {/* RIGHT COLUMN: Hand Focus & Debug (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* HandsPreview component handles the crop logic and API calls */}
            <HandsPreview onPrediction={addPrediction} />

            {/* Instructions / Debug */}
            <div className="bg-indigo-900 text-white p-5 rounded-xl text-sm leading-relaxed">
              <h3 className="font-bold text-indigo-200 mb-2 uppercase text-xs tracking-wider">How it works</h3>
              <p className="opacity-90">
                1. Point camera at your hand.<br />
                2. The system auto-crops the hand region.<br />
                3. Fusion Model analyzes both Image + Skeleton.<br />
                4. Result appears below the main feed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <CameraProvider>
      <Dashboard />
    </CameraProvider>
  );
}