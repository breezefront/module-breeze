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
                    $(this).clone().attr('data-breeze-temporary', 1).removeAttr('type').get(0),
                    this
                );
            });
        });
    }

    $(() => process('head script[type=lazy]'));
    $(document).on('breeze:load', () => {
        process('body script[type=lazy]');

        $(document).one([
            'touchstart', 'scroll', 'mousemove', 'click', 'mousewheel', 'keyup'
        ].join('.lazy '), () => {
            if (interacted) {
                return;
            }

            interacted = true;
            $('body').removeClass('breeze-inactive');

            while (callbacks.length > 0) {
                callbacks.shift()();
            }
        });
    });
    $(document).on('breeze:destroy', () => {
        $(document).off('.lazy');
        interacted = false;
        callbacks = [];
    });
})();
