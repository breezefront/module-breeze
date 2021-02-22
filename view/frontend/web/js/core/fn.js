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
            $(this).data('turbo', false).trigger(method);
            this[method]();
        });
    };
});
