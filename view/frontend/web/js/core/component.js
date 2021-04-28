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
        create: function (name, Base, settings, el) {
            var instance, key;

            settings = settings || {};
            key = settings.__scope;

            if (singleton && key && registry[key]) {
                registry[key]._applyBindings(el);
            } else {
                instance = new Base(name, settings, el);

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
                result = factory.create(name, prototype, settings, window);
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
                        instance = factory.create(name, prototype, settings, el);
                        window.breeze.registry.set(name, el, instance);
                    } else {
                        instance._options(settings).init();
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
         * @param {String} name
         * @param {Object} options
         * @param {Element} element
         * @return {WidgetModel}
         */
        _initialize: function (name, options, element) {
            this.__name = name;
            this.__eventNamespace = '.' + name;
            this.__bindings = $(); // @todo: _destroy
            this.element = $(element);
            this._options(options);
            this.create();
            this.init();
            this._trigger('create');

            return this;
        },

        /**
         * @param {Object} options
         */
        _options: function (options) {
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
        _option: function (path) {
            return _.get(this.options, path.split('/'));
        },

        /**
         * @param {String} event
         * @param {Object} data
         * @param {Cash} element
         */
        _trigger: function (event, data, element) {
            (element || this.element).trigger(this.__name + ':' + event, $.extend({
                instance: this
            }, data));
        },

        /**
         * @param {Element|Object} element
         * @param {Object} handlers
         */
        _on: function (element, handlers) {
            var self = this;

            if (!handlers) {
                handlers = element;
                element = this.element;
            } else {
                element = $(element);
                this.__bindings.add(element);
            }

            $.each(handlers, function (event, handler) {
                var match = event.match(/^([\w:-]*)\s*(.*)$/),
                    eventName = match[1] + self.__eventNamespace,
                    selector = match[2];

                if (typeof handler === 'string') {
                    handler = self[handler];
                }

                handler = handler.bind(self);

                if (selector) {
                    element.on(eventName, selector, handler);
                } else {
                    element.on(eventName, handler);
                }
            });
        },

        /**
         * @param {Element} element
         * @param {String} eventName
         */
        _off: function (element, eventName) {
            if (!eventName) {
                eventName = element;
                element = this.element;
            }

            eventName =
                (eventName || '').split(' ').join(this.__eventNamespace + ' ') +
                this.__eventNamespace;

            element.off(eventName);

            this.__bindings = $(this.__bindings.not(element).get());
        }
    });

    view = widget.extend({
        /** [initialize description] */
        _initialize: function (name, options, element) {
            this._super(name, options, element);
            this._applyBindings(element);
        },

        /** [applyBindings description] */
        _applyBindings: function (element) {
            if (!ko.dataFor(element)) {
                ko.applyBindings(this, element);
            }
        }
    });

    window.breeze.widget = window.breeze.component(window.breeze.factory(widget, false));
    window.breeze.view = window.breeze.component(window.breeze.factory(view, true));
})();
