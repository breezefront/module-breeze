(function () {
    'use strict';

    $.loadScript = function (src, callback) {
        return new Promise((resolve, reject) => {
            var script = document.createElement('script');

            script.onload = resolve;
            script.onerror = reject;
            script.src = src;

            document.head.appendChild(script);
        }).then(() => {
            if (callback) {
                callback();
            }
        });
    };
})();
