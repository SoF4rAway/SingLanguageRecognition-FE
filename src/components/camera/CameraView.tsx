"use client";

import { useCamera } from "./CameraContext";
import { Video, Camera, StopCircle, AlertCircle } from "lucide-react";

export default function CameraView() {
    const { videoRef, start, stop, status, error } = useCamera();

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header / Controls */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-slate-800">Camera Feed</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => start({ width: 1280, height: 720, fps: 25 })}
                        disabled={status === "starting" || status === "running"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Camera className="w-4 h-4" />
                        {status === "starting" ? "Starting..." : "Start"}
                    </button>
                    <button
                        onClick={stop}
                        disabled={status !== "running"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <StopCircle className="w-4 h-4" />
                        Stop
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Video Preview */}
            <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
                    muted
                    playsInline
                />

                {status !== "running" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-slate-50">
                        <Camera className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm font-medium opacity-60">Camera is stopped</p>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium capitalize">
                    {status}
                </div>
            </div>
        </div>
    );
}