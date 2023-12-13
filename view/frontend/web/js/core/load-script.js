(function () {
    'use strict';

    $.loadScript = function (src, callback) {
        return new Promise((resolve, reject) => {
            var script = document.createElement('script');

            if ($.breeze.loadedScripts[src]) {
                return resolve();
            }

            script.onload = resolve;
            script.onerror = reject;
            script.src = src;

            document.head.appendChild(script);
        }).then(() => {
            $.breeze.loadedScripts[src] = true;

            if (callback) {
                callback();
            }
        });
    };
})();
