var methods = [
    'click',
    'submit',
    'blur',
    'focus'
];

$.each(methods, function () {
    'use strict';

    var method = this;

    /** Native methods proxy */
    $.fn[method] = function () {
        this.each(function () {
            var event = document.createEvent('Event');

            event.initEvent(method, true, true);

            $(this).trigger(event);

            if (!event.defaultPrevented) {
                this[method]();
            }
        });
    };
});
