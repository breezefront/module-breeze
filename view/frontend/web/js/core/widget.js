/* global WeakMap */
window.breeze = window.breeze || {};
window.breeze.widget = (function () {
    'use strict';

    var Widget, registry;

    registry = (function () {
        var data = {};

        return {
            /**
             * @param {String} type
             * @param {Object} key
             * @return {Mixed}
             */
            get: function (type, key) {
                var result = [];

                if (!data[type] || !data[type].widgets) {
                    return;
                }

                if (key) {
                    return data[type].widgets.get(key);
                }

                $.each(data[type].elements, function (index, element) {
                    var instance = registry.get(type, element);

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
                        widgets: new WeakMap(),
                        elements: []
                    };
                }

                data[type].widgets.set(key, value);
                data[type].elements.push(key);
            },

            /**
             * @param {String} type
             * @param {Object} key
             */
            delete: function (type, key) {
                var instance, index;

                if (type && key) {
                    instance = data[type].widgets.get(key);
                    index = data[type].elements.indexOf(key);

                    if (index !== -1) {
                        data[type].elements.splice(index, 1);
                    }

                    if (instance && instance.destroy) {
                        instance.destroy();
                    }

                    return data[type].widgets.delete(key);
                }

                if (type) {
                    return $.each(data[type].elements, function (i, element) {
                        registry.delete(type, element);
                    });
                }

                $.each(data, function (t) {
                    $.each(data[t].elements, function (i, element) {
                        registry.delete(t, element);
                    });
                });
            }
        };
    })();

    /** Base class */
    Widget = function (prototype, settings, el) {
        var result = Object.create(Widget.prototype);

        Object.assign(result, prototype);

        result.initialize.apply(result, [settings, el]);

        return result;
    };

    Widget.prototype = {
        /**
         * @param {Object} options
         * @param {Element} element
         * @return {Widget}
         */
        initialize: function (options, element) {
            this.element = element;
            this.options = $.extend({}, this.options, options || {});

            if (this.init) {
                this.init();
            }

            return this;
        }
    };

    return function (name, prototype) {
        if (typeof prototype === 'undefined') {
            return {
                /** @param {String} method */
                invoke: function (method) {
                    var collection = registry.get(name);

                    if (!collection) {
                        return;
                    }

                    collection.forEach(function (instance) {
                        if (instance[method]) {
                            instance[method]();
                        }
                    });
                },

                /** Destroy widgets */
                destroy: function () {
                    registry.delete(name);
                }
            };
        }

        /** @param {Object|Function|String} settings */
        $.fn[name] = function (settings) {
            var result = this;

            if ($.isPlainObject(this)) {
                // widget without element: $.fn.dataPost().send()

                settings = settings || {};

                if (typeof prototype === 'function') {
                    result = prototype.call(window, settings);
                } else {
                    result = new Widget(prototype, settings, window);
                }
            } else if (typeof settings === 'string') {
                // widget instance or method: $(el).dropdown('open')

                result = undefined;

                this.each(function () {
                    var instance = registry.get(name, this);

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
                // widget initialization

                this.each(function () {
                    var el = this,
                        instance = registry.get(name, el);

                    if (!instance) {
                        if (typeof prototype === 'function') {
                            instance = prototype.call(el, settings);
                        } else {
                            instance = new Widget(prototype, settings, el);
                        }
                        registry.set(name, el, instance);
                    }
                });
            }

            return result;
        };

        return $.fn[name];
    };
})();
