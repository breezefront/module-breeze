(function () {
    'use strict';

    $.loadScript = function (src, callback) {
        var script = document.createElement('script');

        if (callback) {
            script.onload = function () {
                callback();
            };
        }

        script.src = src;
        document.head.appendChild(script);
    };
})();
