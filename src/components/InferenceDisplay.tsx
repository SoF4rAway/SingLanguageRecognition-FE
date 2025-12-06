"use client";

import { PredictionResult } from "@/hooks/useSmoothedPrediction";
import { Activity, Zap } from "lucide-react";

export default function InferenceDisplay({ result }: { result: PredictionResult | null }) {
    if (!result) {
        return (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-32 flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-6 h-6 mb-2 opacity-50" />
                <p>Waiting for gesture...</p>
            </div>
        );
    }

    const confidencePercent = (result.confidence * 100).toFixed(1);
    const visualPercent = result.details ? (result.details.visual_score * 100).toFixed(0) : 0;
    const landmarkPercent = result.details ? (result.details.landmark_score * 100).toFixed(0) : 0;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 ring-4 ring-indigo-50/50 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase">Prediction</span>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Live
                </span>
            </div>

            <div className="flex items-end justify-between">
                <h1 className="text-5xl font-black text-slate-800 tracking-tight">
                    {result.label}
                </h1>
                <div className="text-right">
                    <p className="text-3xl font-bold text-indigo-600">{confidencePercent}%</p>
                    <p className="text-xs text-slate-400 font-medium">Confidence</p>
                </div>
            </div>

            {/* Confidence Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                <div
                    className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${confidencePercent}%` }}
                />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
                <div>
                    <p className="text-xs text-slate-400 mb-1">Visual Model</p>
                    <p className="font-semibold text-slate-700">{visualPercent}%</p>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${visualPercent}%` }} />
                    </div>
                </div>
                <div>
                    <p className="text-xs text-slate-400 mb-1">Landmark Model</p>
                    <p className="font-semibold text-slate-700">{landmarkPercent}%</p>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${landmarkPercent}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}