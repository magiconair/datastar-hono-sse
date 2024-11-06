import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { DatastarMessage, DatastarEvent } from './datastar';

export function DatastarRequest(c: Context): boolean {
    return c.req.header('datastar-request') === 'true';
}

export function DatastarResponse(c: Context, ...events: DatastarEvent[]): Response {
    return streamSSE(c, async (stream) => {
        for (const e of events) {
            const msg = DatastarMessage(e);
            if (msg.event === '') continue;
            await stream.writeSSE(msg);
        }
        await stream.close();
    });
}
