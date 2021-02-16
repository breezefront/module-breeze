/* global WeakMap */
window.breeze = window.breeze || {};
window.breeze.registry = (function () {
    'use strict';

    var data = {};

    return {
        /**
         * @param {String} type
         * @param {Object} key
         * @return {Mixed}
         */
        get: function (type, key) {
            var result = [];

            if (!data[type] || !data[type].objects) {
                return;
            }

            if (key) {
                return data[type].objects.get(key);
            }

            $.each(data[type].elements, function (index, element) {
                var instance = window.breeze.registry.get(type, element);

                if (!instance) {
                    return;
                }

                result.push(instance);
            });

            return result;
        },

        /**
         * @param {String} type
         * @param {Object} key
         * @param {Object} value
         */
        set: function (type, key, value) {
            if (!data[type]) {
                data[type] = {
                    objects: new WeakMap(),
                    elements: []
                };
            }

            data[type].objects.set(key, value);
            data[type].elements.push(key);
        },

        /**
         * @param {String} type
         * @param {Object} key
         */
        delete: function (type, key) {
            var instance, index;

            if (type && key) {
                instance = data[type].objects.get(key);
                index = data[type].elements.indexOf(key);

                if (index !== -1) {
                    data[type].elements.splice(index, 1);
                }

                if (instance && instance.destroy) {
                    instance.destroy();
                }

                return data[type].objects.delete(key);
            }

            if (type) {
                return $.each(data[type].elements, function (i, element) {
                    window.breeze.registry.delete(type, element);
                });
            }

            $.each(data, function (t) {
                $.each(data[t].elements, function (i, element) {
                    window.breeze.registry.delete(t, element);
                });
            });
        }
    };
})();

/** Abstract function to create components */
window.breeze.component = function (BaseClass) {
    'use strict';

    return function (name, prototype) {
        if (typeof prototype === 'undefined') {
            return {
                /** @param {String} method */
                invoke: function (method) {
                    var collection = window.breeze.registry.get(name);

                    if (!collection) {
                        return;
                    }

                    collection.forEach(function (instance) {
                        if (instance[method]) {
                            instance[method]();
                        }
                    });
                },

                /** Destroy objects */
                destroy: function () {
                    window.breeze.registry.delete(name);
                }
            };
        }

        /** @param {Object|Function|String} settings */
        $.fn[name] = function (settings) {
            var result = this;

            if ($.isPlainObject(this)) {
                // object without element: $.fn.dataPost().send()

                settings = settings || {};

                if (typeof prototype === 'function') {
                    result = prototype.call(window, settings);
                } else {
                    result = new BaseClass(prototype, settings, window);
                }
            } else if (typeof settings === 'string') {
                // object instance or method: $(el).dropdown('open')

                result = undefined;

                this.each(function () {
                    var instance = window.breeze.registry.get(name, this);

                    result = instance;

                    if (settings === 'instance') {
                        return false;
                    }

                    result = instance[settings]();

                    if (result !== instance && result !== undefined) {
                        return false;
                    }
                });
            } else {
                // object initialization

                this.each(function () {
                    var el = this,
                        instance = window.breeze.registry.get(name, el);

                    if (!instance) {
                        if (typeof prototype === 'function') {
                            instance = prototype.call(el, settings);
                        } else {
                            instance = new BaseClass(prototype, settings, el);
                        }
                        window.breeze.registry.set(name, el, instance);
                    }
                });
            }

            return result;
        };

        return $.fn[name];
    };
};
