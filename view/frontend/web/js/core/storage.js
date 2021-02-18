window.breeze = window.breeze || {};
window.breeze.storage = (function () {
    'use strict';

    var storage = window.localStorage || window.sessionStorage;

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
         * @param {String} namespace
         * @return {Object}
         */
        ns: function (namespace) {
            var data = {};

            if (storage.getItem(namespace)) {
                try {
                    data = JSON.parse(storage.getItem(namespace));
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
                        return data;
                    }

                    return data[key];
                },

                /**
                 * @param {String} key
                 * @param {Mixed} value
                 */
                set: function (key, value) {
                    data[key] = value;

                    storage.setItem(namespace, JSON.stringify(data));
                },

                /**
                 * @return {Array}
                 */
                keys: function () {
                    return Object.keys(data);
                },

                /**
                 * @param {Mixed} keys
                 */
                remove: function (keys) {
                    if (typeof keys === 'string') {
                        keys = [keys];
                    }

                    keys.forEach(function (key) {
                        delete data[key];
                    });

                    storage.setItem(namespace, JSON.stringify(data));
                },

                /** Remove all data */
                removeAll: function () {
                    data = {};
                    storage.removeItem(namespace);
                }
            };
        }
    };
})();
