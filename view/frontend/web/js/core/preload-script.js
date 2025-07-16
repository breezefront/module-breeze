(() => {
    const preloadMemo = new Map();
    const SCRIPT_TIMEOUT = 10000;
    const MAX_CACHE_SIZE = 100;
    const DEBUG = false;

    $.breeze.loadedScripts = $.breeze.loadedScripts || {};
    $.breeze.preloadedScripts = $.breeze.preloadedScripts || {};

    function cleanupCache(cache, maxSize) {
        if (cache.size > maxSize) {
            const entries = Array.from(cache.entries());
            const toDelete = entries.slice(0, cache.size - maxSize);
            toDelete.forEach(([key]) => cache.delete(key));
        }
    }

    $.preloadScript = function (src, success) {
        if (DEBUG) console.log('preloadScript', src);
        if ($.breeze && $.breeze.loadedScripts && $.breeze.loadedScripts[src]) {
            return Promise.resolve().then(success || _.noop);
        }

        if ($.breeze.preloadedScripts[src]) {
            return Promise.resolve().then(success || _.noop);
        }

        if (preloadMemo.has(src)) {
            return preloadMemo.get(src).then(success || _.noop);
        }
        if (DEBUG) console.log('preload request:', src);

        cleanupCache(preloadMemo, MAX_CACHE_SIZE);

        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            const timeoutId = setTimeout(() => {
                link.onload = link.onerror = null;
                if (link.parentNode) {
                    document.head.removeChild(link);
                }
                preloadMemo.delete(src);
                reject(new Error(`Preload timeout: ${src}`));
            }, SCRIPT_TIMEOUT);

            link.onload = () => {
                if (DEBUG) console.log('on preloadScript', src);
                clearTimeout(timeoutId);
                $.breeze.preloadedScripts[src] = true;
                resolve();
            };

            link.onerror = (event) => {
                clearTimeout(timeoutId);
                preloadMemo.delete(src);
                const error = new Error(`Preload failed: ${src}`);
                error.event = event;
                reject(error);
            };

            link.rel = 'preload';
            link.as = 'script';
            link.href = src;

            document.head.appendChild(link);
        });

        preloadMemo.set(src, promise);
        return promise.then(success || _.noop);
    };

    $.preloadScript.clearCache = () => preloadMemo.clear();
    $.preloadScript.getCacheSize = () => preloadMemo.size;
})();
