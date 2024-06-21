(function () {
    'use strict';

    var options = window.sectionsConfig;

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

    $.sections = {
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

        //
        // The methods below are deprecated.
        // Use $.customerData or 'Magento_Customer/js/customer-data' instead.
        //
        get: function (name) {
            return $.customerData.get(name);
        },
        set: function (name, section) {
            $.customerData.set(name, section);
        },
        reload: function (names, forceNewSectionTimestamp) {
            return $.customerData.reload(names, forceNewSectionTimestamp);
        },
        invalidate: function (names) {
            $.customerData.invalidate(names);
        },
        getInitCustomerData: function () {
            return $.customerData.getInitCustomerData();
        },
        initStorage: function () {
            $.customerData.initStorage();
        },
        getExpiredSectionNames: function () {
            return $.customerData.getExpiredSectionNames();
        }
    };

    $.breezemap['Magento_Customer/js/section-config'] = $.sections;
})();
