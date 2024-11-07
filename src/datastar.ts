import { minify, Options as minifyOptions } from 'html-minifier';

export function DatastarOptions(options: Options) {
    defaults = { ...defaults, ...options };
    defaults.logMode = defaults.logMode || 'log';
    defaults.minify = defaults.minify || false;
    defaults.minifyOptions = defaults.minifyOptions || defaultMinifyOptions;
}

export type DatastarEvent = Fragment | Signal | Remove | Redirect | Console;

export function DatastarMessage(event: DatastarEvent) {
    switch (event.type) {
        case 'fragment':
            return fragmentMessagge(event as Fragment);
        case 'signal':
            return signalMessage(event as Signal);
        case 'remove':
            return removeMessage(event as Remove);
        case 'redirect':
            return redirectMessage(event as Redirect);
        case 'console':
            return consoleMessage(event as Console);
        default:
            return { event: '', data: '' };
    }
}

type EventType = 'fragment' | 'signal' | 'remove' | 'redirect' | 'console';
type LogMode = 'debug' | 'error' | 'info' | 'group' | 'groupEnd' | 'log' | 'warn';
type MergeType = 'morph' | 'inner' | 'outer' | 'prepend' | 'append' | 'before' | 'after' | 'upsert_attributes';
type ViewTransition = 'on' | 'off';

const defaultMinifyOptions = { collapseWhitespace: true, removeComments: true };
let defaults: Options = {
    viewTransitions: undefined,
    logMode: 'log',
    minify: true,
    minifyOptions: { collapseWhitespace: true, removeComments: true },
};

interface Options {
    viewTransitions?: ViewTransition;
    logMode?: LogMode;
    minify?: boolean;
    minifyOptions?: minifyOptions;
}

interface Event {
    type: EventType;
    id?: string;
}

type Fragment = Event & {
    type: 'fragment';
    frag: string;
    cssSelector?: string;
    settleDuration?: number;
    viewTransitions?: ViewTransition;
    mergeType?: MergeType;
    minify?: boolean;
    minifyOptions?: minifyOptions;
};

type Signal = Event & {
    type: 'signal';
    store: object;
    onlyIfMissing?: boolean;
};

type Remove = Event & {
    type: 'remove';
    cssSelector?: string;
    settleDuration?: number;
    paths: string;
};

type Redirect = Event & {
    type: 'redirect';
    url: string;
};

type Console = Event & {
    type: 'console';
    message: string;
    logMode?: LogMode;
};

function fragmentMessagge(e: Fragment) {
    const data = [];
    if (e.cssSelector && e.cssSelector.length) {
        data.push(`selector ${e.cssSelector}`);
    }
    if (e.mergeType && e.mergeType.length) {
        data.push(`merge ${e.mergeType}`);
    }
    if (e.settleDuration && e.settleDuration > 0) {
        data.push(`setlle ${e.settleDuration}`);
    }
    if (e.viewTransitions !== undefined) {
        data.push(`vt ${e.viewTransitions === 'on' ? 'true' : 'false'}`);
    } else if (defaults.viewTransitions !== undefined) {
        data.push(`vt ${defaults.viewTransitions === 'on' ? 'true' : 'false'}`);
    }
    if (!defaults.minify || (e.minify !== undefined && !e.minify)) {
        data.push(`fragment ${e.frag}`);
    } else {
        data.push(`fragment ${minify(e.frag, e.minifyOptions || defaults.minifyOptions)}`);
    }
    return { event: 'datastar-' + e.type, id: e.id, data: data.join('\n') };
}

function signalMessage(e: Signal) {
    const data = [];
    data.push(`onlyIfMissing ${e.onlyIfMissing ? 'true' : 'false'}`);
    data.push(`store ${JSON.stringify(e.store)}`);
    return { event: 'datastar-' + e.type, id: e.id, data: data.join('\n') };
}

function removeMessage(e: Remove) {
    const data = [];
    if (e.cssSelector && e.cssSelector.length) {
        data.push(`selector ${e.cssSelector}`);
    }
    if (e.settleDuration && e.settleDuration > 0) {
        data.push(`setlle ${e.settleDuration}`);
    }
    if (e.paths && e.paths.length) {
        data.push(`paths ${e.paths}`);
    }
    return { event: 'datastar-' + e.type, id: e.id, data: data.join('\n') };
}

function redirectMessage(e: Redirect) {
    const data = [];
    data.push(`url ${e.url}`);
    return { event: 'datastar-' + e.type, id: e.id, data: data.join('\n') };
}

function consoleMessage(e: Console) {
    const data = [];
    data.push(`${e.logMode || defaults.logMode} ${e.message}`);
    return { event: 'datastar-' + e.type, id: e.id, data: data.join('\n') };
}
