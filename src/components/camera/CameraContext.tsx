"use client";

import React, { createContext, useContext, useRef, useState } from "react";

type CameraCtx = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    start: (opts?: { width?: number; height?: number; fps?: number }) => Promise<void>;
    stop: () => void;
    status: "idle" | "starting" | "running" | "stopped" | "error";
    error?: string;
};

const Ctx = createContext<CameraCtx | null>(null);

export function CameraProvider({ children }: { children: React.ReactNode }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<CameraCtx["status"]>("idle");
    const [error, setError] = useState<string | undefined>();

    async function start(opts?: { width?: number; height?: number; fps?: number }) {
        setStatus("starting");
        setError(undefined);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: opts?.width ?? 1280 },
                    height: { ideal: opts?.height ?? 720 },
                    frameRate: { ideal: opts?.fps ?? 25, max: opts?.fps ?? 25 },
                    facingMode: "user",
                },
                audio: false,
            });
            const v = videoRef.current!;
            v.srcObject = stream;
            await v.play();
            setStatus("running");
        } catch (e: unknown) {
            setStatus("error");
            const message = e instanceof Error ? e.message : "Failed to access camera";
            setError(message);
        }
    }

    function stop() {
        const v = videoRef.current;
        if (v?.srcObject) {
            (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            v.srcObject = null;
        }
        setStatus("stopped");
    }

    return (
        <Ctx.Provider value={{ videoRef, start, stop, status, error }}>
            {children}
        </Ctx.Provider>
    );
}

export function useCamera() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useCamera must be used inside <CameraProvider>");
    return ctx;
}   