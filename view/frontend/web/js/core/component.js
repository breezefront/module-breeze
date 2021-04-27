/* global WeakMap ko _ */
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
window.breeze.factory = function (Root, singleton) {
    'use strict';

    var registry = {};

    return {
        /** Extends Base prototype with Parent or Root */
        extend: function (Base, Parent) {
            return (Parent || Root).extend(Base);
        },

        /** Creates a new instance of Base prototype */
        create: function (Base, settings, el) {
            var instance, key;

            settings = settings || {};
            key = settings.__scope;

            if (singleton && key && registry[key]) {
                registry[key].applyBindings(el);
            } else {
                instance = new Base(settings, el);

                if (singleton && key) {
                    registry[key] = instance;
                } else {
                    return instance;
                }
            }

            return registry[key];
        }
    };
};

/** Abstract function to create components */
window.breeze.component = function (factory) {
    'use strict';

    var prototypes = {};

    return function (name, parent, prototype) {
        if (!prototype) {
            prototype = parent;
            parent = undefined;
        }

        if (typeof prototype === 'undefined') {
            return {
                /**
                 * Example:
                 *
                 *     breeze.view('messages').invoke('removeCookieMessages');
                 *     breeze.widget('dropdown').invoke('close');
                 *
                 * @param {String} method
                 */
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

                /**
                 * Example:
                 *
                 *     breeze.view('messages').destroy();
                 *     breeze.widget('dropdown').destroy();
                 *
                 * Destroy objects
                 */
                destroy: function () {
                    window.breeze.registry.delete(name);
                }
            };
        }

        if (parent) {
            parent = prototypes[parent];
        }

        prototype = factory.extend(prototype, parent);
        prototypes[name] = prototype;

        /** @param {Object|Function|String} settings */
        $.fn[name] = function (settings) {
            var result = this,
                args = arguments;

            if ($.isPlainObject(this)) {
                // object without element: $.fn.dataPost().send()
                result = factory.create(prototype, settings, window);
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
                // object initialization: $(el).dropdown({...})
                this.each(function () {
                    var el = this,
                        instance = window.breeze.registry.get(name, el);

                    if (!instance) {
                        instance = factory.create(prototype, settings, el);
                        instance.__name = name;
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

(function () {
    'use strict';

    var widget, view;

    widget = Class.extend({
        create: _.noop,
        init: _.noop,

        /**
         * @param {Object} options
         * @param {Element} element
         * @return {WidgetModel}
         */
        initialize: function (options, element) {
            this.element = $(element);
            this.option(options);
            this.create();
            this.init();

            return this;
        },

        /**
         * @param {Object} options
         */
        option: function (options) {
            if (typeof options === 'string') {
                this.options = options;
            } else {
                this.options = $.extend(true, {}, this.options || {}, options || {});
                this.options = $.extend(true, this.options, this.options.config || {});
            }

            return this;
        },

        /**
         * @param {String} path
         * @return {Mixed}
         */
        path: function (path) {
            return _.get(this.options, path.split('/'));
        }
    });

    view = widget.extend({
        /** [initialize description] */
        initialize: function (options, element) {
            this._super(options, element);
            this.applyBindings(element);
        },

        /** [applyBindings description] */
        applyBindings: function (element) {
            if (!ko.dataFor(element)) {
                ko.applyBindings(this, element);
            }
        }
    });

    window.breeze.widget = window.breeze.component(window.breeze.factory(widget, false));
    window.breeze.view = window.breeze.component(window.breeze.factory(view, true));
})();
