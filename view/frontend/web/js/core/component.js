/* global WeakMap ko _ */
$.registry = $.breeze.registry = (function () {
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

(function () {
    'use strict';

    var Base, Widget, View,
        mapping = {},
        prototypes = {},
        pending = {
            mixins: {},
            components: {}
        };

    /** Class factory */
    function createFactory(Root) {
        return {
            /** Extends Base prototype with Parent or Root */
            extend: function (BasePrototype, Parent) {
                return (Parent || Root).extend(BasePrototype);
            },

            /** Creates a new instance of Base prototype */
            create: function (name, BasePrototype, settings, el) {
                return new BasePrototype(name, settings || {}, el);
            }
        };
    }

    /** [registerComponent description] */
    function registerComponent(factory, fullname, prototype) {
        var name = fullname.split('.').pop();

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

                    if (!instance) {
                        return;
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

        /**
         * Alternative widget access. Example:
         *
         * $.widget('mage.tabs') accessible via $(selector).tabs and $.mage.tabs
         * $.widget('argento.argentoTabs') accessible via $(selector).argentoTabs and $.argento.argentoTabs
         */
        (function () {
            var parts = fullname.split('.'),
                ns = parts.shift(),
                fn = parts.pop();

            if (!ns || !fn) {
                return;
            }

            $[ns] = $[ns] || {};

            /** Alternative widget access. Example: $.mage.tabs */
            $[ns][fn] = function (settings, element) {
                return factory.create(name, prototypes[name], settings, element);
            };
        })();

        if (prototype.prototype.hasOwnProperty('component') && prototype.prototype.component) {
            mapping[prototype.prototype.component] = name;
        }

        return $.fn[name];
    }

    // automatically mount components
    $(document).on('breeze:mount', function (event, data) {
        var alias = mapping[data.__component],
            component;

        if (!alias) {
            return;
        }

        component = prototypes[alias].prototype.component;

        if (component === false) {
            return;
        }

        if (!data.el) {
            $.fn[alias](data.settings);
        } else {
            $(data.el)[alias](data.settings);
            $(data.el).get(0)['breeze:' + component] = $(data.el)[alias]('instance');
        }
    });

    /** Abstract function to create components */
    function createComponent(factory) {
        /**
         * @param {String} fullname
         * @param {String} parent
         * @param {Object} prototype
         * @return {Object}
         */
        function invoke(fullname, parent, prototype) {
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
                        var collection = $.breeze.registry.get(name);

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
                        $.breeze.registry.delete(name);
                    }
                };
            }

            if (parent) {
                if (!prototypes[parent]) {
                    // eslint-disable-next-line max-depth
                    if (!pending.components[parent]) {
                        pending.components[parent] = [];
                    }

                    // delay component creation until parent will be created too
                    pending.components[parent].push({
                        fullname: fullname,
                        parent: parent,
                        prototype: prototype
                    });

                    return;
                }

                parent = prototypes[parent];
            }

            prototype = factory.extend(prototype, parent);
            prototypes[name] = prototype;

            // apply pending mixins
            if (pending.mixins[name]) {
                $.each(pending.mixins[name], function () {
                    $.mixin(name, this);
                });
                delete pending.mixins[name];
            }

            // create pending components
            if (pending.components[name]) {
                $.each(pending.components[name], function () {
                    invoke(this.fullname, this.parent, this.prototype);
                });
                delete pending.components[name];
            }

            return registerComponent(factory, fullname, prototype);
        }

        return invoke;
    }

    Base = Class.extend({
        create: _.noop,
        init: _.noop,
        destroy: _.noop,
        _create: _.noop,
        _init: _.noop,
        _trigger: _.noop,

        /**
         * @param {Object} options
         * @return {Base}
         */
        _initialize: function (options) {
            this._options(options);
            this._defaults(this.options);
            this._trigger('beforeCreate');
            this.create();
            this._create();
            this.init();
            this._init();
            this._trigger('afterCreate');

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
        option: function (key, defaults) {
            if (!key) {
                return $.extend(true, {}, this.options);
            }

            return this._option(key.replace(/\./g, '/'), defaults);
        },

        /**
         * @param {String} key
         * @param {Mixed} value
         */
        _setOption: function (key, value) {
            this.options[key] = value;

            return this;
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

            return this._super(options);
        },

        /**
         * @param {String} event
         * @param {Object} data
         */
        _trigger: function (event, data) {
            data = data || {};
            data.instance = this;
            this.element.trigger(this.__name + ':' + event, data);
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
                    element.on(eventName, selector, function (e) {
                        e.handleObj = {
                            selector: selector
                        };

                        handler(e);
                    });
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
            // @see main.js
            $.breeze.mount(config.component, {
                el: this.element,
                settings: config
            }, true);

            return this.element.get(0)['breeze:' + config.component];
        }
    });

    $.Base = $.breeze.Base = Base;
    $.widget = $.breeze.widget = createComponent(createFactory(Widget));
    $.view = $.breeze.view = createComponent(createFactory(View));

    /** Wrap prototype with mixins */
    $.mixin = function (name, mixins) {
        if (!prototypes[name]) {
            if (!pending.mixins[name]) {
                pending.mixins[name] = [];
            }

            return pending.mixins[name].push(mixins);
        }

        _.each(mixins, function (mixin, key) {
            var proto = prototypes[name].prototype,
                mixinType = typeof mixin,
                originalType = typeof proto[key];

            if (mixinType === 'function' && originalType === 'function') {
                proto[key] = _.wrap(proto[key], function () {
                    arguments[0] = arguments[0].bind(this);

                    return mixin.apply(this, _.toArray(arguments));
                });
            } else if (mixinType === 'object' && originalType === 'object') {
                proto[key] = _.extend({}, proto[key], mixin);
            } else {
                proto[key] = mixin;
            }
        });
    };
})();
