(function () {
    'use strict';

    var methods = [
        'click',
        'submit',
        'blur',
        'focus'
    ];

    $.each(methods, function () {
        var method = this;

        /** Native methods proxy */
        $.fn[method] = function () {
            return this.each(function () {
                var event = document.createEvent('Event');

                event.initEvent(method, true, true);

                $(this).trigger(event);

                if (!event.defaultPrevented) {
                    this[method]();
                }
            });
        };
    });

    /** [isVisible description] */
    function isVisible(i, el) {
        return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
    }

    /** [isVisible description] */
    function isHidden(i, el) {
        return !isVisible(i, el);
    }

    /** Return visible elements */
    $.fn.visible = function () {
        return this.filter(isVisible);
    };

    /** Return hidden elements */
    $.fn.hidden = function () {
        return this.filter(isHidden);
    };

    /** [inViewport description] */
    function inViewport(i, el) {
        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= $(window).height() &&
            rect.right <= $(window).width()
        );
    }

    /** Return elements that are inside viewport */
    $.fn.inViewport = function () {
        return this.filter(inViewport);
    };

    /** Checks if element is inside viewport */
    $.fn.isInViewport = function () {
        return this.inViewport().length > 0;
    };

    /** Toggle block loader on the element */
    $.fn.spinner = function (flag, settings) {
        return this.each(function () {
            if (flag) {
                $.fn.blockLoader().show($(this), settings);
            } else {
                $.fn.blockLoader().hide($(this));
            }
        });
    };

    /** Serialize object to query string */
    $.params = function (object) {
        return Object.keys(object).map(function (key) {
            return key + '=' + object[key];
        }).join('&');
    };
})();
