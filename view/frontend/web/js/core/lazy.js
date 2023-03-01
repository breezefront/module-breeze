(function () {
    'use strict';

    $.lazy = function (callback) {
        var processed = false;

        $(document).one([
            'touchstart', 'scroll', 'mousemove', 'click', 'mousewheel', 'keyup'
        ].join('.lazy '), () => {
            if (!processed) {
                processed = true;
                callback();
            }
        });
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

    $(() => {
        process('head script[type=lazy]');
    });
    $(document).on('breeze:load', () => {
        process('body script[type=lazy]');
    });
    $(document).on('breeze:destroy', () => {
        $(document).off('.lazy');
    });
})();
