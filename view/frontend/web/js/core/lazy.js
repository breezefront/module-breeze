(function () {
    'use strict';

    var interacted = false,
        timeout = 0,
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

            // Safari: initial click is "swallowed" if lazy cb (gallery slider)
            // modifies state of other clickable elements.
            if (e.type === 'touchstart' && e.target.closest('a, button, label, [tabindex="0"]')) {
                timeout = 600;
            }

            setTimeout(() => {
                while (callbacks.length > 0) {
                    callbacks.shift()();
                }
            }, timeout);
        });
    });
})();
