(() => {
    const memo = new Map();
    const SCRIPT_TIMEOUT = 10000;
    const MAX_CACHE_SIZE = 100;

    $.breeze.preloadedScripts = $.breeze.preloadedScripts || {};

    function cleanupCache(cache, maxSize) {
        if (cache.size > maxSize) {
            const entries = Array.from(cache.entries());
            const toDelete = entries.slice(0, cache.size - maxSize);
            toDelete.forEach(([key]) => cache.delete(key));
        }
    }

    $.preloadScript = function (src, success) {
        if ($.breeze.preloadedScripts[src]) {
            return Promise.resolve().then(success || _.noop);
        }

        if (memo.has(src)) {
            return memo.get(src).then(success || _.noop);
        }

        cleanupCache(memo, MAX_CACHE_SIZE);

        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            const timeoutId = setTimeout(() => {
                link.onload = link.onerror = null;
                if (link.parentNode) {
                    document.head.removeChild(link);
                }
                memo.delete(src);
                reject(new Error(`Preload timeout: ${src}`));
            }, SCRIPT_TIMEOUT);

            link.onload = () => {
                clearTimeout(timeoutId);
                $.breeze.preloadedScripts[src] = true;
                resolve();
            };

            link.onerror = (event) => {
                clearTimeout(timeoutId);
                memo.delete(src);
                const error = new Error(`Preload failed: ${src}`);
                error.event = event;
                reject(error);
            };

            link.rel = 'preload';
            link.as = 'script';
            link.href = src;

            document.head.appendChild(link);
        });

        memo.set(src, promise);
        return promise.then(success || _.noop);
    };

    $.preloadScript.clearCache = () => memo.clear();
    $.preloadScript.getCacheSize = () => memo.size;
})();
