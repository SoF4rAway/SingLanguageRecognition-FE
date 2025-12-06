import { useState, useRef, useCallback } from 'react';

export type PredictionResult = {
    label: string;
    confidence: number;
    details?: {
        visual_score: number;
        landmark_score: number;
    };
};

export function useSmoothedPrediction(bufferSize = 10) {
    const bufferRef = useRef<string[]>([]);
    const [stableResult, setStableResult] = useState<PredictionResult | null>(null);

    const addPrediction = useCallback((result: PredictionResult) => {
        // 1. Add label to buffer
        bufferRef.current.push(result.label);
        if (bufferRef.current.length > bufferSize) {
            bufferRef.current.shift();
        }

        // 2. Find Mode (Most frequent label)
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let mode = result.label;

        for (const l of bufferRef.current) {
            counts[l] = (counts[l] || 0) + 1;
            if (counts[l] > maxCount) {
                maxCount = counts[l];
                mode = l;
            }
        }

        // 3. Update State if buffer is sufficiently full (prevents initial jitter)
        // We pass the latest confidence/details for the stable label
        if (bufferRef.current.length >= Math.min(3, bufferSize)) {
            setStableResult({
                label: mode,
                confidence: result.confidence,
                details: result.details
            });
        }
    }, [bufferSize]);

    return { stableResult, addPrediction };
}