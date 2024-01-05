(function () {
    'use strict';

    var memo = {};

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
})();
