define([], function () {
    'use strict';

    window.mediaCheck = function (options) {
        var mq = window.matchMedia(options.media);

        function mqChange(e) {
            e.matches ? options.entry?.() : options.exit?.();
        }

        mq.addEventListener('change', mqChange);
        mqChange(mq);
    };
});
