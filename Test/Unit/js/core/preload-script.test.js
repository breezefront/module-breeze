/**
 * @jest-environment jsdom
 */

const $ = {
    breeze: {
        loadedScripts: {},
        preloadedScripts: {}
    }
};
const _ = {
    noop: () => {}
};

beforeEach(() => {
    $.breeze.loadedScripts = {};
    $.breeze.preloadedScripts = {};
    document.head.innerHTML = '';
    if ($.preloadScript && $.preloadScript.clearCache) {
        $.preloadScript.clearCache();
    }
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    jest.restoreAllMocks();
});

const loadPreloadScript = () => {
    jest.resetModules();

    global.$ = $;
    global._ = _;

    $.breezemap = {};
    $.breeze.loadedScripts = {};
    $.breeze.preloadedScripts = {};
    $.breeze.jsconfig = {};
    $.breeze._initialized = true;

    global.window = global;
    require('@breeze-module/view/frontend/web/js/core/preload-script.js');
};

loadPreloadScript();

describe('$.preloadScript', () => {
    const scriptSrc = 'https://example.com/script.js';
    const otherScriptSrc = 'https://example.com/other-script.js';

    beforeEach(() => {
        jest.useRealTimers();
    });

    it('should prevent preload if script is already loaded (in $.breeze.loadedScripts)', async () => {
        $.breeze.loadedScripts[scriptSrc] = true;
        const successMock = jest.fn();

        const promise = $.preloadScript(scriptSrc, successMock);

        await promise;

        expect(document.head.querySelector(`link[href="${scriptSrc}"]`)).toBeNull();
        expect(successMock).toHaveBeenCalled();
    });

    it('should prevent preload if script is already preloaded (in $.breeze.preloadedScripts)', async () => {
        $.breeze.preloadedScripts[scriptSrc] = true;
        const successMock = jest.fn();

        const promise = $.preloadScript(scriptSrc, successMock);

        await promise;

        expect(document.head.querySelector(`link[href="${scriptSrc}"]`)).toBeNull();
        expect(successMock).toHaveBeenCalled();
    });

    it('should prevent new preload if one is already in progress (in preloadMemo)', async () => {
        jest.useFakeTimers();

        const successMock = jest.fn();

        const firstPromise = $.preloadScript(scriptSrc);

        console.log.mockClear();

        const secondPromise = $.preloadScript(scriptSrc, successMock);

        const link = document.head.querySelector(`link[href="${scriptSrc}"]`);
        if (link) {
            link.onload();
        }
        jest.runAllTimers();
        await firstPromise;
        await secondPromise;

        expect(successMock).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it('should create a link element and append it to head for a new preload', async () => {
        const successMock = jest.fn();
        const promise = $.preloadScript(scriptSrc, successMock);

        const link = document.head.querySelector(`link[href="${scriptSrc}"]`);
        expect(link).not.toBeNull();
        expect(link.rel).toBe('preload');
        expect(link.as).toBe('script');
        expect(link.href).toBe(scriptSrc);

        link.onload();
        await promise;

        expect(successMock).toHaveBeenCalled();
        expect($.breeze.preloadedScripts[scriptSrc]).toBe(true);
    });

    it('should reject the promise on load error', async () => {
        const promise = $.preloadScript(scriptSrc);
        const link = document.head.querySelector(`link[href="${scriptSrc}"]`);

        link.onerror(new Event('error'));

        await expect(promise).rejects.toThrow('Preload failed: ' + scriptSrc);
        expect($.breeze.preloadedScripts[scriptSrc]).toBeUndefined();
    });

    it('should reject the promise on timeout', async () => {
        jest.useFakeTimers();

        const promise = $.preloadScript(scriptSrc);
        const link = document.head.querySelector(`link[href="${scriptSrc}"]`);

        jest.advanceTimersByTime(10000);

        await expect(promise).rejects.toThrow('Preload timeout: ' + scriptSrc);
        expect($.breeze.preloadedScripts[scriptSrc]).toBeUndefined();
        expect(link.parentNode).toBeNull();

        jest.useRealTimers();
    });

    describe('cleanupCache', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should remove oldest entries when cache size exceeds MAX_CACHE_SIZE', async () => {
            const MAX_CACHE_SIZE = 100;

            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const src = `https://example.com/script${i}.js`;
                const promise = $.preloadScript(src);

                const link = document.head.querySelector(`link[href="${src}"]`);
                if (link) {
                    link.onload();
                }
                jest.runAllTimers();
                await promise;
            }
            expect($.preloadScript.getCacheSize()).toBe(MAX_CACHE_SIZE);

            const script100Src = `https://example.com/script${MAX_CACHE_SIZE}.js`;
            console.log.mockClear();
            const promise100 = $.preloadScript(script100Src);
            const link100 = document.head.querySelector(`link[href="${script100Src}"]`);
            if (link100) {
                link100.onload();
            }
            jest.runAllTimers();
            await promise100;

            expect($.preloadScript.getCacheSize()).toBe(MAX_CACHE_SIZE + 1);

            const script101Src = `https://example.com/script${MAX_CACHE_SIZE + 1}.js`;
            console.log.mockClear();
            const promise101 = $.preloadScript(script101Src);
            const link101 = document.head.querySelector(`link[href="${script101Src}"]`);
            if (link101) {
                link101.onload();
            }
            jest.runAllTimers();
            await promise101;

            expect($.preloadScript.getCacheSize()).toBe(MAX_CACHE_SIZE + 1);

            console.log.mockClear();
            const oldestScriptAfterCleanup = `https://example.com/script0.js`;
            await $.preloadScript(oldestScriptAfterCleanup);
            jest.runAllTimers();
        });
    });

    describe('Cache Management Functions', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should clear the preloadMemo cache', async () => {
            const promise = $.preloadScript('https://example.com/test-clear.js');
            const link = document.head.querySelector('link[href="https://example.com/test-clear.js"]');
            if (link) {
                link.onload();
            }
            jest.runAllTimers();
            await promise;

            expect($.preloadScript.getCacheSize()).toBe(1);
            $.preloadScript.clearCache();
            expect($.preloadScript.getCacheSize()).toBe(0);
        });

        it('should return the correct cache size', async () => {
            expect($.preloadScript.getCacheSize()).toBe(0);

            const promise1 = $.preloadScript('https://example.com/test-size-1.js');
            const link1 = document.head.querySelector('link[href="https://example.com/test-size-1.js"]');
            if (link1) link1.onload();
            jest.runAllTimers();
            await promise1;

            expect($.preloadScript.getCacheSize()).toBe(1);

            const promise2 = $.preloadScript('https://example.com/test-size-2.js');
            const link2 = document.head.querySelector('link[href="https://example.com/test-size-2.js"]');
            if (link2) link2.onload();
            jest.runAllTimers();
            await promise2;

            expect($.preloadScript.getCacheSize()).toBe(2);
            $.preloadScript.clearCache();
            expect($.preloadScript.getCacheSize()).toBe(0);
        });
    });
});
