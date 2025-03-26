(function () {
    'use strict';

    var prototypes = {},
        pending = {
            mixins: {},
            components: {}
        };

    $.createComponentFn = function (BaseClass) {
        var componentFn, registerFn, factory;

        factory = {
            /** Extends Base prototype with Parent or BaseClass */
            extend: function (BasePrototype, Parent) {
                return (Parent || BaseClass).extend(BasePrototype);
            },

            /** Creates a new instance of Base prototype */
            create: function (name, BasePrototype, settings, el) {
                return new BasePrototype(name, settings || {}, el);
            }
        };

        registerFn = function (fullname, prototype) {
            var parts = fullname.split('.'),
                name = parts.pop(),
                ns = parts.shift(),
                constructor;

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

            constructor = (settings, element) => $(element || '<div>')[name](settings)[name]('instance');
            constructor._proto = prototype;
            constructor.prototype = prototype.prototype;
            constructor.extend = obj => componentFn(
                obj.component || `__component${$.breezemap.__counter++}`,
                prototype,
                obj
            );
            $.breezemap[name] = constructor;

            if (prototype.prototype.hasOwnProperty('component') &&
                prototype.prototype.component &&
                prototype.prototype.component !== name
            ) {
                $.breezemap[prototype.prototype.component] = constructor;
                $.breezemap.__aliases[prototype.prototype.component] = name;
            }

            if (ns) {
                $[ns] = $[ns] || {};
                $[ns][name] = constructor;
            }

            return constructor;
        };

        /**
         * @param {String} fullname
         * @param {String} parent
         * @param {Object} prototype
         * @return {Object}
         */
        componentFn = function (fullname, parent, prototype) {
            var name = fullname.split('.').pop(),
                pendingComponents = [];

            if (!prototype) {
                prototype = parent;
                parent = undefined;
            }

            if (typeof prototype === 'undefined') {
                return {
                    /**
                     * Examples:
                     *     $.widget('dropdown').each(dropdown => {});
                     *
                     * @param {Function} callback
                     */
                    each: function (callback) {
                        $.registry.get(name)?.forEach(callback);
                    },

                    /**
                     * Examples:
                     *     $.view('messages').invoke('removeCookieMessages');
                     *     $.widget('dropdown').invoke('close');
                     *
                     * @param {String} method
                     */
                    invoke: function (method) {
                        $.registry.get(name)?.forEach(function (instance) {
                            if (instance[method]) {
                                instance[method]();
                            }
                        });
                    },

                    /**
                     * Examples:
                     *     $.view('messages').destroy();
                     *     $.widget('dropdown').destroy();
                     *
                     * Destroy objects
                     */
                    destroy: function () {
                        $.registry.delete(name);
                    }
                };
            }

            if (typeof parent === 'string') {
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
            } else if (parent && parent._proto) {
                parent = parent._proto;
            }

            prototype = factory.extend(prototype, parent);
            prototypes[name] = prototype;

            // create pending components
            if (pending.components[name]) {
                pendingComponents = pending.components[name];
                delete pending.components[name];
                $.each(pendingComponents, function () {
                    componentFn(this.fullname, this.parent, this.prototype);
                });
            }

            return registerFn(fullname, prototype);
        };

        return componentFn;
    };

    $.Base = Class.extend({
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
            this.initConfig(options);
            this._trigger('beforeCreate');
            this.initialize(this.options, this.__element?.[0]);
            this.create();
            this._create();
            this.init();
            this._init();
            this._trigger('afterCreate');

            return this;
        },

        initialize: function () {
            return this;
        },

        initConfig: function () {
            return this;
        },

        _defaults: function (values) {
            var defaults = this._processDefaults(this.defaults || {}, _.extend({}, this.defaults, this.options));

            _.each(defaults, (value, key) => {
                if ($.isPlainObject(values[key]) && $.isPlainObject(value)) {
                    this[key] = $.extendProps(values[key], value);
                } else {
                    this[key] = $.copyProp(_.has(values, key) ? values[key] : value);
                }
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

            this.options = this._processDefaults(this.options || {}, _.extend({}, this.defaults, this.options));

            return this;
        },

        _processDefaults: function (obj) {
            return obj;
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

    $.Widget = $.Base.extend({
        /**
         * @param {String} name
         * @param {Object} options
         * @param {Element} element
         * @return {WidgetModel}
         */
        _initialize: function (name, options, element) {
            this.__name = name;
            this.__uuid = $.guid++;
            this.__eventNamespace = '.' + name + this.__uuid;
            this.__bindings = $();
            this.__element = $(element);
            this.uuid = this.__uuid;
            this.element = $(element);
            this.__element.one(`${this.__name}:beforeCreate`, () => {
                this.element.component(name, this);
                $.registry.set(name, element, this);
            });

            return this._super(options);
        },

        /**
         * @param {Cash} element
         * @param {Object} options
         * @return {Object} https://github.com/focus-trap/focus-trap
         */
        createFocusTrap: function (element, options) {
            if (!element) {
                element = this.__element;
            }

            return $.breeze.focusTrap.createFocusTrap(element.get(0), options);
        },

        onReveal: function (element, callback) {
            if (!callback) {
                callback = element;
                element = this.__element;
            }

            return $.onReveal(element, callback);
        },

        /**
         * @param {String} event
         * @param {Object} data
         */
        _trigger: function (event, data) {
            data = data || {};
            data.instance = this;
            this.__element.trigger(this.__name + ':' + event, data);

            if (typeof this.options[event] === 'function') {
                this.options[event].apply(this.__element[0], data);
            }
        },

        /**
         * ._on('body', 'click .class', fn)
         * ._on('body', { 'click .class': fn })
         * ._on('click .class', fn)      // events inside this.element only
         * ._on({ 'click .class': fn })  // events inside this.element only
         *
         * @param {Element|Object|String} element
         * @param {Object|Function|String} event
         * @param {Function} handler
         */
        _on: function (element, event, handler) {
            var self = this,
                handlers = {},
                el = this.__element;

            if (handler) { // on('body', 'click', fn)
                handlers[event] = handler;
                el = $(element);
                this.__bindings = this.__bindings.add(el);
            } else if (typeof event === 'object') { // on('body', { click: fn })
                handlers = event;
                el = $(element);
                this.__bindings = this.__bindings.add(el);
            } else if (typeof event === 'function') { // on('click .class', fn)
                handlers[element] = event;
            } else { // on({ 'click .class': fn })
                handlers = element;
            }

            $.each(handlers, function (eventAndSelector, fn) {
                var match = eventAndSelector.match(/^([\w:-]*)\s*(.*)$/),
                    eventName = match[1] + self.__eventNamespace,
                    selector = match[2];

                if (typeof fn === 'string') {
                    fn = self[fn];
                }

                fn = fn.bind(self);

                if (selector) {
                    el.on(eventName, selector, function (e) {
                        e.handleObj = {
                            selector: selector,
                            el: this,
                        };

                        fn(e);
                    });
                } else {
                    el.on(eventName, fn);
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
                element = this.__element;
            }

            eventName =
                (eventName || '').split(' ').join(this.__eventNamespace + ' ') +
                this.__eventNamespace;

            element.off(eventName);
        },

        /** Destroy all event listeners */
        destroy: function () {
            this.focusTrap?.deactivate();
            this.revealObserver?.disconnect();

            this.__element.off(this.__eventNamespace);
            this.__bindings.off(this.__eventNamespace);
            this._super();

            $.registry.delete(this.__name, this.__element[0], true);
        }
    });

    $.View = $.Widget.extend({
        beforeRender: _.noop,
        afterRender: _.noop,

        _initialize: function (name, options, element) {
            this._elems = [];
            if (!$(element).is('body')) {
                this._markup = $(element).html();
            }
            this._super(name, options, element);
            this._fixMissingElementInKoTemplates();

            if (this.provider) {
                $.breezemap.uiRegistry.get(this.provider, provider => {
                    this.source = provider;
                });
            }

            if (this.deps) {
                Promise.all(
                    this.deps.filter(v => v).map(v => $.breezemap.uiRegistry.promise(v))
                ).then(() => this._applyBindings.bind(this, element)());
            } else {
                window.setTimeout(this._applyBindings.bind(this, element), 0);
            }
        },

        initialize: function () {
            return this.initObservable();
        },

        initObservable: function () {
            this.elems = ko.observableArray();
            return this;
        },

        // Fix for UI form:
        // 1. foreach: elems as 'element'
        // 2. element.hasAddons
        _fixMissingElementInKoTemplates: function () {
            var html = this.hasTemplate() && document.getElementById(this.getTemplate())?.innerHTML;

            if (!html) {
                return;
            }

            if (html.includes('element.') || html.includes('\'element\'')) {
                delete this.element;
            }
        },

        _applyBindings: async function (element) {
            var koEl = element.firstChild;

            if (element === document.body) {
                return;
            }

            await this._resolveChildren();
            this._initElems();

            while (koEl) {
                if (koEl.nodeType === 1 || (koEl.nodeType === 8 && koEl.nodeValue.match(/\s*ko\s+/))) {
                    break;
                }
                koEl = koEl.nextSibling;
            }

            if (!koEl || !ko.dataFor(koEl)) {
                if (!element.isConnected || this.beforeRender() === false) {
                    return;
                }

                ko.applyBindingsToDescendants(this, element);
                $(element).trigger('contentUpdated');
                this.afterRender();
            }
        },

        _resolveChildren: function () {
            return Promise.all(Object.values(this.options.children || {})
                .filter(config => config.component)
                .map(config => {
                    return new Promise(resolve => require([config.component], resolve));
                }));
        },

        _initElems: function () {
            var children = this.options.children || {};

            Object.keys(children).sort((a, b) => {
                return (children[a].sortOrder || 1000000) - (children[b].sortOrder || 1000000);
            }).forEach(key => {
                var cmp, config = children[key];

                if (!config.component) {
                    return;
                }

                config.index = key;
                cmp = this.mount(config);

                if (!cmp) {
                    return;
                }

                this._elems.push(cmp);
            });

            this._updateCollection();
        },

        _updateCollection: function () {
            this._elems.forEach(el => {
                var displayArea = el.displayArea || null;

                [...new Set([null, displayArea])].forEach(regionCode => {
                    if (regionCode && displayArea !== regionCode) {
                        return;
                    }
                    this.getRegion(regionCode).push(el);
                });
            });

            this.elems(this._elems);
        },

        insertChild: function (elems) {
            if (!_.isArray(elems)) {
                elems = [elems];
            }
            this._elems.push(...elems);
            this._updateCollection();
            return this;
        },

        getRegion: function (name) {
            name = name || null;
            this.regions = this.regions || {};
            this.regions[name] = this.regions[name] || ko.observableArray();
            return this.regions[name];
        },

        destroy: function () {
            // Restore initial markup that is used as a template in knockout
            if (!this.__element.is('body')) {
                this.__element.html(this._markup);
            }
            this._super();
        },

        _defaults: function (values) {
            this._super(values);

            _.each(values, (value, key) => {
                if (!_.has(this, key)) {
                    this[key] = $.copyProp(value);
                }
            });
        },

        observe: function (items) {
            if (typeof items === 'string') {
                items = items.split(' ');
            }

            $.each(items, (key, value) => {
                if (typeof key !== 'string') {
                    key = value;
                    value = ko.isObservable(this[value]) ? this[value]() : this[value];
                }

                if (ko.isObservable(this[key])) {
                    this[key](value);
                } else {
                    this[key] = _.isArray(value) ? ko.observableArray(value) : ko.observable(value);
                }
            });

            return this;
        },

        hasTemplate: function () {
            return this.template || this.options.template;
        },

        getTemplate: function () {
            var template = this.template || this.options.template,
                templates = [
                    template.replace(/[/.]/g, '_'),
                    template.replace(/\//g, '_'),
                    template + '.html',
                    template,
                ],
                found = _.find(templates, (id) => document.getElementById(id));

            return found || templates[0];
        },

        mount: function (config) {
            var element = $('<div>');

            if (this.dataScope) {
                config.dataScope = [this.dataScope, config.dataScope].join('.');
            }

            config = _.extend({
                parentName: this.__scope,
                parentScope: this.index,
                dataScope: '',
            }, config);

            if (config.index) {
                config = _.extend({
                    __scope: [this.__scope, config.index].filter(v => v).join('.'),
                    name: [this.__scope, config.index].filter(v => v).join('.'),
                }, config);
            }

            $.breeze.mount(config.component, {
                el: element,
                settings: config
            }, true);

            return element.component(config.component);
        }
    });

    $.widget = $.createComponentFn($.Widget);
    $.view = $.createComponentFn($.View);
    $.uiComponent = {
        extend: function (proto) {
            return $.view(proto.component || `__component${$.breezemap.__counter++}`, proto);
        },
        register: $.breezemap.__register,
    };
    $.breezemap.uiCollection = $.uiComponent;
    $.breezemap.uiComponent = $.uiComponent;
    $.breezemap.uiElement = $.uiComponent;
    $.breezemap.uiClass = $.Base;

    /** Wrap prototype with mixins */
    $.mixin = function (name, mixins, useSuper) {
        var proto = name,
            wrapper = $.breezemap['mage/utils/wrapper'];

        if (typeof name === 'string') {
            proto = prototypes[name]?.prototype || $.breezemap[name]?._proto?.prototype || $.breezemap[name];
        }

        if (!proto) {
            if (!$.mixin.pending[name]) {
                $.mixin.pending[name] = [];
            }

            return $.mixin.pending[name].push([name, mixins, useSuper]);
        } else if (typeof proto === 'function' && typeof mixins === 'function') {
            mixins = [mixins];
            proto = [proto];
        }

        _.each(mixins, function (mixin, key) {
            var mixinType = typeof mixin,
                originalType = typeof proto[key];

            if (mixinType === 'function' && originalType === 'function') {
                if (useSuper) {
                    proto[key] = wrapper.wrapSuper(proto[key], mixin);
                } else {
                    proto[key] = wrapper.wrap(proto[key], mixin);
                }
            } else if (mixinType === 'object' && originalType === 'object') {
                proto[key] = _.extend({}, proto[key], mixin);
            } else {
                proto[key] = mixin;
            }
        });
    };
    $.mixin.pending = {};
    $.mixinSuper = (name, mixins) => $.mixin(name, mixins, true);
})();
