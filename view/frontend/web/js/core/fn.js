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
            this[method]();
        });
    };
});

/** Native methods proxy */
$.fn.invoke = function (method) {
    'use strict';

    this.each(function () {
        this[method]();
    });
};
