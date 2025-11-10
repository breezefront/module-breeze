(function () {
    'use strict';

    function observable(obj, key, value) {
        var method = Array.isArray(value) ? 'observableArray' : 'observable';

        if (_.isFunction(obj[key]) && !ko.isObservable(obj[key])) {
            return;
        }

        if (ko.isObservable(value)) {
            value = value();
        }

        ko.isObservable(obj[key]) ?
            obj[key](value) :
            obj[key] = ko[method](value);
    }

    function accessor(obj, key, value) {
        if (_.isFunction(obj[key]) || ko.isObservable(obj[key])) {
            return;
        }

        obj[key] = value;

        if (!ko.es5.isTracked(obj, key)) {
            ko.track(obj, [key]);
        }
    }

    $.View = $.Widget.extend({
        defaults: {
            name: '',
            provider: '',
            _requested: {},
            tracks: {},
            template: 'uiComponent'
        },

        beforeRender: _.noop,
        afterRender: _.noop,

        _initialize: function (name, options, element) {
            this._elems = [];
            if (!$(element).is('body')) {
                this._markup = $(element).html();
            }
            this._super(name, options, element);
            delete this.element;

            if (this.deps) {
                if (typeof this.deps === 'string') {
                    this.deps = [this.deps];
                }
                Promise.all(
                    this.deps.filter(v => v).map(async v => {
                        if (v.startsWith(this.__scope)) {
                            await this._processChildren();
                        }
                        return $.breezemap.uiRegistry.promise(v)
                    })
                ).then(() => this._applyBindings.bind(this, element)());
            } else {
                window.setTimeout(this._applyBindings.bind(this, element), 0);
            }
        },

        initialize: function () {
            return this.initObservable().initModules().initLinks();
        },

        initObservable: function () {
            _.each(this.tracks, (enabled, key) => {
                if (enabled) {
                    this.track(key);
                }
            });

            this.elems = ko.observableArray();
            return this;
        },

        _applyBindings: async function (element) {
            var koEl = element.firstChild;

            if (element === document.body) {
                return;
            }

            await this._processChildren();

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

        _processChildren: async function () {
            if (!this._childrenProcessed) {
                this._childrenProcessed = true;
                await this._resolveChildren();
                this._initElems();
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
            var children = this.options.children || {},
                components = [];

            Object.keys(children).sort((a, b) => {
                return (children[a].sortOrder || 1000000) - (children[b].sortOrder || 1000000);
            }).forEach(async key => {
                var cmp, config = children[key];

                if (this.hasChild(key)) {
                    return;
                }

                config.component = config.component || 'uiComponent';
                config.index = key;
                cmp = this.mount(config);

                if (!cmp) {
                    return;
                }

                components.push(cmp);
            });

            this.insertChild(components);
        },

        _updateCollection: function () {
            this.regions = {};

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

            return this;
        },

        hasChild: function (index) {
            return !!this.getChild(index);
        },

        getChild: function (index) {
            return _.findWhere(this._elems, { index });
        },

        insertChild: function (elems) {
            if (!_.isArray(elems)) {
                elems = [elems];
            }
            this._elems.push(...elems);
            this._updateCollection();
            elems.forEach(el => {
                this.initElement(el);
            });

            return this;
        },

        initElement: function () {
            return this;
        },

        regionHasElements: function (name) {
            return this.getRegion(name)().length > 0;
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
                if (value !== undefined && !_.has(this, key)) {
                    this[key] = $.copyProp(value);
                }
            });
        },

        _processDefaults: function (obj) {
            return this._renderLiterals(obj, _.extend({}, this.defaults, this.options));
        },

        observe: function (useAccessors, items) {
            var trackMethod;

            if (typeof useAccessors !== 'boolean') {
                items = useAccessors;
                useAccessors = false;
            }

            if (typeof items === 'string') {
                items = items.split(' ');
            }

            trackMethod = useAccessors ? accessor : observable;

            $.each(items, (key, value) => {
                if (typeof key !== 'string') {
                    key = value;
                    value = ko.isObservable(this[value]) ? this[value]() : this[value];
                }
                trackMethod(this, key, value);
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

            return found || template;
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

            if (config.dataScope) {
                config.parentScope = config.dataScope.substr(0, config.dataScope.lastIndexOf('.'));
            }

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

            return element.component(config.__scope || config.component);
        },

        track: function (properties) {
            return this.observe(true, properties);
        },

        isTracked: function (property) {
            return ko.es5.isTracked(this, property);
        },

        initModules: function () {
            _.each(this.modules, (name, property) => {
                if (name) {
                    this[property] = this.requestModule(name);
                }
            });

            if (this.provider && !this.source) {
                $.breezemap.uiRegistry.get(this.provider, provider => {
                    this.source = provider;
                });
            }

            return this;
        },

        requestModule: function (name) {
            var requested = this._requested;

            if (!requested[name]) {
                requested[name] = $.breezemap.uiRegistry.async(name);
            }

            return requested[name];
        },

        initLinks: function () {
            _.each(this.listens || {}, (cb, name) => {
                if (typeof this[cb] === 'function') {
                    this.on(name, this[cb].bind(this));
                }
            });

            this.setLinks(this.links, 'imports')
                .setLinks(this.links, 'exports')
                .setLinks(this.imports, 'imports')
                .setLinks(this.exports, 'exports');

            return this;
        },

        setLinks: function (links, direction) {
            var isImport = direction === 'imports';

            _.each(links || {}, (val, key) => {
                var valScope, valPath, keyScope, keyPath;

                [valScope, valPath] = val.includes(':') ? val.split(':') : [this.__scope, val];
                [keyScope, keyPath] = key.includes(':') ? key.split(':') : [this.__scope, key];
                valScope = valScope || this.__scope;
                keyScope = keyScope || this.__scope;

                $.breezemap.uiRegistry.get(valScope, valCmp => {
                    $.breezemap.uiRegistry.get(keyScope, keyCmp => {
                        var source = isImport ? valCmp : keyCmp,
                            sourceKey = isImport ? valPath : keyPath,
                            value = source.get(sourceKey),
                            update = isImport ? (v) => keyCmp.set(keyPath, v) : (v) => valCmp.set(valPath, v);

                        if (ko.isObservable(value)) {
                            value.subscribe(update);
                        } else if (ko.es5.isTracked(source, sourceKey)) {
                            ko.getObservable(source, sourceKey).subscribe(update);
                        } else {
                            source.on(sourceKey, update);
                        }

                        if (_.isFunction(value)) {
                            value = value();
                        }

                        if (typeof value !== 'undefined' && value != null) {
                            update(value);
                        }
                    });
                });
            });

            return this;
        },

        on: function (name, callback) {
            var [scope, event] = name.includes(':') ? name.split(':') : [this.__scope, name];

            scope = scope || this.__scope;
            $.breezemap.uiRegistry.get(scope, cmp => {
                if (cmp[event] && ko.isObservable(cmp[event])) {
                    cmp[event].subscribe(callback);
                } else if (cmp[event] && ko.es5.isTracked(cmp, event)) {
                    ko.getObservable(cmp, event).subscribe(callback);
                } else {
                    cmp._on(cmp.__name + ':' + event.replaceAll('.', '_'), (e, data) => {
                        callback(data.value);
                    });
                }
            });

            return this;
        },

        trigger: function (name, data) {
            var [scope, event] = name.includes(':') ? name.split(':') : [this.__scope, name];

            $.breezemap.uiRegistry.get(scope, cmp => {
                event += '.';
                do {
                    event = event.substring(0, event.lastIndexOf('.'));
                    cmp._trigger(event.replaceAll('.', '_'), data);
                    data.value = this.get(event.substring(0, event.lastIndexOf('.')));
                } while (event.includes('.'));
            });
        },

        bubble: function () {
            return false;
        },

        set: function (path, value) {
            var parts = path.split('.'),
                last = parts.pop(),
                target = parts.length ? this.get(parts.join('.')) : this;

            if (_.isUndefined(target)) {
                target = this;
                parts.forEach(key => {
                    target[key] = target[key] || {};
                    target = target[key];
                });
            }

            if (_.isFunction(target[last])) {
                target[last](value);
            } else if ($.isPlainObject(value)) {
                _.each(value, (val, key) => {
                    this.trigger(`${path}.${key}`, { value: val });
                });
                this.trigger(path, { value });
            } else if (target[last] != value) { // eslint-disable-line eqeqeq
                target[last] = value;
                this.trigger(path, { value });
            }

            return this;
        },

        get: function (path) {
            var result = _.get(this, path.split('.'));

            return ko.isObservable(result) ? result() : result;
        },

        _renderLiterals: function (obj, context, canIgnore = true) {
            var result;

            if ($.isPlainObject(obj) || _.isArray(obj)) {
                result = $.isPlainObject(obj) ? {} : [];
                _.each(obj, (val, key) => {
                    if (['children', 'dictionaries'].includes(key) || canIgnore && context.ignoreTmpls?.[key]) {
                        result[key] = val;
                    } else {
                        if (_.isString(key) && key.includes('${')) {
                            key = this._renderLiterals(key, context, false);
                        }
                        result[key] = this._renderLiterals(val, context, false);
                    }
                });
            } else if (_.isString(obj) && obj.includes('${') && !obj.includes('${{')) {
                // this part is taken from lib/web/mage/utils/template.js
                result = obj;
                while (result.includes('${')) {
                    result = (function (t, $) { // eslint-disable-line no-unused-vars
                        return eval('`' + t + '`'); // eslint-disable-line no-eval
                    })(result, context);
                }
            } else {
                result = obj;
            }

            return result;
        },

        hasAddons: () => false,
    });

    $.view = $.createComponentFn($.View);
    $.uiComponent = {
        extend: function (proto) {
            return $.view(proto.component || `__component${$.breezemap.__counter++}`, proto);
        },
        register: $.breezemap.__register,
    };
    $.breezemap.uiCollection = $.uiComponent;
    $.breezemap.uiComponent = $.uiComponent;
    $.breezemap.uiElement = function (proto) {
        return $.breezemap.uiElement.extend(proto || {})();
    };
    $.breezemap.uiElement.extend = function (proto) {
        if (!proto.template && !proto.defaults?.template) {
            proto.defaults = proto.defaults || {};
            proto.defaults.template = '';
        }
        return $.view(proto.component || `__component${$.breezemap.__counter++}`, proto);
    };
    $.breezemap.uiClass = $.Base;
})();
