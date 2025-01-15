(function () {
    'use strict';

    function isVirtualElement(node) {
        return node.nodeType === 8;
    }

    /**
    * @param {Object} el
    * @param {bool} isUpdate
    * @return {Object} el
    */
    function getRealElement(el, isUpdate) {
        if (isVirtualElement(el)) {
            if (isUpdate) {
                return $(el).next('span');
            }

            return $('<span>').insertAfter(el);
        }

        return $(el);
    }

    // fix to execute js scripts
    ko.utils.setHtml = ko.a.fc = function (node, html) {
        while (node.firstChild) {
            ko.removeNode(node.firstChild);
        }

        html = ko.utils.unwrapObservable(html);

        if (html !== null && html !== undefined) {
            if (typeof html !== 'string') {
                html = html.toString();
            }

            $(node).html(html);
        }
    };

    ko.bindingHandlers.blockLoader = {
        /**
         * @param {String} element
         * @param {Boolean} displayBlockLoader
         */
        update: function (element, displayBlockLoader) {
            if (ko.unwrap(displayBlockLoader())) {
                $(element).spinner(true);
            } else {
                $(element).spinner(false);
            }
        }
    };

    ko.bindingHandlers.i18n = {
        /**
         * @param {Object} element
         * @param {Function} value
         */
        init: function (element, value) {
            getRealElement(element).text($.__(ko.unwrap(value() || '')));
        },

        /**
         * @param {Object} element
         * @param {Function} value
         */
        update: function (element, value) {
            getRealElement(element, true).text($.__(ko.unwrap(value() || '')));
        }
    };

    ko.virtualElements.allowedBindings.i18n = true;

    ko.bindingHandlers.translate = ko.bindingHandlers.i18n;
    ko.virtualElements.allowedBindings.translate = true;

    ko.bindingHandlers.scope = {
        init: function () {
            return {
                controlsDescendantBindings: true
            };
        }
    };

    ko.virtualElements.allowedBindings.scope = true;

    ko.bindingHandlers.bindHtml = {
        init: function () {
            return {
                controlsDescendantBindings: true
            };
        },

        /**
         * Reads params passed to binding.
         * Set html to node element, apply bindings and call magento attributes parser.
         *
         * @param {HTMLElement} el - Element to apply bindings to.
         * @param {Function} valueAccessor - Function that returns value, passed to binding.
         */
        update: function (el, valueAccessor) {
            var html = ko.utils.unwrapObservable(valueAccessor());

            ko.virtualElements.emptyNode(el);

            if (!_.isNull(html) && !_.isUndefined(html)) {
                if (!_.isString(html)) {
                    html = html.toString();
                }

                el.innerHTML = html;
            }

            ko.utils.arrayForEach(el.childNodes, ko.cleanNode);

            $(el).trigger('contentUpdated');
        }
    };

    ko.bindingHandlers.afterRender = {
        init: function (element, valueAccessor, allBindings, viewModel) {
            var callback = valueAccessor();

            if (typeof callback === 'function') {
                callback.call(viewModel, element, viewModel);
            }
        }
    };

    ko.bindingHandlers.mageInit = {
        /**
         * @param {HTMLElement} el
         * @param {Function} valueAccessor
         */
        init: function (el, valueAccessor) {
            var data = valueAccessor();

            _.each(data, function (config, component) {
                $.breeze.mount(component, {
                    settings: config,
                    el: el
                });
            });
        }
    };

    $.breezemap.ko = $.breezemap.knockout = ko;
})();
