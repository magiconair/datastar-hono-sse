import { minify, Options as minifyOptions } from 'html-minifier';

export function DatastarOptions(options: Options) {
    // todo(fs): there is probably a better way to do this
    // todo(fs): 'defaults = {...defaults, ...options}' merges undefined fields which is not what we want
    if (options.logMode !== undefined) defaults.logMode = options.logMode;
    if (options.viewTransitions !== undefined) defaults.viewTransitions = options.viewTransitions;
    if (options.minify !== undefined) defaults.minify = options.minify;
    if (options.minifyOptions !== undefined) defaults.minifyOptions = options.minifyOptions;
}

export type DatastarEvent = Fragment | Signal | Delete | Redirect | Console;

export function DatastarMessage(msg: DatastarEvent) {
    switch (msg.type) {
        case 'fragment':
            return fragmentMessagge(msg as Fragment);
        case 'signal':
            return signalMessage(msg as Signal);
        case 'delete':
            return deleteMessage(msg as Delete);
        case 'redirect':
            return redirectMessage(msg as Redirect);
        case 'console':
            return consoleMessage(msg as Console);
        default:
            return { event: '', data: '' };
    }
}

type EventType = 'fragment' | 'signal' | 'delete' | 'redirect' | 'console';
type LogMode = 'debug' | 'error' | 'info' | 'group' | 'groupEnd' | 'log' | 'warn';
type MergeType = 'morph' | 'inner' | 'outer' | 'prepend' | 'append' | 'before' | 'after' | 'upsert_attributes';
type ViewTransition = 'on' | 'off';

let defaults: Options = {
    viewTransitions: 'on',
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

type Delete = Event & {
    type: 'delete';
    paths: string;
    cssSelector?: string;
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
    if (e.viewTransitions !== undefined) {
        data.push(`vt ${e.viewTransitions == 'on' ? 'true' : 'false'}`);
    }
    if (e.minify !== undefined && !e.minify) {
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

function deleteMessage(e: Delete) {
    const data = [];
    if (e.cssSelector && e.cssSelector.length) {
        data.push(`selector ${e.cssSelector}`);
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
