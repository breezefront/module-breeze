(function () {
    'use strict';

    var html,
        scriptsContainer,
        scopedElements,
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

        if (now) {
            callback();
        } else if (window.requestIdleCallback) {
            window.requestIdleCallback(callback);
        } else {
            window.setTimeout(callback, 1);
        }
    }

    $.breeze.mount = mount;

    /** Init view components */
    function mountView(scope, config) {
        var scopeRe = new RegExp(`scope:.*${scope}'`),
            elements = scopedElements.filter(function () {
                var bind = $(this).attr('data-bind');

                return bind.includes('\'' + scope + '\'') || bind.match(scopeRe);
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

    /** Process 'data-mage-init' and 'text/x-magento-init' scripts */
    function processElement(el) {
        var isScript = el.tagName === 'SCRIPT',
            settings = isScript ? el.textContent : el.dataset.mageInit;

        $(el).data('breeze-processed', true);

        if (isScript) {
            // Move script to the bottom so it will not break :nth-child, and ~ selectors
            // and still will be accessible for reinitialization when using turbo cache.
            scriptsContainer.append(el);
            el = false;
        }

        try {
            settings = JSON.parse(settings);
        } catch (e) {
            console.error(e);
        }

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
                        cfg.__scope = scope;
                        mountView(scope, cfg);
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

    /** Get event name to listen */
    function loadEventName() {
        var name = 'DOMContentLoaded';

        if (typeof Turbo !== 'undefined' || typeof Turbolinks !== 'undefined') {
            name = 'turbo:load turbolinks:load';
        }

        return name;
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
            .not('[data-breeze-processed]')
            .each(function () {
                processElement(this);
            });
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

        $(document).trigger('breeze:beforeLoad');
        $(document).trigger('breeze:load');

        walk(document);
    }

    $(document).on(loadEventName(), function () {
        var newScripts = _.isEmpty($.breeze.loadedScripts) ? [] : $('script[src]').filter(function () {
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
    });

    $(document).on('contentUpdated', function (event) {
        scopedElements = $('[data-bind*="scope:"]');
        walk(event.target);
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
})();
