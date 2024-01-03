(function () {
    'use strict';

    var observer,
        counter = 1,
        mapping = {};

    /**
     * @param {Element} node
     * @returns {Number}
     */
    function getNodeId(node) {
        var id = node._observeId;

        if (!id) {
            id = node._observeId = counter++;
        }

        return id;
    }

    /**
     * @param {Element} node
     * @param {Object} data
     */
    function trigger(node, data) {
        var id = getNodeId(node),
            ids = data.invoked;

        if (ids.indexOf(id) > -1) {
            return;
        }

        data.callback(node);
        data.invoked.push(id);
    }

    /**
     * @param {Element} node
     */
    function processAdded(node) {
        _.each(mapping, function (listeners, selector) {
            if (!$(node).is(selector)) {
                return;
            }

            _.each(listeners, function (data) {
                if (!data.ctx.contains(node) || !$(node, data.ctx).is(selector)) {
                    return;
                }

                trigger(node, data);
            });
        });
    }

    /**
     * @param {Array|NodeList} nodes
     * @return {Array}
     */
    function collectNodes(nodes) {
        var result = [];

        _.toArray(nodes).forEach(function (node) {
            if (node.nodeType !== 1) {
                return;
            }

            result.push(node);
            result = result.concat(_.toArray(node.querySelectorAll('*')));
        });

        return result;
    }

    observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            collectNodes(mutation.addedNodes).forEach(processAdded);
        });
    });

    $(document).on('breeze:beforeLoad', function () {
        observer.observe(document.body, {
            subtree: true,
            childList: true
        });
    });

    $(document).on('breeze:destroy', function () {
        mapping = {};
        counter = 1;
        observer.disconnect();
    });

    /**
     * @param {String|Object} selector
     * @param {HTMLElement|Function} ctx
     * @param {Function} callback
     */
    $.async = function (selector, ctx, callback) {
        var data;

        if (_.isObject(selector)) {
            callback = ctx;
            ctx = selector.ctx || document;
            selector = selector.selector;
        } else if (!callback) {
            callback = ctx;
            ctx = document;
        }

        data = {
            ctx: ctx,
            callback: callback,
            invoked: []
        };

        $(selector, data.ctx).each(function () {
            trigger(this, data);
        });

        (mapping[selector] = mapping[selector] || []).push(data);
    };

    $.breezemap['Magento_Ui/js/lib/view/utils/async'] = $;
})();
