import { Context } from 'hono';
import { SSEStreamingApi } from 'hono/streaming';
import { DatastarMessage, DatastarEvent } from './datastar';

export function DatastarRequest(c: Context): boolean {
    return c.req.header('datastar-request') === 'true';
}

export async function writeSSE(stream: SSEStreamingApi, event: DatastarEvent) {
    await stream.writeSSE(DatastarMessage(event));
}
