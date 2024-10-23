# Bun/Node/Deno + Hono + SSE + Datastar Example

Sample project from https://data-star.dev/examples/node ported
to TypeScript and [Hono](https://hono.dev/).

Run `bun i` or something similar to install dependencies. Works with `bun`, `node` and `deno`

* `bun dev` - run bun server
* `bun run node-tsx` - run node+tsx server
* `bun deno` - run deno server

This example showcases two issues:

1. Datastar seems to steal the focus from the input elements while morphing the feed
   which makes it very hard to change the text and clicking the `Send State` button
   more often than not has no effect. The problem gets worse the higher the refresh rate
   of the feed is.

2. Clicking `Get Backend State` triggers multiple (up to 10) backend requests instead
   of just one.

I'm assuming that I'm doing something wrong here and want to understand what that is.