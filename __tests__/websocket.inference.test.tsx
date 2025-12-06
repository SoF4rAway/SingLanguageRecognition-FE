// __tests__/websocket.inference.test.tsx
import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
    WebSocketProvider,
    useWs,
} from "@/components/WebsocketContext";
import InferenceResult from "@/components/inference/InferenceResult";

// ---- Mock WebSocket implementation ----

class MockWebSocket {
    static OPEN = 1;
    static instances: MockWebSocket[] = [];

    url: string;
    readyState = MockWebSocket.OPEN;
    binaryType = "blob";
    sent: any[] = [];

    onopen: ((ev: any) => void) | null = null;
    onclose: ((ev: any) => void) | null = null;
    onerror: ((ev: any) => void) | null = null;
    onmessage: ((ev: any) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }

    send(data: any) {
        this.sent.push(data);
    }

    close() {
        this.readyState = 3; // CLOSED
    }
}

let wsCtx: any = null;

function TestWsConsumer() {
    const ctx = useWs();
    wsCtx = ctx;
    return <span data-testid="ws-status">{ctx.status}</span>;
}

beforeAll(() => {
    process.env.NEXT_PUBLIC_INFERENCE_ENDPOINT = "http://localhost:8000";
    // @ts-expect-error jsdom global
    global.WebSocket = MockWebSocket as any;
});

beforeEach(() => {
    MockWebSocket.instances.length = 0;
    wsCtx = null;
});

// ---- Tests ----

describe("WebSocketProvider", () => {
    test("connects, updates status, stores last JSON, and can send text/binary", () => {
        render(
            <WebSocketProvider>
                <TestWsConsumer />
            </WebSocketProvider>
        );

        const socket = MockWebSocket.instances[0];
        expect(socket).toBeDefined();
        expect(socket.url).toContain("/ws/live");

        // Initial status is "connecting"
        expect(screen.getByTestId("ws-status")).toHaveTextContent("connecting");

        // Simulate WebSocket open
        act(() => {
            socket.onopen?.({} as any);
        });

        expect(screen.getByTestId("ws-status")).toHaveTextContent("open");

        // Simulate JSON message from server
        const payload = { type: "hello", model_loaded: true };
        act(() => {
            socket.onmessage?.({ data: JSON.stringify(payload) } as any);
        });

        expect(wsCtx.lastJson).toEqual(payload);

        // sendText should push into socket.sent when readyState is OPEN
        act(() => {
            wsCtx.sendText("ping");
        });
        expect(socket.sent).toContain("ping");

        // sendBinary should also use socket.send
        const buf = new ArrayBuffer(4);
        act(() => {
            wsCtx.sendBinary(buf);
        });
        expect(socket.sent).toContain(buf);
    });

    test("sendText/sendBinary are no-ops when WebSocket is not OPEN", () => {
        render(
            <WebSocketProvider>
                <TestWsConsumer />
            </WebSocketProvider>
        );

        const socket = MockWebSocket.instances[0];
        expect(socket.sent).toHaveLength(0);

        // Mark socket as not open
        socket.readyState = 0; // CONNECTING

        act(() => {
            wsCtx.sendText("ignored");
            wsCtx.sendBinary(new ArrayBuffer(2));
        });

        expect(socket.sent).toHaveLength(0);
    });
});

describe("InferenceResult", () => {
    test("shows fallback text when no inference yet", () => {
        render(
            <WebSocketProvider>
                <InferenceResult />
            </WebSocketProvider>
        );

        // Initially there's no JSON yet
        expect(screen.getByText(/No inference yet/i)).toBeInTheDocument();
        expect(screen.getByText(/WS: connecting/i)).toBeInTheDocument();
    });

    test("renders JSON payload and status when server sends a message", () => {
        render(
            <WebSocketProvider>
                <InferenceResult />
            </WebSocketProvider>
        );

        const socket = MockWebSocket.instances[0];

        act(() => {
            socket.onopen?.({} as any);
        });

        const payload = { type: "ack", buffer_len: 114 };
        act(() => {
            socket.onmessage?.({ data: JSON.stringify(payload) } as any);
        });

        // Fallback text is gone
        expect(screen.queryByText(/No inference yet/i)).not.toBeInTheDocument();

        // Status reflects WebSocket state
        expect(screen.getByText(/WS: open/i)).toBeInTheDocument();

        // JSON pretty-printed
        expect(screen.getByText(/"type": "ack"/i)).toBeInTheDocument();
        expect(screen.getByText(/"buffer_len": 114/i)).toBeInTheDocument();
    });
});
