import { Hono } from 'hono';
import { html } from 'hono/html';
import { logger } from 'hono/logger';
import { SSEMessage, streamSSE } from 'hono/streaming';
import { minify } from 'html-minifier';
import { randomBytes } from 'node:crypto';
import { serve } from '@hono/node-server';

const app = new Hono();

app.use(logger()); // enable request logging

const backendData = { input: '' };

function indexPage() {
    const indexPage = html`<!doctype html><html>
      <head>
        <title>Bun/Node/Deno + Hono + SSE + Datastar Example</title>
        <script type="module" defer src="https://cdn.jsdelivr.net/npm/@sudodevnull/datastar"></script>
      </head>
      <body>
        <h2>Bun/Node/Deno + Hono + SSE + Datastar Example</h2>
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

app.get('/', (c) => {
    return c.html(indexPage());
});

interface sseMessageArgs {
    fragment: string;
    id?: string;
    selector?: string;
    mergeType?: string;
    disableViewTransitions?: boolean;
}

function sseMessage(args: sseMessageArgs): SSEMessage {
    let data = '';
    if (args.selector && args.selector.length) data += `selector ${args.selector}\n`;
    if (args.mergeType && args.mergeType.length) data += `merge ${args.mergeType}\n`;
    if (args.disableViewTransitions && args.disableViewTransitions === true) data += `vt false\n`;
    data += `fragment ${minify(args.fragment, { collapseWhitespace: true })}`;
    return { event: 'datastar-fragment', data: data, id: args.id ? args.id : undefined };
}

app.put('/put', async (c) => {
    return streamSSE(c, async (stream) => {
        const body = await c.req.json();
        const input = body.input;
        console.log('/put', 'body', body);
        backendData.input = body.input;
        const output = `Your input: ${input}, is ${input.length} long.`;
        let frag = `<div id="output">${output}</div>`;
        await stream.writeSSE(sseMessage({ fragment: frag, mergeType: 'morph' }));
        await stream.close();
    });
});

app.get('/get', async (c) => {
    return streamSSE(c, async (stream) => {
        const output = `Backend State: ${JSON.stringify(backendData)}.`;
        let frag = `<div id="output2">${output}</div>`;
        await stream.writeSSE(sseMessage({ fragment: frag, mergeType: 'morph' }));

        frag = `<div id="output3">Check this out!</div>;`;
        await stream.writeSSE(sseMessage({ fragment: frag, selector: 'main', mergeType: 'prepend' }));
        await stream.close();
    });
});

let streamId = 0;
app.get('/feed', async (c) => {
    const { signal } = c.req.raw;
    return streamSSE(c, async (stream) => {
        const sid = streamId++;
        console.log(sid, 'open stream');
        signal.onabort = () => {
            stream.close();
            console.log(sid, 'abort signal received');
        };
        while (!stream.aborted) {
            const rand = randomBytes(8).toString('hex');
            const frag = `<span id="feed">${rand}</span>`;
            await stream.writeSSE(sseMessage({ fragment: frag, disableViewTransitions: true }));
            await stream.sleep(100);
        }
        console.log(sid, 'closed stream');
    });
});

const ua = navigator.userAgent;
const port = parseFloat(process.env.PORT || '3000');
if (ua.startsWith('Bun/')) {
    console.log(`Listening on http://localhost:${port}`);
    Bun.serve({ fetch: app.fetch, port: port });
} else if (ua.startsWith('Node.js/')) {
    console.log(`Listening on http://localhost:${port}`);
    serve({ fetch: app.fetch, port: port });
} else if (ua.startsWith('Deno/')) {
    Deno.serve(app.fetch);
} else {
    console.log(`invalid runtime: ${ua}`);
}
