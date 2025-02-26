(function () {
    'use strict';

    var interacted = false,
        callbacks = [];

    $.lazy = function (callback) {
        if (interacted) {
            return window.setTimeout(callback, 0);
        }
        callbacks.push(callback);
    };

    function process(selector) {
        $.lazy(() => {
            $(selector).each(function () {
                this.parentNode.insertBefore(
                    $(this).clone().removeAttr('type').get(0),
                    this
                );
            });
        });
    }

    $(() => process('head script[type=lazy]'));
    $(document).on('breeze:load', () => {
        process('body script[type=lazy]');

        $(document).one([
            'touchstart', 'scroll', 'mousemove', 'click', 'mousewheel', 'keyup', 'wakeup'
        ].join('.lazy '), (e) => {
            if (e.namespace !== undefined && e.type !== 'wakeup') {
                return;
            }

            $('body').removeClass('breeze-inactive');

            if (interacted) {
                return;
            }

            interacted = true;

            while (callbacks.length > 0) {
                callbacks.shift()();
            }
        });
    });
})();
