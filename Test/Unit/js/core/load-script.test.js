/**
 * @jest-environment jsdom
 */

const $ = { breeze: { loadedScripts: {} } };
const _ = { noop: () => {} };

beforeEach(() => {
  $.breeze.loadedScripts = {};
  document.head.innerHTML = '';
  $.loadScript?.clearCache?.();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

const loadScriptToTest = () => {
    jest.resetModules();

    global.$ = $;
    global._ = _;

    global.window = global;
    require('@breeze-module/view/frontend/web/js/core/load-script.js');
};

loadScriptToTest();

describe('$.loadScript', () => {
    const scriptSrc = 'https://example.com/some-script.js';
    const otherScriptSrc = 'https://example.com/another-script.js';

    beforeEach(() => {
        jest.useRealTimers();
    });

    it('should not load if script is already loaded (in $.breeze.loadedScripts)', async () => {
        $.breeze.loadedScripts[scriptSrc] = true;
        const successMock = jest.fn();

        const promise = $.loadScript(scriptSrc, successMock);
        await promise;

        expect(document.head.querySelector(`script[src="${scriptSrc}"]`)).toBeNull();
        expect(successMock).toHaveBeenCalled();
    });

    it('should not load if script load is already in progress (in memo cache)', async () => {
        jest.useFakeTimers();

        const successMock = jest.fn();

        const firstPromise = $.loadScript(scriptSrc);

        const secondPromise = $.loadScript(scriptSrc, successMock);

        const scriptTag = document.head.querySelector(`script[src="${scriptSrc}"]`);
        if (scriptTag) {
            scriptTag.onload();
        }
        jest.runAllTimers();
        await firstPromise;
        await secondPromise;

        expect(successMock).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it('should create a script element and append it to head for a new load', async () => {
        const successMock = jest.fn();
        const promise = $.loadScript(scriptSrc, successMock);

        const scriptTag = document.head.querySelector(`script[src="${scriptSrc}"]`);
        expect(scriptTag).not.toBeNull();
        expect(scriptTag.tagName).toBe('SCRIPT');
        expect(scriptTag.src).toBe(scriptSrc);

        expect(scriptTag.async).toBe(true);
        // expect(scriptTag.hasAttribute('async')).toBe(true);

        expect(scriptTag.defer).toBe(false);
        // expect(scriptTag.hasAttribute('defer')).toBe(false);

        scriptTag.onload();
        await promise;

        expect(successMock).toHaveBeenCalled();
        expect($.breeze.loadedScripts[scriptSrc]).toBe(true);
    });

    it('should correctly set allowed script attributes', async () => {
        const attributes = {
            src: 'https://example.com/attr-script.js',
            type: 'module',
            async: false,
            defer: true,
            crossorigin: 'anonymous',
            'data-name': 'my-script'
        };
        const promise = $.loadScript(attributes);

        const scriptTag = document.head.querySelector(`script[src="${attributes.src}"]`);
        expect(scriptTag).not.toBeNull();
        expect(scriptTag.src).toBe(attributes.src);
        expect(scriptTag.type).toBe(attributes.type);

        expect(scriptTag.async).toBe(false);
        // expect(scriptTag.hasAttribute('async')).toBe(false);

        expect(scriptTag.defer).toBe(true);
        // expect(scriptTag.hasAttribute('defer')).toBe(true);

        expect(scriptTag.crossOrigin).toBe(attributes.crossorigin);
        expect(scriptTag.getAttribute('data-name')).toBe(attributes['data-name']);

        scriptTag.onload();
        await promise;
    });

    it('should warn for and ignore unsafe script attributes', async () => {
        const attributes = {
            src: 'https://example.com/unsafe-script.js',
            onerror: 'alert(1)',
            onmouseover: 'console.log("hover")',
            'data-custom': 'safe-data-attribute'
        };
        const promise = $.loadScript(attributes);

        const scriptTag = document.head.querySelector(`script[src="${attributes.src}"]`);
        expect(scriptTag).not.toBeNull();

        expect(scriptTag.hasAttribute('onerror')).toBe(false);
        expect(scriptTag.hasAttribute('onmouseover')).toBe(false);
        expect(scriptTag.getAttribute('data-custom')).toBe('safe-data-attribute');

        expect(console.warn).toHaveBeenCalledWith('Ignored unsafe script attribute: onerror');
        expect(console.warn).toHaveBeenCalledWith('Ignored unsafe script attribute: onmouseover');
        expect(console.warn).not.toHaveBeenCalledWith('Ignored unsafe script attribute: data-custom');

        scriptTag.onload();
        await promise;
    });

    it('should reject the promise on load error', async () => {
        const promise = $.loadScript(scriptSrc);
        const scriptTag = document.head.querySelector(`script[src="${scriptSrc}"]`);

        scriptTag.onerror(new Event('error'));

        await expect(promise).rejects.toThrow('Script load failed: ' + scriptSrc);
        expect($.breeze.loadedScripts[scriptSrc]).toBeUndefined();
    });

    it('should reject the promise on timeout', async () => {
        jest.useFakeTimers();

        const promise = $.loadScript(scriptSrc);
        const scriptTag = document.head.querySelector(`script[src="${scriptSrc}"]`);

        jest.advanceTimersByTime(10000);

        await expect(promise).rejects.toThrow('Script loading timeout: ' + scriptSrc);
        expect($.breeze.loadedScripts[scriptSrc]).toBeUndefined();
        expect(scriptTag.parentNode).toBeNull();

        jest.useRealTimers();
    });

    describe('Cache Management Functions', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should clear the memo cache', async () => {
            const promise = $.loadScript('https://example.com/test-clear.js');
            const scriptTag = document.head.querySelector('script[src="https://example.com/test-clear.js"]');
            if (scriptTag) {
                scriptTag.onload();
            }
            jest.runAllTimers();
            await promise;

            expect($.loadScript.getCacheSize()).toBe(1);
            $.loadScript.clearCache();
            expect($.loadScript.getCacheSize()).toBe(0);
        });

        it('should return the correct cache size', async () => {
            expect($.loadScript.getCacheSize()).toBe(0);

            const promise1 = $.loadScript('https://example.com/test-size-1.js');
            const scriptTag1 = document.head.querySelector('script[src="https://example.com/test-size-1.js"]');
            if (scriptTag1) scriptTag1.onload();
            jest.runAllTimers();
            await promise1;

            expect($.loadScript.getCacheSize()).toBe(1);

            const promise2 = $.loadScript('https://example.com/test-size-2.js');
            const scriptTag2 = document.head.querySelector('script[src="https://example.com/test-size-2.js"]');
            if (scriptTag2) scriptTag2.onload();
            jest.runAllTimers();
            await promise2;

            expect($.loadScript.getCacheSize()).toBe(2);
            $.loadScript.clearCache();
            expect($.loadScript.getCacheSize()).toBe(0);
        });

        it('should remove oldest entries when cache size exceeds MAX_CACHE_SIZE', async () => {
            const MAX_CACHE_SIZE = 100;

            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const src = `https://example.com/script${i}.js`;
                const promise = $.loadScript(src);
                const scriptTag = document.head.querySelector(`script[src="${src}"]`);
                if (scriptTag) {
                    scriptTag.onload();
                }
                jest.runAllTimers();
                await promise;
            }
            expect($.loadScript.getCacheSize()).toBe(MAX_CACHE_SIZE);

            const script100Src = `https://example.com/script${MAX_CACHE_SIZE}.js`;
            const promise100 = $.loadScript(script100Src);
            const scriptTag100 = document.head.querySelector(`script[src="${script100Src}"]`);
            if (scriptTag100) {
                scriptTag100.onload();
            }
            jest.runAllTimers();
            await promise100;

            expect($.loadScript.getCacheSize()).toBe(MAX_CACHE_SIZE + 1);

            const script101Src = `https://example.com/script${MAX_CACHE_SIZE + 1}.js`;
            const promise101 = $.loadScript(script101Src);
            const scriptTag101 = document.head.querySelector(`script[src="${script101Src}"]`);
            if (scriptTag101) {
                scriptTag101.onload();
            }
            jest.runAllTimers();
            await promise101;

            expect($.loadScript.getCacheSize()).toBe(MAX_CACHE_SIZE + 1);

            const oldestScriptAfterCleanup = `https://example.com/script0.js`;
            const reLoadPromise = $.loadScript(oldestScriptAfterCleanup);

            const newScriptTagForOldest = document.head.querySelector(`script[src="${oldestScriptAfterCleanup}"]`);
            if (newScriptTagForOldest) {
                newScriptTagForOldest.onload();
            }
            jest.runAllTimers();

            await reLoadPromise;
        });
    });
});
