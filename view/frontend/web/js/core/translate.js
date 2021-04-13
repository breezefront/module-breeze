(function () {
    'use strict';

    var data = window.translations || {};

    window.breeze = window.breeze || {};
    window.breeze.translate = {
        /** Add translation phrase|phrases */
        add: function () {
            if (arguments.length > 1) {
                data[arguments[0]] = arguments[1];
            } else if (typeof arguments[0] === 'object') {
                $.extend(data, arguments[0]);
            }
        },

        /** Translate the phrase */
        translate: function (text) {
            return typeof data[text] !== 'undefined' ? data[text] : text;
        }
    };

    window.$t = window.breeze.translate.translate;
    window.__ = window.breeze.translate.translate;
})();
