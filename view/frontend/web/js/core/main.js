(function () {
    'use strict';

    var html,
        checkScriptState,
        scriptsContainer,
        scopedElements,
        parsedSettings = {},
        oldDimensions = {
            width: $(window).width(),
            height: $(window).height()
        };

    /** Init 'data-mage-init' and 'text/x-magento-init' scripts */
    function mount(component, data, now) {
        if (data.settings?.componentDisabled === true) {
            return;
        }

        /** Callback to run while browser is resting */
        function callback() {
            $(document).trigger('breeze:mount', $.extend({}, data, {
                __component: component
            }));
            $(document).trigger('breeze:mount:' + component, data);
        }

        if (now && (!$.breeze.jsconfig[component] || $.breezemap.__get(component))) {
            return callback();
        }

        // will load components from non-active bundle if needed (product.js on homepage)
        // will not load components with dynamic load rules (onReveal, onEvent, onInteraction)
        require(['loadComponent'], loadComponent => {
            loadComponent(component, true).then(() => {
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(callback);
                } else {
                    window.setTimeout(callback, 0);
                }
            });
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

        elements.each(function () {
            mount(config.component, {
                settings: config,
                el: this
            });
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
            // Move script to the bottom so it will not break :nth-child, and ~ selectors
            // and still will be accessible for reinitialization when using turbo cache.
            scriptsContainer.append(el);
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

        $.each(settings, function (component, config) {
            var selector = false;

            if (isScript) {
                el = false;

                if (component !== '*') {
                    el = html.find(component);
                    selector = component;

                    // eslint-disable-next-line max-depth
                    if (!el.length) {
                        return;
                    }
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
                            mountView(scope, cfg);
                        }
                    });
                } else {
                    if (selector) {
                        config[i].__selector = selector;
                    }

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

        $(el).attr(
            'data-mage-init',
            JSON.stringify($.extend($(el).data('mage-init') || {}, json))
        );
    }

    /** Convert data-mage-init-lazy attributes */
    function convertLazyInitToDataMageInit(el) {
        $(el).attr('data-mage-init', $(el).attr('data-mage-init-lazy'));
    }

    /**
     * @param {Element} node
     */
    function walk(node) {
        node = node || document;

        [...node.querySelectorAll('[data-bind*="mageInit:"]')]
            .filter(el => !$(el).parents('[data-bind*="scope:"]').length)
            .forEach(convertDataBindToDataMageInit);

        node.querySelectorAll('[data-mage-init-lazy]')
            .forEach(convertLazyInitToDataMageInit);

        $(node).find('[data-mage-init],[type="text/x-magento-init"]')
            .add($(node).is('[data-mage-init],[type="text/x-magento-init"]') ? node : $())
            .each((i, el) => setTimeout(() => processElement(el), 0));
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

        html = $('html');
        scriptsContainer = $('.breeze-container');
        scopedElements = $('[data-bind*="scope:"]');

        setTimeout(() => {
            $(document).trigger('breeze:beforeLoad');
            $(document).trigger('breeze:load');
            $.breeze.ready = true;
            walk();
        }, 0);
    }

    function onDomDocumentLoad() {
        var newScripts = !checkScriptState || _.isEmpty($.breeze.loadedScripts)
                ? [] : $('script[src]').filter(function () {
                    return !$.breeze.loadedScripts[this.src];
                }),
            spinnerTimeout,
            i = 0;

        if (!newScripts.length) {
            return onBreezeLoad();
        }

        // wait for dynamic scripts when turbo is used (fixes product page/account scripts)
        spinnerTimeout = setTimeout(function () {
            $('body').spinner(true);
        }, 200);

        function onScriptLoad(src) {
            $.breeze.loadedScripts[src] = true;

            if (++i < newScripts.length) {
                return;
            }

            clearTimeout(spinnerTimeout);
            $('body').spinner(false);
            onBreezeLoad();
        }

        newScripts.each(function () {
            if (this.async) {
                return onScriptLoad(this.src);
            }

            // eslint-disable-next-line max-nested-callbacks
            $(this).on('load error', () => onScriptLoad(this.src));
        });
    }

    $(document).on('DOMContentLoaded', onDomDocumentLoad);
    $(document).on('breeze:turbo-ready', () => {
        $(document).off('DOMContentLoaded', onDomDocumentLoad);
        $(document).on('turbolinks:load', onDomDocumentLoad);
    });
    $(document).on('contentUpdated', function (event) {
        scopedElements = $('[data-bind*="scope:"]');
        walk(event.target);
    });
    document.addEventListener('turbolinks:before-render', () => !(checkScriptState = true));

    // automatically mount components
    $(document).on('breeze:mount', function (event, data) {
        var name = $.breezemap.__aliases[data.__component] || data.__component,
            component = $.breezemap[name],
            instance = component,
            proto = {};

        if (!component || component._proto?.prototype.component === false) {
            return;
        }

        if (['uiComponent', 'uiCollection'].includes(name)) {
            proto.defaults = {
                template: 'uiComponent'
            };
        }

        $(data.el || document.body).each((i, el) => {
            if ($.registry.get(name, el)) {
                return;
            }

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
                $(el).component(name, instance);
                $.registry.set(name, el, instance);
            }
        });
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
        applyFor: (el, config, component) => mount(component, {
            el: el,
            settings: config,
        }),
    };
    $.mage.init = function () {
        walk();
        return this;
    };
})();
