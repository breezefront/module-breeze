// Copyright © Magento, Inc. All rights reserved.
define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    var colonReg       = /\\:/g,
        renderedTemplatePromises = {},
        attributes     = {},
        elements       = {},
        globals        = [],
        renderer,
        preset;

    function load(tmplPath) {
        var el;

        try {
            el = document.getElementById(tmplPath);
            if (el) {
                return new Promise(resolve => resolve(el.innerHTML));
            }
        } catch (e) {}

        if (!tmplPath.endsWith('.html')) {
            tmplPath += '.html';
        }
        if (!tmplPath.includes('/template/')) {
            tmplPath = tmplPath.replace(/^([^/]+)/g, '$1/template');
        }

        $.breeze.debug(`Loading template: ${tmplPath}`);

        return require.async(`text!${tmplPath}`).then(html => {
            return html.replace(/<!--[\s\S]*?-->/, match => {
                return ~match.indexOf('/**') ? '' : match;
            });
        });
    }

    renderer = {
        render: function (tmplPath) {
            if (!renderedTemplatePromises[tmplPath]) {
                renderedTemplatePromises[tmplPath] = load(tmplPath).then(renderer.parseTemplate);
            }

            return renderedTemplatePromises[tmplPath];
        },

        parseTemplate: function (html) {
            var template = document.createElement('template');

            template.innerHTML = html;

            return renderer.normalize(template.content);
        },

        normalize: function (element) {
            globals.forEach(handler => handler(element));
            return _.toArray(element.childNodes);
        },

        addGlobal: function (handler) {
            if (!_.contains(globals, handler)) {
                globals.push(handler);
            }

            return this;
        },

        addAttribute: function (id, config) {
            var data = {
                name: id,
                binding: id,
                handler: renderer.handlers.attribute
            };

            if (_.isFunction(config)) {
                data.handler = config;
            } else if (_.isObject(config)) {
                _.extend(data, config);
            }

            data.id = id;
            attributes[id] = data;

            return this;
        },

        addNode: function (id, config) {
            var data = {
                name: id,
                binding: id,
                handler: renderer.handlers.node
            };

            if (_.isFunction(config)) {
                data.handler = config;
            } else if (_.isObject(config)) {
                _.extend(data, config);
            }

            data.id = id;
            elements[id] = data;

            return this;
        },

        processAttributes: function (content) {
            var repeat;

            repeat = _.some(attributes, function (attr) {
                var attrName = attr.name,
                    nodes    = content.querySelectorAll('[' + attrName + ']'),
                    handler  = attr.handler;

                return _.toArray(nodes).some(function (node) {
                    var data = node.getAttribute(attrName);

                    return handler(node, data, attr) === true;
                });
            });

            if (repeat) {
                renderer.processAttributes(content);
            }
        },

        processNodes: function (content) {
            var repeat;

            repeat = _.some(elements, function (element) {
                var nodes   = content.querySelectorAll(element.name),
                    handler = element.handler;

                return _.toArray(nodes).some(function (node) {
                    var data = node.getAttribute('args');

                    return handler(node, data, element) === true;
                });
            });

            if (repeat) {
                renderer.processNodes(content);
            }
        },

        /**
         * Wraps provided string in curly braces if it's necessary.
         *
         * @param {String} args - String to be wrapped.
         * @returns {String} Wrapped string.
         */
        wrapArgs: function (args) {
            if (~args.indexOf('\\:')) {
                args = args.replace(colonReg, ':');
            } else if (~args.indexOf(':') && !~args.indexOf('}')) {
                args = '{' + args + '}';
            }

            return args;
        },

        /**
         * Wraps child nodes of provided DOM element
         * with knockout's comment tag.
         *
         * @param {HTMLElement} node - Node whose children should be wrapped.
         * @param {String} binding - Name of the binding for the opener comment tag.
         * @param {String} data - Data associated with a binding.
         *
         * @example
         *      <div id="example"><span></span></div>
         *      wrapChildren(document.getElementById('example'), 'foreach', 'data');
         *      =>
         *      <div id="example">
         *      <!-- ko foreach: data -->
         *          <span></span>
         *      <!-- /ko -->
         *      </div>
         */
        wrapChildren: function (node, binding, data) {
            var tag = this.createComment(binding, data),
                $node = $(node);

            $node.prepend(tag.open);
            $node.append(tag.close);
        },

        /**
         * Wraps specified node with knockout's comment tag.
         *
         * @param {HTMLElement} node - Node to be wrapped.
         * @param {String} binding - Name of the binding for the opener comment tag.
         * @param {String} data - Data associated with a binding.
         *
         * @example
         *      <div id="example"></div>
         *      wrapNode(document.getElementById('example'), 'foreach', 'data');
         *      =>
         *      <!-- ko foreach: data -->
         *          <div id="example"></div>
         *      <!-- /ko -->
         */
        wrapNode: function (node, binding, data) {
            var tag = this.createComment(binding, data),
                $node = $(node);

            $node.before(tag.open);
            $node.after(tag.close);
        },

        /**
         * Creates knockouts' comment tag for the provided binding.
         *
         * @param {String} binding - Name of the binding.
         * @param {String} data - Data associated with a binding.
         * @returns {Object} Object with an open and close comment elements.
         */
        createComment: function (binding, data) {
            return {
                open: document.createComment(' ko ' + binding + ': ' + data + ' '),
                close: document.createComment(' /ko ')
            };
        }
    };

    renderer.handlers = {

        /**
         * Basic node handler. Replaces custom nodes
         * with a corresponding knockout's comment tag.
         *
         * @param {HTMLElement} node - Node to be processed.
         * @param {String} data
         * @param {Object} element
         * @returns {Boolean} True
         *
         * @example Sample syntaxes conversions.
         *      <with args="model">
         *          <span></span>
         *      </with>
         *      =>
         *      <!-- ko with: model-->
         *          <span></span>
         *      <!-- /ko -->
         */
        node: function (node, data, element) {
            data = renderer.wrapArgs(data);

            renderer.wrapNode(node, element.binding, data);
            $(node).replaceWith(node.childNodes);

            return true;
        },

        /**
         * Base attribute handler. Replaces custom attributes with
         * a corresponding knockouts' data binding.
         *
         * @param {HTMLElement} node - Node to be processed.
         * @param {String} data - Data associated with a binding.
         * @param {Object} attr - Attribute definition.
         *
         * @example Sample syntaxes conversions.
         *      <div text="label"></div>
         *      =>
         *      <div data-bind="text: label"></div>
         */
        attribute: function (node, data, attr) {
            data = renderer.wrapArgs(data);

            renderer.bindings.add(node, attr.binding, data);
            node.removeAttribute(attr.name);
        },

        /**
         * Wraps provided node with a knockouts' comment tag.
         *
         * @param {HTMLElement} node - Node that will be wrapped.
         * @param {String} data - Data associated with a binding.
         * @param {Object} attr - Attribute definition.
         *
         * @example
         *      <div outereach="data" class="test"></div>
         *      =>
         *      <!-- ko foreach: data -->
         *          <div class="test"></div>
         *      <!-- /ko -->
         */
        wrapAttribute: function (node, data, attr) {
            data = renderer.wrapArgs(data);

            renderer.wrapNode(node, attr.binding, data);
            node.removeAttribute(attr.name);
        }
    };

    renderer.bindings = {
        add: function (node, name, data) {
            var bindings = this.get(node);

            if (bindings) {
                bindings += ', ';
            }

            bindings += name;

            if (data) {
                bindings += ': ' + data;
            }

            this.set(node, bindings);
        },

        get: function (node) {
            return node.getAttribute('data-bind') || '';
        },

        set: function (node, bindings) {
            node.setAttribute('data-bind', bindings);
        }
    };

    renderer
        .addGlobal(renderer.processAttributes)
        .addGlobal(renderer.processNodes);

    /**
     * Collection of default binding conversions.
     */
    preset = {
        nodes: _.object([
            'if',
            'text',
            'with',
            'scope',
            'ifnot',
            'foreach',
            'component'
        ], Array.prototype),
        attributes: _.object([
            'css',
            'attr',
            'html',
            'with',
            'text',
            'click',
            'event',
            'submit',
            'enable',
            'disable',
            'options',
            'visible',
            'template',
            'hasFocus',
            'textInput',
            'component',
            'uniqueName',
            'optionsText',
            'optionsValue',
            'checkedValue',
            'selectedOptions'
        ], Array.prototype)
    };

    _.extend(preset.attributes, {
        if: renderer.handlers.wrapAttribute,
        ifnot: renderer.handlers.wrapAttribute,
        innerif: {
            binding: 'if'
        },
        innerifnot: {
            binding: 'ifnot'
        },
        outereach: {
            binding: 'foreach',
            handler: renderer.handlers.wrapAttribute
        },
        foreach: {
            name: 'each'
        },
        value: {
            name: 'ko-value'
        },
        style: {
            name: 'ko-style'
        },
        checked: {
            name: 'ko-checked'
        },
        disabled: {
            name: 'ko-disabled',
            binding: 'disable'
        },
        focused: {
            name: 'ko-focused',
            binding: 'hasFocus'
        },

        /**
         * Custom 'render' attribute handler function. Wraps child elements
         * of a node with knockout's 'ko template:' comment tag.
         *
         * @param {HTMLElement} node - Element to be processed.
         * @param {String} data - Data specified in 'render' attribute of a node.
         */
        render: function (node, data) {
            data = data || 'getTemplate()';
            data = renderer.wrapArgs(data);

            renderer.wrapChildren(node, 'template', data);
            node.removeAttribute('render');
        }
    });

    _.extend(preset.nodes, {
        foreach: {
            name: 'each'
        },

        /**
         * Custom 'render' node handler function.
         * Replaces node with knockout's 'ko template:' comment tag.
         *
         * @param {HTMLElement} node - Element to be processed.
         * @param {String} data - Data specified in 'args' attribute of a node.
         */
        render: function (node, data) {
            data = data || 'getTemplate()';
            data = renderer.wrapArgs(data);

            renderer.wrapNode(node, 'template', data);
            $(node).replaceWith(node.childNodes);
        }
    });

    _.each(preset.attributes, function (data, id) {
        renderer.addAttribute(id, data);
    });

    _.each(preset.nodes, function (data, id) {
        renderer.addNode(id, data);
    });

    $.breezemap['ko/template/renderer'] = renderer;
});
