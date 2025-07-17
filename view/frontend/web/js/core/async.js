(function () {
    'use strict';

    const CHUNK_SIZE = 500;
    let observer;
    let counter = 1;
    let mapping = {};

    function getNodeId(node) {
        return node._observeId || (node._observeId = counter++);
    }

    function trigger(node, data) {
        const id = getNodeId(node);
        if (data.invoked.includes(id)) return;

        data.callback(node);
        data.invoked.push(id);
    }

    function isNodeInContext(node, ctx) {
        return ctx === document || ctx.contains(node);
    }

    function processNodeForSelector(node, selector, listeners) {
        if (!$(node).is(selector)) return;

        listeners.forEach(data => {
            if (isNodeInContext(node, data.ctx) && $(node, data.ctx).is(selector)) {
                trigger(node, data);
            }
        });
    }

    function processAdded(node) {
        const selectors = Object.keys(mapping);
        const allSelectors = selectors.join(',');

        if (!$(node).is(allSelectors)) return;

        selectors.forEach(selector => {
            processNodeForSelector(node, selector, mapping[selector]);
        });
    }

    function collectNodes(nodes) {
        const result = [];

        nodes.forEach(node => {
            result.push(node);
            result.push(...node.querySelectorAll('*'));
        });

        return result;
    }

    function filterValidNodes(nodes) {
        return nodes.filter(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName !== 'SCRIPT'
        );
    }

    function processChunks(nodes) {
        _.chunk(nodes, CHUNK_SIZE).forEach(chunk => {
            setTimeout(() => chunk.forEach(processAdded));
        });
    }

    function handleMutations(mutations) {
        mutations.forEach(mutation => {
            const validNodes = filterValidNodes([...mutation.addedNodes]);
            if (validNodes.length) {
                const allNodes = collectNodes(validNodes);
                processChunks(allNodes);
            }
        });
    }

    function parseArguments(selector, ctx, callback) {
        if (_.isObject(selector)) {
            return {
                selector: selector.selector,
                ctx: selector.ctx || document,
                callback: ctx
            };
        }

        return {
            selector,
            ctx: callback ? ctx : document,
            callback: callback || ctx
        };
    }

    function getListenerData(selector, ctx, callback) {
        if (!mapping[selector]) {
            mapping[selector] = [];
        }

        const existing = mapping[selector].find(
            item => item.ctx === ctx && item.callback === callback
        );

        if (existing) {
            return existing;
        }

        const data = {
            ctx,
            callback,
            invoked: []
        };

        mapping[selector].push(data);
        return data;
    }

    function processExistingNodes(selector, ctx, data) {
        $(selector, ctx).each(function () {
            trigger(this, data);
        });
    }

    observer = new MutationObserver(handleMutations);

    $(document).on('breeze:beforeLoad', function () {
        observer.observe(document.body, {
            subtree: true,
            childList: true
        });
    });

    $.async = function (selector, ctx, callback) {
        const args = parseArguments(selector, ctx, callback);
        const data = getListenerData(args.selector, args.ctx, args.callback);

        processExistingNodes(args.selector, args.ctx, data);
    };

    $.async.off = function(selector, ctx, callback) {
        const args = parseArguments(selector, ctx, callback);
        const listeners = mapping[args.selector];

        if (!listeners) return;

        mapping[args.selector] = listeners.filter(data =>
            !(data.ctx === args.ctx && data.callback === args.callback)
        );

        if (mapping[args.selector].length === 0) {
            delete mapping[args.selector];
        }
    };

    $.breezemap['Magento_Ui/js/lib/view/utils/async'] = $;
})();
