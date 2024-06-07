(function () {
    'use strict';

    var memo = {},
        preloadMemo = {};

    $.loadScript = function (src, success) {
        var obj = typeof src === 'object' ? src : { src: src };

        if (!memo[obj.src]) {
            memo[obj.src] = new Promise((resolve, reject) => {
                var script = document.createElement('script');

                if ($.breeze.loadedScripts[obj.src]) {
                    return resolve();
                }

                script.onload = () => {
                    $.breeze.loadedScripts[obj.src] = true;
                    resolve();
                };
                script.onerror = reject;
                script.async = true;

                for (const [key, value] of Object.entries(obj)) {
                    script.setAttribute(key, value);
                }

                document.head.appendChild(script);
            });
        }

        return memo[obj.src].then(success || _.noop);
    };

    $.preloadScript = function (src, success) {
        if (!preloadMemo[src]) {
            preloadMemo[src] = new Promise((resolve, reject) => {
                var link = document.createElement('link');

                if ($.breeze.loadedScripts[src]) {
                    return resolve();
                }

                link.onload = resolve;
                link.onerror = reject;
                link.href = src;
                link.rel = 'preload';
                link.as = 'script';

                document.head.appendChild(link);
            });
        }

        return preloadMemo[src].then(success || _.noop);
    };
})();
