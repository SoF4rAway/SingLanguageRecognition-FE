import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const LANDMARK_INPUT_DIM = 42;

export function normalizeLandmarks(landmarks: NormalizedLandmark[]): number[] {
    // 1. Convert to simple x,y array
    // We ignore Z because our model was trained on X,Y only
    const coords = landmarks.map(lm => ({ x: lm.x, y: lm.y }));

    // 2. Translation Invariance: Subtract Wrist (index 0)
    const wrist = coords[0];
    const centered = coords.map(p => ({
        x: p.x - wrist.x,
        y: p.y - wrist.y
    }));

    // 3. Scale Invariance: Divide by max absolute distance
    let maxVal = 0;
    centered.forEach(p => {
        maxVal = Math.max(maxVal, Math.abs(p.x), Math.abs(p.y));
    });

    if (maxVal > 0) {
        centered.forEach(p => {
            p.x /= maxVal;
            p.y /= maxVal;
        });
    }

    // 4. Flatten to [x1, y1, x2, y2...]
    const flattened: number[] = [];
    centered.forEach(p => {
        flattened.push(p.x);
        flattened.push(p.y);
    });

    return flattened;
}