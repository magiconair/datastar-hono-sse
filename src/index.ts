import { Hono, type Context } from 'hono';
import { html } from 'hono/html';
import { logger } from 'hono/logger';
import { streamSSE } from 'hono/streaming';
import { randomBytes } from 'node:crypto';
import { DatastarStream, writeSSE } from './datastar-hono';

const app = new Hono();

app.use(logger()); // enable request logging

const backendData = { input: '', session: '' };

function indexPage() {
    const indexPage = html`<!doctype html><html>
      <head>
        <title>Datastar/Hono/TypeScript Example</title>
        <script type="module" defer src="https://cdn.jsdelivr.net/npm/@sudodevnull/datastar"></script>
      </head>
      <body>
        <h2>Datastar/Hono/TypeScript Example</h2>
        <main class="container" id="main" data-store='{ input: "", show: false }'>
        <input type="text" placeholder="Type here!" data-model="input" />
        <button data-on-click="$$put('/put')">Send State</button>
        <div id="output"></div>
        <button data-on-click="$$get('/get')">Get Backend State</button>
        <div id="output2"></div>
        <button data-on-click="$show=!$show">Toggle</button>
        <div data-show="$show">
          <span>Hello From Datastar!</span>
        </div>
        <div>
          <span>Feed from server: </span>
          <span id="feed" data-on-load="$$get('/feed')"></span>
        </div>
      </body>
    </html>`;
    return indexPage;
}

app.get('/', (c: Context) => {
    return c.html(indexPage());
});

app.put('/put', async (c: Context) => {
    return streamSSE(c, async (raw) => {
        const stream = new DatastarStream(raw);
        const body = await c.req.json();
        const input = body.input;
        console.log('/put', 'body', body);
        backendData.input = body.input;
        const output = `Your input: ${input}, is ${input.length} long.`;
        const frag = `<div id="output">${output}</div>`;
        await stream.writeEvent({ type: 'fragment', frag: frag, mergeType: 'morph' }, 'close');
    });
});

app.get('/get', (c: Context) => {
    return streamSSE(c, async (raw) => {
        const stream = new DatastarStream(raw);
        const output = `Backend State: ${JSON.stringify(backendData)}.`;
        let frag = `<div id="output2">${output}</div>`;
        await stream.writeEvent({ type: 'fragment', frag: frag, mergeType: 'morph' });

        frag = `<div id="output3">Check this out!</div>;`;
        await stream.writeEvent({ type: 'fragment', frag: frag, cssSelector: 'main', mergeType: 'prepend' }, 'close');
    });
});

let streamId = 0;
app.get('/feed', (c: Context) => {
    return streamSSE(c, async (raw) => {
        const stream = new DatastarStream(raw);
        const sid = streamId++;
        console.log(sid, 'open stream');
        stream.onAbort(() => {
            stream.close();
            console.log(sid, 'abort signal received');
        });
        while (!raw.aborted) {
            const rand = randomBytes(8).toString('hex');
            const frag = `<span id="feed">${rand}</span>`;
            await stream.writeEvent({ type: 'fragment', frag: frag, viewTransitions: 'off' });
            await stream.sleep(200);
        }
        console.log(sid, 'closed stream');
    });
});

// bun
export default app;

// Deno
// const port = parseFloat(process.env.PORT || '3000');
// console.log(`Listening on http://localhost:${port}`);
// Deno.serve({ port: port }, app.fetch);

// Node
// const port = parseFloat(process.env.PORT || '3000');
// console.log(`Listening on http://localhost:${port}`);
// serve({ fetch: app.fetch, port: port });
