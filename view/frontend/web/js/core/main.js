(function () {
    'use strict';

    var scopedElements,
        configs = new WeakMap(),
        mounted = new WeakMap(),
        parsedSettings = {},
        oldDimensions = {};

    /** Init 'data-mage-init' and 'text/x-magento-init' scripts */
    function mount(component, data, now) {
        var storageEl = data.settings.__el || data.el,
            key = data.settings?.__scope || component;

        if (data.settings?.componentDisabled === true) {
            return;
        }

        function callback() {
            $(document).trigger('breeze:mount', $.extend({}, data, {
                __component: component
            }));
            $(document).trigger('breeze:mount:' + component, data);
        }

        if (now && (!$.breeze.jsconfig[component] || $.breezemap.__get(component))) {
            return callback();
        }

        if (storageEl) {
            if (!mounted.has(storageEl)) {
                mounted.set(storageEl, {});
            } else if (mounted.get(storageEl)[key]) {
                return;
            }
            mounted.get(storageEl)[key] = data;
        }

        // will load components from non-active bundle if needed (product.js on homepage)
        // will not load components with dynamic load rules (onReveal, onEvent, onInteraction)
        $.breezemap.loadComponent(component, true).then(() => {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(callback, { timeout: 300 });
            } else {
                window.setTimeout(callback, 0);
            }
        });
    }

    $.breeze.mount = mount;

    /** Init view components */
    function mountView(scope, config) {
        var scopeRe = new RegExp(`scope:.*${scope}'`),
            elements = scopedElements.filter(function () {
                var bind = $(this).attr('data-bind').trim(),
                    result = bind.includes('\'' + scope + '\'') || bind.match(scopeRe);

                if (result || !bind.includes('\\u')) {
                    return result;
                }

                try {
                    return JSON.parse(`{"val":"${bind}"}`).val.includes('\'' + scope + '\'');
                } catch (e) {
                    return false;
                }
            });

        if (!elements.length) {
            elements = $([false]);
        }

        elements = elements.get();
        mount(config.component, {
            settings: config,
            el: elements.shift()
        });

        $.breezemap.uiRegistry.get(scope, cmp => {
            elements.forEach(el => cmp._applyBindings(el));
        });
    }

    $.breezemap.uiLayout = (nodes) => {
        $(document).one('breeze:load', () => {
            nodes.forEach(node => {
                node.index = node.ns = node.name;
                if (node.parent) {
                    // eslint-disable-next-line max-nested-callbacks
                    $.breezemap.uiRegistry.get(node.parent, parent => {
                        parent.insertChild(parent.mount(node));
                    });
                } else {
                    node.__scope = node.name;
                    mountView(node.name, node);
                }
            });
        });
    };

    /** Process 'data-mage-init' and 'text/x-magento-init' scripts */
    function processElement(el) {
        var isScript = el.tagName === 'SCRIPT',
            settings = isScript ? el.textContent : el.dataset.mageInit;

        if (isScript) {
            el.remove();
            el = false;
        }

        if (typeof parsedSettings[settings] === 'undefined') {
            try {
                parsedSettings[settings] = JSON.parse(settings);
            } catch (e) {
                return console.error(e);
            }
        }

        settings = parsedSettings[settings];
        if (configs.has(el)) {
            settings = $.extend(true, {}, settings, configs.get(el));
        }

        $.each(settings, function (component, config) {
            if (isScript) {
                if (component !== '*') {
                    return;
                }

                component = Object.keys(config);
                config = Object.values(config);
            } else {
                component = [component];
                config = [config];
            }

            $.each(component, function (i, name) {
                if (name === 'Magento_Ui/js/core/app') {
                    if (!config[i].components) {
                        return;
                    }

                    // eslint-disable-next-line max-nested-callbacks
                    $.each(config[i].components, function (scope, cfg) {
                        if (cfg.component) {
                            cfg.name = cfg.index = cfg.ns = cfg.__scope = scope;
                            cfg.__el = el;
                            mountView(scope, cfg);
                        }
                    });
                } else {
                    mount(name, {
                        settings: config[i],
                        el: el
                    });
                }
            });
        });
    }

    /** Extract json by key from dataBind string */
    function extractJsonFromDataBind(key, dataBind) {
        var json = {},
            bindings = ko.expressionRewriting.parseObjectLiteral(dataBind);

        /** Parse mageInit binding from data-bind string */
        function parseJson(string) {
            var parsed = {},
                literal,
                unknown;

            try {
                return JSON.parse(string);
            } catch (e) {
                //
            }

            literal = ko.expressionRewriting.parseObjectLiteral(string);
            unknown = literal[0].unknown;

            if (unknown) {
                // if it's not a string or it's not startsWith [ or {
                if (!unknown.indexOf || !['[', '{'].includes(unknown[0])) {
                    return unknown;
                }

                try {
                    return JSON.parse(unknown);
                } catch (e) {
                    throw 'Unable to parse complex literal';
                }
            }

            $.each(literal, function (i, object) {
                parsed[object.key] = parseJson(object.value);
            });

            return parsed;
        }

        $.each(bindings, function (i, binding) {
            if (binding.key !== 'mageInit') {
                return;
            }

            json = parseJson(binding.value);

            return false;
        });

        return json;
    }

    /** Update data-mage-init attribute for all matches elements based on data-bind value */
    function convertDataBindToDataMageInit(el) {
        var json;

        try {
            json = extractJsonFromDataBind('mageInit', $(el).data('bind'));
        } catch (e) {
            return;
        }

        if (!$(el).attr('data-mage-init')) {
            $(el).attr('data-mage-init', '{}');
        }
        configs.set(el, $.extend(true, configs.get(el) || {}, json));
    }

    function convertXMagentoInitToDataMageInit(script) {
        return new Promise(resolve => {
            setTimeout(() => {
                var remove = true,
                    settings = JSON.parse(script.textContent);

                $.each(settings, (selector, json) => {
                    if (selector === '*') {
                        remove = false;
                        return;
                    }

                    $.each(json, cmp => {
                        if (cmp !== 'Magento_Ui/js/core/app') {
                            json[cmp].__selector = selector;
                        }
                    });

                    $(selector).each((i, el) => {
                        if (!$(el).attr('data-mage-init')) {
                            $(el).attr('data-mage-init', '{}');
                        }
                        configs.set(el, $.extend(true, configs.get(el) || {}, json));
                    });
                    delete settings[selector];
                });

                if (remove) {
                    script.remove();
                } else {
                    script.innerText = JSON.stringify(settings);
                }

                resolve();
            });
        });
    }

    async function walk() {
        [...document.querySelectorAll('[data-bind*="mageInit:"]')]
            .filter(el => !$(el).parents('[data-bind*="scope:"]').length)
            .forEach(convertDataBindToDataMageInit);

        await Promise.all(
            [...document.querySelectorAll('[type="text/x-magento-init"]')]
                .map(convertXMagentoInitToDataMageInit)
        );

        [...document.querySelectorAll('[data-mage-init],[type="text/x-magento-init"]')]
            .forEach(el => setTimeout(() => processElement(el)));
    }

    // convert 'ko scope:' into 'data-bind scope'
    function convertKoScopeToDataBind() {
        var iterator = document.createNodeIterator(
                document,
                NodeFilter.SHOW_COMMENT,
                function (node) {
                    return node.nodeValue.startsWith(' ko scope:');
                }
            ),
            curNode,
            match;

        while ((curNode = iterator.nextNode())) {
            match = curNode.nodeValue.match(/ko scope:.*?(['"])(.*)\1/);

            if (!match) {
                continue;
            }

            $(curNode.nextElementSibling)
                .wrap(`<div data-bind="scope:'${match[2]}'"></div>`);
        }
    }

    function onBreezeLoad() {
        convertKoScopeToDataBind();

        scopedElements = $('[data-bind*="scope:"]');

        setTimeout(() => {
            $(document).trigger('breeze:beforeLoad');
            $(document).trigger('breeze:load');
            $.breeze.ready = true;
            walk();
        }, 0);
    }

    $(onBreezeLoad);
    $(document).on('contentUpdated', _.debounce(() => {
        scopedElements = $('[data-bind*="scope:"]');
        walk();
    }, 40));

    // automatically mount components
    $(document).on('breeze:mount', function (event, data) {
        var key = data.settings.__scope || data.__component,
            name = $.breezemap.__aliases[data.__component] || data.__component,
            component = $.breezemap[name],
            instance = component,
            proto = {};

        if (!component || component._proto?.prototype.component === false) {
            return;
        }

        $(data.el || document.body).each((i, el) => {
            if ($.registry.get(key, el)) {
                return;
            }

            try {
                if (_.isFunction(component)) {
                    instance = component(data.settings, el);
                    if (_.isFunction(instance) && instance.extend && instance._proto) {
                        instance = instance(data.settings, el); // cmp is a function that returns UI Component
                    } else if (!component.extend && !instance?.component) {
                        instance = component;
                    }
                } else if (_.isObject(component) && _.isFunction(component[name])) {
                    component[name].bind(component)(data.settings, el);
                } else if (_.isObject(component) && _.isFunction(component.extend)) {
                        instance = component.extend(proto)(data.settings, el);
                } else {
                    return;
                }

                if (instance) {
                    [...new Set(key, name)].forEach(k => {
                        $(el).component(k, instance);
                        $.registry.set(k, el, instance);
                    });
                }
            } catch (e) {
                if (data.settings?.__scope) {
                    console.error(e);
                } else {
                    throw e;
                }
            }
        });
    });

    $.raf(() => {
        oldDimensions = {
            width: $(window).width(),
            height: $(window).height()
        };
    });

    $(window).on('resize', _.debounce(function () {
        var events = ['breeze:resize'],
            newDimensions = {
                width: $(window).width(),
                height: $(window).height()
            };

        if (oldDimensions.width !== newDimensions.width) {
            events.push('breeze:resize-x');
        }

        if (oldDimensions.height !== newDimensions.height) {
            events.push('breeze:resize-y');
        }

        events.forEach(function (event) {
            $('body').trigger(event, {
                oldDimensions: oldDimensions,
                newDimensions: newDimensions
            });
        });

        oldDimensions = newDimensions;
    }, 100));

    $.breeze.referrer = document.referrer;
    $.breezemap['mage/apply/main'] = {
        apply: walk,
        applyFor: (el, settings, component) => {
            var instance = $(el).component(component);

            if (instance) {
                instance._options(settings).init();
            } else {
                mount(component, { el: $(el), settings });
            }
        }
    };
    $.mage.init = function () {
        walk();
        return this;
    };
    $.breezemap['mage/mage'] = $.mage;
})();
