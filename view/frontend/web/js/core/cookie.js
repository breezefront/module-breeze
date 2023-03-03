/* global Cookies */
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
        var cookies = Cookies.withAttributes($.extend(defaults, settings));

        return {
            /**
             * @param {String} name
             * @return {String}
             */
            get: function (name) {
                return cookies.get(name);
            },

            /**
             * @param {String} name
             * @param {String} value
             * @param {Object} attributes
             */
            set: function (name, value, attributes) {
                cookies.set(name, value, attributes);
            },

            /**
             * @param {String} name
             * @param {Object} attributes
             */
            remove: function (name, attributes) {
                cookies.remove(name, attributes);
            },

            /**
             * @param {String} name
             * @param {Object} attributes
             */
            clear: function (name, attributes) {
                cookies.remove(name, attributes);
            },

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
            }
        };
    })();

    $.mage = $.mage || {};
    $.mage.cookies = $.cookies;
})();
