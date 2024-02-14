(function () {
    'use strict';

    var memo = {},
        preloadMemo = {};

    $.loadScript = function (src, success) {
        if (!memo[src]) {
            memo[src] = new Promise((resolve, reject) => {
                var script = document.createElement('script');

                if ($.breeze.loadedScripts[src]) {
                    return resolve();
                }

                script.onload = () => {
                    $.breeze.loadedScripts[src] = true;
                    resolve();
                };
                script.onerror = reject;
                script.async = false;
                script.src = src;

                document.head.appendChild(script);
            });
        }

        return memo[src].then(success || _.noop);
    };

    $.preloadScript = function (src, success) {
        if (!preloadMemo[src]) {
            preloadMemo[src] = new Promise((resolve, reject) => {
                var link = document.createElement('link');

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
