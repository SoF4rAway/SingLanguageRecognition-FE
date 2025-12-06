"use client";

import { useEffect, useRef, useState } from "react";
import { useCamera } from "./CameraContext";
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { normalizeLandmarks, LANDMARK_INPUT_DIM } from "@/components/utils/normalization";
import { PredictionResult } from "@/hooks/useSmoothedPrediction";
import { Loader2, Scan } from "lucide-react";

const CROP_SIZE = 224;
const SEND_INTERVAL_MS = 100; // Throttle API calls

interface HandsPreviewProps {
    onPrediction: (result: PredictionResult) => void;
}

export default function HandsPreview({ onPrediction }: HandsPreviewProps) {
    const { videoRef, status } = useCamera();
    const cropRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const [ready, setReady] = useState(false);

    // API State
    const lastSentRef = useRef<number>(0);
    const isProcessingRef = useRef<boolean>(false);

    // 1. Load MediaPipe
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const resolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );
                const lm = await HandLandmarker.createFromOptions(resolver, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    numHands: 1,
                    runningMode: "VIDEO",
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });
                if (!cancelled) {
                    landmarkerRef.current = lm;
                    setReady(true);
                }
            } catch (error) {
                console.error("Failed to load MediaPipe:", error);
            }
        })();
        return () => {
            cancelled = true;
            landmarkerRef.current?.close();
        };
    }, []);

    // 2. Square Crop Logic
    function getSquareRoi(w: number, h: number, det: HandLandmarkerResult | null) {
        if (!det?.landmarks?.length) {
            // Default center crop
            const size = Math.min(w, h) * 0.5;
            return { x: (w / 2) - (size / 2), y: (h / 2) - (size / 2), size };
        }

        const xs = det.landmarks[0].map(p => p.x * w);
        const ys = det.landmarks[0].map(p => p.y * h);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const maxDim = Math.max(maxX - minX, maxY - minY);

        const size = maxDim * 1.5; // Padding

        return { x: cx - size / 2, y: cy - size / 2, size };
    }

    // 3. API Call Function
    async function sendToBackend(blob: Blob, landmarks: number[]) {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        const formData = new FormData();
        formData.append("file", blob, "hand.jpg");
        formData.append("landmarks", JSON.stringify(landmarks));

        try {
            const res = await fetch("http://localhost:8000/predict", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onPrediction({
                    label: data.prediction,
                    confidence: data.confidence,
                    details: data.details
                });
            }
        } catch (err) {
            console.error("Inference Error:", err);
        } finally {
            isProcessingRef.current = false;
        }
    }

    // 4. Main Processing Loop
    useEffect(() => {
        if (!ready) return;
        const running = status === "running";

        const loop = () => {
            const v = videoRef.current;
            const crop = cropRef.current;
            const lm = landmarkerRef.current;

            if (v && crop && lm && v.readyState >= 2) {
                const now = performance.now();
                const det = lm.detectForVideo(v, now);

                const { x, y, size } = getSquareRoi(v.videoWidth, v.videoHeight, det);

                // Draw Crop to Canvas
                const ctx = crop.getContext("2d", { alpha: false, desynchronized: true })!;
                crop.width = CROP_SIZE;
                crop.height = CROP_SIZE;

                // Black background
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

                // Draw crop
                ctx.drawImage(v, x, y, size, size, 0, 0, CROP_SIZE, CROP_SIZE);

                // Send to Backend
                if (now - lastSentRef.current > SEND_INTERVAL_MS) {
                    let normLandmarks: number[] = [];
                    if (det.landmarks && det.landmarks.length > 0) {
                        normLandmarks = normalizeLandmarks(det.landmarks[0]);
                    } else {
                        normLandmarks = new Array(LANDMARK_INPUT_DIM).fill(0);
                    }

                    crop.toBlob((blob) => {
                        if (blob) {
                            sendToBackend(blob, normLandmarks);
                            lastSentRef.current = now;
                        }
                    }, "image/jpeg", 0.7);
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };

        if (running) {
            rafRef.current = requestAnimationFrame(loop);
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [status, ready, videoRef, onPrediction]);

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <Scan className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Hand Focus</h2>
            </div>

            <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5">
                {ready ? (
                    <canvas
                        ref={cropRef}
                        width={224}
                        height={224}
                        className="w-full h-full object-contain transform -scale-x-100"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-xs">Loading Model...</span>
                    </div>
                )}

                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded backdrop-blur-sm">
                    {CROP_SIZE}x{CROP_SIZE} Input
                </div>
            </div>
        </div>
    );
}