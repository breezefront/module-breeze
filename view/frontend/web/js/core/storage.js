var createStorage = function (storage) {
    'use strict';

    var data = {},
        loadedNamespaces = [];

    function loadNamespace(namespace) {
        if (loadedNamespaces.includes(namespace)) {
            return;
        }

        loadedNamespaces.push(namespace);

        if (!storage.getItem(namespace)) {
            return;
        }

        try {
            data[namespace] = JSON.parse(storage.getItem(namespace));
        } catch (e) {
            console.error(e);
        }
    }

    return {
        get: function (key) {
            var result = storage.getItem(key);

            try {
                result = JSON.parse(result);
            } catch (e) {}

            return result;
        },

        set: function (key, value) {
            if (value && typeof value === 'object') {
                value = JSON.stringify(value);
            }
            storage.setItem(key, value);
        },

        /**
         * @param {Mixed} keys
         */
        remove: function (keys) {
            if (typeof keys !== 'object') {
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

            return {
                /**
                 * @param {String} key
                 * @return {Mixed}
                 */
                get: function (key) {
                    loadNamespace(namespace);

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
                    loadNamespace(namespace);

                    data[namespace][key] = value;

                    storage.setItem(namespace, JSON.stringify(data[namespace]));
                },

                /**
                 * @return {Array}
                 */
                keys: function () {
                    loadNamespace(namespace);

                    return Object.keys(data[namespace]);
                },

                /**
                 * @param {Mixed} keys
                 */
                remove: function (keys) {
                    loadNamespace(namespace);

                    if (typeof keys !== 'object') {
                        keys = [keys];
                    }

                    keys.forEach(function (key) {
                        delete data[namespace][key];
                    });

                    storage.setItem(namespace, JSON.stringify(data[namespace]));
                },

                /** Remove all data */
                removeAll: function () {
                    loadNamespace(namespace);
                    data[namespace] = {};
                    storage.removeItem(namespace);
                }
            };
        }
    };
};

$.storage = $.localStorage = createStorage(window.localStorage || window.sessionStorage);
$.sessionStorage = createStorage(window.sessionStorage);

/** Emulate jquery plugin for easier integrations */
$.initNamespaceStorage = function (ns) {
    'use strict';

    return {
        localStorage: $.storage.ns(ns)
    };
};
