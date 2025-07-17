(() => {
    const memo = new Map();
    const SCRIPT_TIMEOUT = 10000;
    const MAX_CACHE_SIZE = 100;
    const ALLOWED_SCRIPT_ATTRIBUTES = [
        'type',
        'crossorigin',
        'integrity',
        'referrerpolicy',
        'nomodule'
    ];

    $.breeze.loadedScripts = $.breeze.loadedScripts || {};

    function cleanupCache(cache, maxSize) {
        if (cache.size > maxSize) {
            const entries = Array.from(cache.entries());
            const toDelete = entries.slice(0, cache.size - maxSize);
            toDelete.forEach(([key]) => cache.delete(key));
        }
    }

    $.loadScript = function (src, success) {
        const obj = typeof src === 'object' ? src : { src };

        if ($.breeze.loadedScripts[obj.src]) {
            return Promise.resolve().then(success || _.noop);
        }

        if (memo.has(obj.src)) {
            return memo.get(obj.src).then(success || _.noop);
        }

        cleanupCache(memo, MAX_CACHE_SIZE);

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeoutId = setTimeout(() => {
                script.onload = script.onerror = null;
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                memo.delete(obj.src);
                reject(new Error(`Script loading timeout: ${obj.src}`));
            }, SCRIPT_TIMEOUT);

            script.onload = () => {
                clearTimeout(timeoutId);
                $.breeze.loadedScripts[obj.src] = true;
                resolve();
            };

            script.onerror = (event) => {
                clearTimeout(timeoutId);
                memo.delete(obj.src);
                const error = new Error(`Script load failed: ${obj.src}`);
                error.event = event;
                reject(error);
            };

            script.src = obj.src;
            script.async = obj.async !== false;
            script.defer = obj.defer === true;

            for (const [key, value] of Object.entries(obj)) {
                if (['src', 'async', 'defer'].includes(key)) {
                    continue;
                }
                if (key.startsWith('data-') || ALLOWED_SCRIPT_ATTRIBUTES.includes(key)) {
                    script.setAttribute(key, value);
                } else {
                    console.warn(`Ignored unsafe script attribute: ${key}`);
                }
            }

            document.head.appendChild(script);
        });

        memo.set(obj.src, promise);
        return promise.then(success || _.noop);
    };

    $.loadScript.clearCache = () => memo.clear();
    $.loadScript.getCacheSize = () => memo.size;
})();
