$.storage = $.localStorage = (function () {
    'use strict';

    var storage = window.localStorage || window.sessionStorage,
        data = {};

    return {
        /**
         * @param {String} key
         * @return {String}
         */
        get: function (key) {
            return storage.getItem(key);
        },

        /**
         * @param {String} key
         * @param {String} value
         */
        set: function (key, value) {
            storage.setItem(key, value);
        },

        /**
         * @param {Mixed} keys
         */
        remove: function (keys) {
            if (typeof keys === 'string') {
                keys = [keys];
            }

            keys.forEach(function (key) {
                storage.removeItem(key);
            });
        },

        /**
         * @param {String} namespace
         * @return {Object}
         */
        ns: function (namespace) {
            if (!data[namespace]) {
                data[namespace] = {};
            }

            if (storage.getItem(namespace)) {
                try {
                    data[namespace] = JSON.parse(storage.getItem(namespace));
                } catch (e) {
                    console.error(e);
                }
            }

            return {
                /**
                 * @param {String} key
                 * @return {Mixed}
                 */
                get: function (key) {
                    if (!key) {
                        return data[namespace];
                    }

                    return data[namespace][key];
                },

                /**
                 * @param {String} key
                 * @param {Mixed} value
                 */
                set: function (key, value) {
                    data[namespace][key] = value;

                    storage.setItem(namespace, JSON.stringify(data[namespace]));
                },

                /**
                 * @return {Array}
                 */
                keys: function () {
                    return Object.keys(data[namespace]);
                },

                /**
                 * @param {Mixed} keys
                 */
                remove: function (keys) {
                    if (typeof keys === 'string') {
                        keys = [keys];
                    }

                    keys.forEach(function (key) {
                        delete data[namespace][key];
                    });

                    storage.setItem(namespace, JSON.stringify(data[namespace]));
                },

                /** Remove all data */
                removeAll: function () {
                    data[namespace] = {};
                    storage.removeItem(namespace);
                }
            };
        }
    };
})();

/** Emulate jquery plugin for easier integrations */
$.initNamespaceStorage = function (ns) {
    'use strict';

    return {
        localStorage: $.storage.ns(ns)
    };
};
