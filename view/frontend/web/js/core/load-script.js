(function () {
    'use strict';

    $.loadScript = function (src, success) {
        return new Promise((resolve, reject) => {
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
        }).then(success || _.noop);
    };
})();
