(function () {
    'use strict';

    $.escaper = {
        neverAllowedElements: ['script', 'img', 'embed', 'iframe', 'video', 'source', 'object', 'audio'],
        generallyAllowedAttributes: ['id', 'class', 'href', 'title', 'style'],
        forbiddenAttributesByElement: {
            a: ['style']
        },

        /**
         * Escape a string for safe injection into HTML
         *
         * @param {String} data
         * @param {Array|null} allowedTags
         * @returns {String}
         */
        escapeHtml: function (data, allowedTags) {
            var domParser = new DOMParser(),
                fragment = domParser.parseFromString('<div></div>', 'text/html');

            fragment = fragment.body.childNodes[0];
            allowedTags = typeof allowedTags === 'object' && allowedTags.length ? allowedTags : null;

            if (allowedTags) {
                fragment.innerHTML = data || '';
                allowedTags = this._filterProhibitedTags(allowedTags);

                this._removeComments(fragment);
                this._removeNotAllowedElements(fragment, allowedTags);
                this._removeNotAllowedAttributes(fragment);

                return fragment.innerHTML;
            }

            fragment.textContent = data || '';

            return fragment.innerHTML;
        },

        /**
         * Remove the always forbidden tags from a list of provided tags
         *
         * @param {Array} tags
         * @returns {Array}
         * @private
         */
        _filterProhibitedTags: function (tags) {
            return tags.filter(function (n) {
                return this.neverAllowedElements.indexOf(n) === -1;
            }.bind(this));
        },

        /**
         * Remove comment nodes from the given node
         *
         * @param {Node} node
         * @private
         */
        _removeComments: function (node) {
            var treeWalker = node.ownerDocument.createTreeWalker(
                    node,
                    NodeFilter.SHOW_COMMENT,
                    function () {
                        return NodeFilter.FILTER_ACCEPT;
                    },
                    false
                ),
                nodesToRemove = [];

            while (treeWalker.nextNode()) {
                nodesToRemove.push(treeWalker.currentNode);
            }

            nodesToRemove.forEach(function (nodeToRemove) {
                nodeToRemove.parentNode.removeChild(nodeToRemove);
            });
        },

        /**
         * Strip the given node of all disallowed tags while permitting any nested text nodes
         *
         * @param {Node} node
         * @param {Array|null} allowedTags
         * @private
         */
        _removeNotAllowedElements: function (node, allowedTags) {
            var treeWalker = node.ownerDocument.createTreeWalker(
                    node,
                    NodeFilter.SHOW_ELEMENT,
                    function (currentNode) {
                        return allowedTags.indexOf(currentNode.nodeName.toLowerCase()) === -1 ?
                            NodeFilter.FILTER_ACCEPT
                            // SKIP instead of REJECT because REJECT also rejects child nodes
                            : NodeFilter.FILTER_SKIP;
                    },
                false
                ),
                nodesToRemove = [];

            while (treeWalker.nextNode()) {
                if (allowedTags.indexOf(treeWalker.currentNode.nodeName.toLowerCase()) === -1) {
                    nodesToRemove.push(treeWalker.currentNode);
                }
            }

            nodesToRemove.forEach(function (nodeToRemove) {
                nodeToRemove.parentNode.replaceChild(
                    node.ownerDocument.createTextNode(nodeToRemove.textContent),
                    nodeToRemove
                );
            });
        },

        /**
         * Remove any invalid attributes from the given node
         *
         * @param {Node} node
         * @private
         */
        _removeNotAllowedAttributes: function (node) {
            var treeWalker = node.ownerDocument.createTreeWalker(
                    node,
                    NodeFilter.SHOW_ELEMENT,
                    function () {
                        return NodeFilter.FILTER_ACCEPT;
                    },
                false
                ),
                i,
                attribute,
                nodeName,
                attributesToRemove = [];

            while (treeWalker.nextNode()) {
                for (i = 0; i < treeWalker.currentNode.attributes.length; i++) {
                    attribute = treeWalker.currentNode.attributes[i];
                    nodeName = treeWalker.currentNode.nodeName.toLowerCase();

                    if (this.generallyAllowedAttributes.indexOf(attribute.name) === -1 || // eslint-disable-line max-depth,max-len
                        this.forbiddenAttributesByElement[nodeName] &&
                        this.forbiddenAttributesByElement[nodeName].indexOf(attribute.name) !== -1
                    ) {
                        attributesToRemove.push(attribute);
                    }
                }
            }

            attributesToRemove.forEach(function (attributeToRemove) {
                attributeToRemove.ownerElement.removeAttribute(attributeToRemove.name);
            });
        }
    };
})();
