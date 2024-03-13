$.sections = $.customerData = window.customerData = (function () {
    'use strict';

    var data = {},
        deferred = $.Deferred(),
        options = window.sectionsConfig;

    /**
     * @param {String} url
     * @return {String}
     */
    function canonize(url) {
        var route = url;

        _.some(options.baseUrls, function (baseUrl) {
            route = url.replace(baseUrl, '');

            return route !== url;
        });

        return route.replace(/^\/?index.php\/?/, '').toLowerCase();
    }

    $(document).on('customerData:afterInitialize', () => {
        deferred.resolve();
    });

    return {
        /**
         * Returns a list of sections which should be invalidated for given URL.
         * @param {String} url - URL which was requested.
         * @return {Array} - List of sections to invalidate.
         */
        getAffectedSections: function (url) {
            var route = canonize(url),
                actions = _.find(options.sections, function (val, section) {
                    var matched;

                    // Covers the case where "*" works as a glob pattern.
                    if (section.indexOf('*') >= 0) {
                        section = section.replace(/\*/g, '[^/]+') + '$';
                        matched = route.match(section);

                        return matched && matched[0] === route;
                    }

                    return route.indexOf(section) === 0;
                });

            return _.union(_.toArray(actions), options.sections['*']);
        },

        /**
         * Filters the list of given sections to the ones defined as client side.
         * @param {Array} allSections - List of sections to check.
         * @return {Array} - List of filtered sections.
         */
        filterClientSideSections: function (allSections) {
            return _.difference(allSections, options.clientSideSections);
        },

        /**
         * Tells if section is defined as client side.
         * @param {String} sectionName - Name of the section to check.
         * @return {Boolean}
         */
        isClientSideSection: function (sectionName) {
            return _.contains(options.clientSideSections, sectionName);
        },

        /**
         * Returns array of section names.
         * @returns {Array}
         */
        getSectionNames: function () {
            return options.sectionNames;
        },

        /**
         * @param {String} name
         * @return {Function}
         */
        get: function (name) {
            if (!data[name]) {
                data[name] = ko.observable({});
            }

            return data[name];
        },

        /**
         * @param {String} name
         * @param {Object} section
         */
        set: function (name, section) {
            this.get(name)(section);
        },

        /**
         * @param {Array} names
         * @param {Boolean} forceNewSectionTimestamp
         */
        reload: function (names, forceNewSectionTimestamp) {
            $(document).trigger('customerData:reload', {
                sections: names,
                forceNewSectionTimestamp: forceNewSectionTimestamp
            });
        },

        /**
         * @param {Array} names
         */
        invalidate: function (names) {
            $(document).trigger('customerData:invalidate', {
                sections: names
            });
        },

        getInitCustomerData: function () {
            return deferred.promise();
        },

        /**
         * @return {Array}
         */
        getExpiredSectionNames: function () {
            if (!window.customerDataCmp) {
                return [];
            }

            return window.customerDataCmp.getExpiredSectionNames();
        }
    };
})();

$.breezemap['Magento_Customer/js/customer-data'] = $.sections;
$.breezemap['Magento_Customer/js/section-config'] = $.sections;

(function () {
    'use strict';

    var sections = $.sections,
        storage = $.storage.ns('mage-cache-storage');

    $(document).on('ajaxComplete', function (event, data) {
        var names,
            response = data.response,
            request = data.response.req,
            redirects = ['redirect', 'backUrl'];

        if (!request.method.match(/post|put|delete/i)) {
            return;
        }

        names = sections.getAffectedSections(request.url);

        if (!names.length) {
            return;
        }

        sections.invalidate(names);

        if (_.isObject(response.body) && !_.isEmpty(_.pick(response.body, redirects))) {
            return;
        }

        sections.reload(names, true);
    });

    $(document).on('submit', function (event) {
        var names;

        if (!event.target.method.match(/post|put|delete/i)) {
            return;
        }

        names = sections.getAffectedSections(event.target.action);

        if (!names.length) {
            return;
        }

        sections.invalidate(names);
        $.storage.remove(names);
    });

    $(document).on('breeze:load', function () {
        $.each(storage.get(), function (name, value) {
            sections.set(name, value);
        });
    });
})();
