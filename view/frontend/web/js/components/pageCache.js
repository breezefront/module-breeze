/* global breeze */
(function () {
    'use strict';

    breeze.widget('pageCache', {
        options: {
            url: '/',
            patternPlaceholderOpen: /^ BLOCK (.+) $/,
            patternPlaceholderClose: /^ \/BLOCK (.+) $/,
            versionCookieName: 'private_content_version',
            handles: []
        },

        /** Initialize plugin */
        create: function () {
            var placeholders,
                version = breeze.cookies.get(this.options.versionCookieName);

            if (!version) {
                return;
            }
            placeholders = this._searchPlaceholders(this.getComments());

            if (placeholders && placeholders.length) {
                this._ajax(placeholders, version);
            }
        },

        /** Get all comments */
        getComments: function () {
            var comments = [],
                iterator = document.createNodeIterator(
                    document.body,
                    NodeFilter.SHOW_COMMENT,
                    /** [filterNone description] */
                    function filterNone() {
                        return NodeFilter.FILTER_ACCEPT;
                    },
                    false
                ),
                curNode;

            while ((curNode = iterator.nextNode())) {
                comments.push(curNode);
            }

            return comments;
        },

        /**
         * @param {Array} elements
         * @returns {Array}
         * @private
         */
        _searchPlaceholders: function (elements) {
            var placeholders = [],
                tmp = {},
                ii,
                len,
                el, matches, name;

            if (!(elements && elements.length)) {
                return placeholders;
            }

            for (ii = 0, len = elements.length; ii < len; ii++) {
                el = elements[ii];
                matches = this.options.patternPlaceholderOpen.exec(el.nodeValue);
                name = null;

                if (matches) {
                    name = matches[1];
                    tmp[name] = {
                        name: name,
                        openElement: el
                    };
                } else {
                    matches = this.options.patternPlaceholderClose.exec(el.nodeValue);

                    if (matches) { //eslint-disable-line max-depth
                        name = matches[1];

                        if (tmp[name]) { //eslint-disable-line max-depth
                            tmp[name].closeElement = el;
                            placeholders.push(tmp[name]);
                            delete tmp[name];
                        }
                    }
                }
            }

            return placeholders;
        },

        /**
         * Parse for page and replace placeholders
         * @param {Object} placeholder
         * @param {Object} html
         * @protected
         */
        _replacePlaceholder: function (placeholder, html) {
            var startReplacing = false,
                prevSibling = null,
                parent, contents, yy, len, element;

            if (!placeholder || !html) {
                return;
            }

            parent = $(placeholder.openElement).parent();
            contents = parent.contents();

            for (yy = 0, len = contents.length; yy < len; yy++) {
                element = contents[yy];

                if (element == placeholder.openElement) { //eslint-disable-line eqeqeq
                    startReplacing = true;
                }

                if (startReplacing) {
                    $(element).remove();
                } else if (element.nodeType != 8) { //eslint-disable-line eqeqeq
                    //due to comment tag doesn't have siblings we try to find it manually
                    prevSibling = element;
                }

                if (element == placeholder.closeElement) { //eslint-disable-line eqeqeq
                    break;
                }
            }

            if (prevSibling) {
                $(prevSibling).after(html);
            } else {
                $(parent).prepend(html);
            }

            // trigger event to use mage-data-init attribute
            $(parent).trigger('contentUpdated');
        },

        /**
         * @param {Object} placeholders
         * @param {String} version
         * @private
         */
        _ajax: function (placeholders, version) {
            var self = this,
                data = {
                    blocks: [],
                    handles: this.options.handles,
                    originalRequest: this.options.originalRequest,
                    version: version
                };

            $.each(placeholders, function () {
                data.blocks.push(this.name);
            });

            data.blocks = JSON.stringify(data.blocks.sort());
            data.handles = JSON.stringify(data.handles);
            data.originalRequest = JSON.stringify(data.originalRequest);

            breeze.request.get({
                url: this.options.url,
                data: data,
                type: 'json'
            }).then(function (response) {
                $.each(placeholders, function () {
                    self._replacePlaceholder(this, response.body[this.name]);
                });
            });
        }
    });

    $(document).on('breeze:mount:pageCache', function (event) {
        $(event.detail.el).pageCache(event.detail.settings);
    });
})();
