// __tests__/camera.test.tsx
import React from "react";
import {
    render,
    screen,
    waitFor,
    act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import { CameraProvider, useCamera } from "@/components/camera/CameraContext";
import CameraView from "@/components/camera/CameraView";

// ---- Global mocks for browser APIs ----

// Make sure mediaDevices + getUserMedia exist and are mockable
beforeAll(() => {
    // @ts-expect-error - jsdom navigator typings
    if (!navigator.mediaDevices) {
        // @ts-expect-error
        navigator.mediaDevices = {} as any;
    }
    // @ts-expect-error
    navigator.mediaDevices.getUserMedia = jest.fn();

    // Mock <video>.play so it doesn't throw in jsdom
    // @ts-expect-error
    HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
});

beforeEach(() => {
    // @ts-expect-error
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockReset();
    cameraCtx = null;
});

// ---- Helper test consumer to get context handle ----

let cameraCtx: any = null;

function TestCameraConsumer() {
    const ctx = useCamera();
    cameraCtx = ctx;
    return (
        <video
            ref={ctx.videoRef as any}
            data-testid="camera-video"
        />
    );
}

// ---- Tests ----

describe("CameraProvider", () => {
    test("start() starts the camera and updates status to 'running'", async () => {
        const trackStop = jest.fn();
        const mockStream = {
            getTracks: () => [{ stop: trackStop }],
        } as any;

        // @ts-expect-error
        (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(
            mockStream
        );

        render(
            <CameraProvider>
                <TestCameraConsumer />
            </CameraProvider>
        );

        // Call context.start()
        await act(async () => {
            await cameraCtx.start({ width: 1280, height: 720, fps: 25 });
        });

        // getUserMedia is called with some video constraints
        // @ts-expect-error
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

        // Status eventually becomes "running"
        await waitFor(() => {
            expect(cameraCtx.status).toBe("running");
        });

        const video = screen.getByTestId("camera-video") as HTMLVideoElement;
        expect((video as any).srcObject).toBe(mockStream);

        // stop() should stop tracks and set status to "stopped"
        act(() => {
            cameraCtx.stop();
        });

        await waitFor(() => {
            expect(cameraCtx.status).toBe("stopped");
        });

        expect(trackStop).toHaveBeenCalled();
        expect((video as any).srcObject).toBeNull();
    });

    test("start() handles failures and exposes error state", async () => {
        // @ts-expect-error
        (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
            new Error("Denied")
        );

        render(
            <CameraProvider>
                <TestCameraConsumer />
            </CameraProvider>
        );

        await act(async () => {
            await cameraCtx.start();
        });

        await waitFor(() => {
            expect(cameraCtx.status).toBe("error");
            expect(cameraCtx.error).toBe("Denied");
        });
    });
});

describe("CameraView", () => {
    test("renders buttons, status, and wires up Start/Stop with provider", async () => {
        const trackStop = jest.fn();
        const mockStream = {
            getTracks: () => [{ stop: trackStop }],
        } as any;

        // @ts-expect-error
        (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(
            mockStream
        );

        render(
            <CameraProvider>
                <CameraView />
            </CameraProvider>
        );

        const startBtn = screen.getByRole("button", { name: /start camera/i });
        const stopBtn = screen.getByRole("button", { name: /stop/i });

        // Initial state: idle → start enabled, stop disabled
        expect(startBtn).toBeEnabled();
        expect(stopBtn).toBeDisabled();
        expect(screen.getByText(/Status: idle/i)).toBeInTheDocument();

        // Click "Start camera" → should eventually show "running" and enable Stop
        await act(async () => {
            startBtn.click();
        });

        await waitFor(() => {
            expect(screen.getByText(/Status: running/i)).toBeInTheDocument();
        });

        // Stop button should now be enabled
        expect(stopBtn).toBeEnabled();

        // Click "Stop" → status becomes "stopped"
        act(() => {
            stopBtn.click();
        });

        await waitFor(() => {
            expect(screen.getByText(/Status: stopped/i)).toBeInTheDocument();
        });
    });
});
