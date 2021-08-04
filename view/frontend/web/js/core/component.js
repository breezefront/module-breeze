/* global WeakMap ko _ */
window.breeze = window.breeze || {};
$.registry = window.breeze.registry = (function () {
    'use strict';

    var data = {};

    return {
        /**
         * @param {String} name
         * @param {Element} element
         * @return {Mixed}
         */
        get: function (name, element) {
            var result = [];

            if (!data[name] || !data[name].objects) {
                return data[name];
            }

            if (element) {
                return data[name].objects.get(element);
            }

            $.each(data[name].elements, function (index, el) {
                var instance = $.registry.get(name, el);

                if (!instance) {
                    return;
                }

                result.push(instance);
            });

            return result;
        },

        /**
         * @param {String} name
         * @param {Element} element
         * @param {Object} component
         */
        set: function (name, element, component) {
            if (!data[name] && component) {
                data[name] = {
                    objects: new WeakMap(),
                    elements: []
                };
            }

            if (!component) {
                data[name] = element; // element is a component here
            } else {
                data[name].objects.set(element, component);
                data[name].elements.push(element);
            }
        },

        /**
         * @param {String} name
         * @param {Element} element
         */
        delete: function (name, element) {
            var instance, index;

            if (name && element) {
                instance = data[name].objects.get(element);
                index = data[name].elements.indexOf(element);

                if (index !== -1) {
                    data[name].elements.splice(index, 1);
                }

                if (instance && instance.destroy) {
                    instance.destroy();
                }

                return data[name].objects.delete(element);
            }

            if (name) {
                return $.each(data[name].elements, function (i, el) {
                    $.registry.delete(name, el);
                });
            }

            $.each(data, function (t) {
                $.each(data[t].elements || [], function (i, el) {
                    $.registry.delete(t, el);
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
            var instance, key, exists = false;

            settings = settings || {};
            key = settings.__scope;
            instance = registry[key];

            if (instance && instance.element) {
                exists = $('body').has(instance.element.get(0)).length > 0;

                if (!exists) {
                    instance.destroy();
                    instance = false;
                    delete registry[key];
                }
            }

            if (singleton && instance && instance.element) {
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

$.prototypes = {};

/** Abstract function to create components */
window.breeze.component = function (factory) {
    'use strict';

    return function (fullname, parent, prototype) {
        var name = fullname.split('.').pop();

        if (!prototype) {
            prototype = parent;
            parent = undefined;
        }

        if (typeof prototype === 'undefined') {
            return {
                /**
                 * Example:
                 *
                 *     $.view('messages').invoke('removeCookieMessages');
                 *     $.widget('dropdown').invoke('close');
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
                 *     $.view('messages').destroy();
                 *     $.widget('dropdown').destroy();
                 *
                 * Destroy objects
                 */
                destroy: function () {
                    window.breeze.registry.delete(name);
                }
            };
        }

        if (parent) {
            if (!$.prototypes[parent]) {
                throw new Error(name + ': Parent component is not found: ' + parent);
            }
            parent = $.prototypes[parent];
        }

        prototype = factory.extend(prototype, parent);
        $.prototypes[name] = prototype;

        if (prototype.prototype.hasOwnProperty('component')) {
            $(document).on('breeze:mount:' + prototype.prototype.component, function (event, data) {
                var component = prototype.prototype.component;

                if (!data.el) {
                    $.fn[name](data.settings);
                } else {
                    $(data.el)[name](data.settings);
                    $(data.el).get(0)['breeze:' + component] = $(data.el)[name]('instance');
                }
            });
        }

        /** @param {Object|Function|String} settings */
        $.fn[name] = function (settings) {
            var result = this,
                args = arguments;

            if ($.isPlainObject(this)) {
                // object without element: $.fn.dataPost().send()
                result = factory.create(name, prototype, settings, window);
            } else if (typeof settings === 'string') {
                // object instance or method: $(el).dropdown('open')
                args = Array.prototype.slice.call(args, 1);

                if (settings === 'instance') {
                    result = undefined;
                }

                this.each(function () {
                    var tmp,
                        instance = $.registry.get(name, this);

                    if (settings === 'instance') {
                        if (!instance) {
                            return;
                        }

                        result = instance;

                        return false;
                    }

                    tmp = instance[settings].apply(instance, args);

                    if (tmp !== instance && tmp !== undefined) {
                        result = tmp;

                        return false;
                    }
                });
            } else {
                // object initialization: $(el).dropdown({...})
                this.each(function () {
                    var el = this,
                        instance = $.registry.get(name, el);

                    if (!instance) {
                        instance = factory.create(name, prototype, settings, el);
                    } else {
                        instance._options(settings).init();
                    }
                });
            }

            return result;
        };

        (function () {
            var tmp,
                parts = fullname.split('.'),
                ns = parts.shift(),
                fn = parts.pop();

            $[ns] = $[ns] || {};
            tmp = $[ns];

            $.each(parts, function (key) {
                tmp = tmp[key] || {};
            });

            /** Alternative widget access. Example: $.mage.tabs */
            tmp[fn] = function (settings, element) {
                return factory.create(name, $.prototypes[name], settings, element);
            };
        })();

        return $.fn[name];
    };
};

(function () {
    'use strict';

    var Base, Widget, View;

    Base = Class.extend({
        create: _.noop,
        _create: _.noop,
        init: _.noop,
        _init: _.noop,
        destroy: _.noop,

        /**
         * @param {Object} options
         * @return {Base}
         */
        _initialize: function (options) {
            this._options(options);
            this._defaults(this.options);
            this.create();
            this._create();
            this.init();
            this._init();

            return this;
        },

        /**
         * @param {Object} values
         */
        _defaults: function (values) {
            var self = this;

            _.each(this.defaults || {}, function (value, key) {
                self[key] = _.has(values, key) ? values[key] : value;
            });
        },

        /**
         * @param {Object} options
         */
        _options: function (options) {
            if (typeof options === 'string') {
                this.options = options;
            } else {
                this.options = $.extendProps(options || {}, this.options || {});
                this.options = $.extendProps(this.options.config || {}, this.options);
            }

            return this;
        },

        /**
         * @param {String} path
         * @return {Mixed}
         */
        _option: function (path, defaults) {
            return _.get(this.options, path.split('/'), defaults);
        },

        /**
         * @param {String|Object} key
         * @return {Mixed}
         */
        option: function (key) {
            if (!key) {
                return $.extend(true, {}, this.options);
            }

            return this._option(key.replace(/\./g, '/'));
        }
    });

    Widget = Base.extend({
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

            $.registry.set(name, element, this);

            this._options(options);
            this._defaults(options);
            this._trigger('beforeCreate');
            this.create();
            this._create();
            this.init();
            this._init();
            this._trigger('afterCreate');

            return this;
        },

        /**
         * @param {String} event
         * @param {Object} data
         */
        _trigger: function (event, data) {
            this.element.trigger(this.__name + ':' + event, $.extend({
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

    View = Widget.extend({
        beforeRender: _.noop,
        afterRender: _.noop,

        /** [initialize description] */
        _initialize: function (name, options, element) {
            this._regions = {};
            this._markup = $(element).html();
            this._super(name, options, element);

            if (window.requestIdleCallback) {
                window.requestIdleCallback(this._applyBindings.bind(this, element));
            } else {
                window.setTimeout(this._applyBindings.bind(this, element), 1);
            }
        },

        /** [applyBindings description] */
        _applyBindings: function (element) {
            if (!ko.dataFor(element)) {
                if (this.beforeRender() === false) {
                    return;
                }

                ko.applyBindings(this, element);
                $(element).trigger('contentUpdated');
                this.afterRender();
            }
        },

        /** destroy implementation */
        destroy: function () {
            // Restore initial markup that is used as a template in knockout
            this.element.html(this._markup);
        },

        /**
         * @param {Object} values
         */
        _defaults: function (values) {
            var self = this;

            this._super(values);

            _.each(values, function (value, key) {
                self[key] = value;
            });
        },

        /** [getTemplate description] */
        getTemplate: function () {
            return (this.template || this.options.template).replace(/\//g, '_');
        },

        /** [getRegion description] */
        getRegion: function (code) {
            var self = this,
                result = ko.observableArray();

            if (this._regions[code]) {
                return this._regions[code];
            }

            _.each(this.options.children, function (config) {
                if (config.displayArea !== code) {
                    return;
                }

                result.push(self.mount(config));
            });

            this._regions[code] = result;

            return result;
        },

        /** [mount description] */
        mount: function (config) {
            $(document).trigger('breeze:mount:' + config.component, {
                el: this.element,
                settings: config
            });

            return this.element.get(0)['breeze:' + config.component];
        }
    });

    $.Base = window.breeze.Base = Base;
    $.widget = window.breeze.widget = window.breeze.component(window.breeze.factory(Widget, false));
    $.view = window.breeze.view = window.breeze.component(window.breeze.factory(View, false));

    /** Wrap prototype with mixins */
    $.mixin = function (name, mixins) {
        _.each(mixins, function (mixin, key) {
            if (!$.prototypes[name]) {
                return;
            }

            $.prototypes[name].prototype[key] = _.wrap($.prototypes[name].prototype[key], function () {
                arguments[0] = arguments[0].bind(this);

                return mixin.apply(this, _.toArray(arguments));
            });
        });
    };
})();
