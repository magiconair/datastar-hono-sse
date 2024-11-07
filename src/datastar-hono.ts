import { type Context } from 'hono';
import { SSEMessage, SSEStreamingApi } from 'hono/streaming';
import { DatastarMessage, DatastarEvent } from './datastar';

export function DatastarRequest(c: Context): boolean {
    return c.req.header('datastar-request') === 'true';
}

export async function writeSSE(stream: SSEStreamingApi, event: DatastarEvent, close?: 'close') {
    await stream.writeSSE(DatastarMessage(event));
    if (close !== undefined && close) await stream.close();
}

export class DatastarStream {
    private id: number;
    private retry: number | undefined;
    private stream: SSEStreamingApi;

    constructor(stream: SSEStreamingApi, retry?: number) {
        this.id = 0;
        this.retry = retry;
        this.stream = stream;
    }

    writeEvent(event: DatastarEvent, close?: 'close'): Promise<void> {
        if (!event.id) {
            event.id = this.id.toString();
            this.id++;
        }
        if (!event.retry) {
            event.retry = this.retry;
        }
        return writeSSE(this.stream, event, close);
    }

    writeSSE(message: SSEMessage): Promise<void> {
        return this.stream.writeSSE(message);
    }

    sleep(ms: number): Promise<unknown> {
        return this.stream.sleep(ms);
    }

    onAbort(listener: () => void | Promise<void>): void {
        this.stream.onAbort(listener);
    }

    close(): Promise<void> {
        return this.stream.close();
    }
}
