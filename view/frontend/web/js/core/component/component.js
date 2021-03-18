/* global WeakMap */
window.breeze = window.breeze || {};
window.breeze.registry = (function () {
    'use strict';

    var data = {};

    return {
        /**
         * @param {String} type
         * @param {Element} key
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
         * @param {Element} key
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
         * @param {Element} key
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

/** Class factory */
window.breeze.factory = function (BaseClass, singleton) {
    'use strict';

    var registry = {};

    /** [getIdKey description] */
    function getIdKey(name, settings) {
        var key = name;

        try {
            key += JSON.stringify(settings);
        } catch (e) {
            //
        }

        return key;
    }

    return function (name, prototype, settings, el) {
        var instance,
            key = getIdKey(name, settings);

        if (singleton && registry[key]) {
            registry[key].applyBindings(el);
        } else {
            if (typeof prototype === 'function') {
                instance = prototype.call(el, settings);
            } else {
                instance = new BaseClass(prototype, settings, el);
            }
            registry[key] = instance;
        }

        return registry[key];
    };
};

/** Abstract function to create components */
window.breeze.component = function (factory) {
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
            var result = this,
                args = arguments;

            if ($.isPlainObject(this)) {
                // object without element: $.fn.dataPost().send()
                result = factory(name, prototype, settings || {}, window);
            } else if (typeof settings === 'string') {
                // object instance or method: $(el).dropdown('open')

                result = undefined;
                args = Array.prototype.slice.call(args, 1);

                this.each(function () {
                    var instance = window.breeze.registry.get(name, this);

                    result = instance;

                    if (settings === 'instance') {
                        return false;
                    }

                    result = instance[settings].apply(instance, args);

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
                        instance = factory(name, prototype, settings, el);
                        window.breeze.registry.set(name, el, instance);
                    } else {
                        instance.option(settings).init();
                    }
                });
            }

            return result;
        };

        return $.fn[name];
    };
};
