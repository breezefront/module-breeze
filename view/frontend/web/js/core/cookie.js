(function () {
    'use strict';

    var defaults = {
            path: '/',
            domain: null,
            secure: true,
            expires: null,
            samesite: 'strict'
        },
        settings = window.cookiesConfig || {};

    if (settings.lifetime) {
        settings.expires = new Date();
        settings.expires = new Date(settings.expires.getTime() + settings.lifetime * 1000);
        delete settings.lifetime;
    }

    $.cookies = $.cookieStorage = (function () {
        // eslint-disable-next-line no-undef
        var cookies = Cookies.withAttributes($.extend(defaults, settings));

        return {
            /**
             * @param {String} name
             * @return {String}
             */
            get: cookies.get,

            /**
             * @param {String} name
             * @param {String} value
             * @param {Object} attributes
             */
            set: cookies.set,

            /**
             * @param {String} name
             * @param {Object} attributes
             */
            remove: cookies.remove,

            /**
             * @param {String} name
             * @param {Object} attributes
             */
            clear: cookies.remove,

            /**
             * @param {String} name
             * @return {Mixed}
             */
            getJson: function (name) {
                var value = this.get(name);

                if (value) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        console.error(e);
                        value = {};
                    }
                }

                return value;
            },

            /**
             * @param {String} name
             * @param {Object} value
             * @param {Object} attributes
             */
            setJson: function (name, value, attributes) {
                this.set(name, JSON.stringify(value), attributes);
            },

            setConf: () => {},
        };
    })();

    $.cookie = (name, value, options) => {
        if (value !== undefined) {
            return $.cookies.set(name, value, options);
        }
        return $.cookies.get(name);
    };
    $.removeCookie = (name, options) => {
        if ($.cookies.get(name) === undefined) {
            return false;
        }

        $.cookies.remove(name, options);

        return !$.cookies.get(name);
    };

    $.mage = $.mage || {};
    $.mage.cookies = $.cookies;

    setTimeout(() => {
        $.breezemap['mage/cookies'] = $.cookies;
    });
})();
