/* global breeze _ */
(function () {
    'use strict';

    var customerData,
        storage = breeze.storage.ns('mage-cache-storage'),
        storageInvalidation = breeze.storage.ns('mage-cache-storage-section-invalidation');

    /**
     * @param {Object} settings
     */
    function invalidateCacheBySessionTimeOut(settings) {
        var date = new Date(Date.now() + parseInt(settings.cookieLifeTime, 10) * 1000);

        if (new Date(storage.get('mage-cache-timeout')) < new Date()) {
            storage.removeAll();
        }

        storage.set('mage-cache-timeout', date);
    }

    /**
     * Invalidate Cache By Close Cookie Session
     */
    function invalidateCacheByCloseCookieSession() {
        if (!breeze.cookies.get('mage-cache-sessid')) {
            breeze.cookies.set('mage-cache-sessid', true);
            storage.removeAll();
        }
    }

    customerData = {
        /**
         * @param {Object} settings
         */
        initialize: function (settings) {
            this.options = settings;
            invalidateCacheBySessionTimeOut(this.options);
            invalidateCacheByCloseCookieSession();
            this.init();
        },

        /** Init component */
        init: function () {
            var sectionNames = this.getExpiredSectionNames();

            // store switcher
            if (breeze.cookies.get('section_data_clean')) {
                breeze.cookies.set('section_data_clean', '');
                this.reload([], true);

                return;
            }

            $.each(storage.get(), function (name, value) {
                breeze.sections.set(name, value);
            });

            if (sectionNames.length > 0) {
                this.reload(sectionNames);
            }
        },

        /**
         * @return {Array}
         */
        getExpiredSectionNames: function () {
            var expiredSectionNames = storageInvalidation.keys(),
                cookieSectionTimestamps = breeze.cookies.getJson('section_data_ids') || {},
                sectionLifetime = this.options.expirableSectionLifetime * 60,
                currentTimestamp = Math.floor(Date.now() / 1000),
                sectionData;

            // process sections that can expire due to lifetime constraints
            _.each(this.options.expirableSectionNames, function (sectionName) {
                sectionData = storage.get(sectionName);

                if (sectionData && sectionData.data_id + sectionLifetime <= currentTimestamp) {
                    expiredSectionNames.push(sectionName);
                }
            });

            // process sections that can expire due to storage information inconsistency
            _.each(cookieSectionTimestamps, function (cookieSectionTimestamp, sectionName) {
                sectionData = storage.get(sectionName);

                if (!sectionData || sectionData.data_id != cookieSectionTimestamp) { //eslint-disable-line
                    expiredSectionNames.push(sectionName);
                }
            });

            // remove expired section names of previously installed/enable modules
            expiredSectionNames = _.intersection(expiredSectionNames, breeze.sections.getSectionNames());

            return _.uniq(expiredSectionNames);
        },

        /**
         * @param {Array} sections
         * @param {Boolean} forceNewSectionTimestamp
         */
        reload: function (sections, forceNewSectionTimestamp) {
            var urlSuffix = '',
                params = {};

            sections = sections || [];

            if (sections.length) {
                params.sections = sections.join(',');
            }

            if (forceNewSectionTimestamp) {
                params.force_new_section_timestamp = true;
            }

            if (!_.isEmpty(params)) {
                urlSuffix = '?' + (new URLSearchParams(params)).toString();
            }

            fetch(this.options.sectionLoadUrl + urlSuffix)
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var sectionDataIds = breeze.cookies.getJson('section_data_ids') || {};

                    $(document).trigger('customer-data-reload', [sections]);

                    $.each(data, function (sectionName, sectionData) {
                        sectionDataIds[sectionName] = sectionData.data_id;
                        storage.set(sectionName, sectionData);
                        storageInvalidation.remove(sectionName);
                        breeze.sections.set(sectionName, sectionData);
                    });

                    breeze.cookies.setJson('section_data_ids', sectionDataIds);
                });
        },

        /**
         * @param {Array} sectionNames
         */
        invalidate: function (sectionNames) {
            var sectionDataIds = breeze.cookies.getJson('section_data_ids') || {};

            sectionNames = _.contains(sectionNames, '*') ?
                breeze.sections.getSectionNames() : sectionNames;

            $(document).trigger('customer-data-invalidate', [sectionNames]);

            storage.remove(sectionNames);

            // Invalidate section in cookie (increase version of section with 1000)
            $(sectionNames)
                .filter(function () {
                    return !breeze.sections.isClientSideSection(this);
                })
                .each(function () {
                    sectionDataIds[this] += 1000;
                    storageInvalidation.set(this, true);
                });

            breeze.cookies.setJson('section_data_ids', sectionDataIds);
        }
    };

    document.addEventListener('breeze:mount:Magento_Customer/js/customer-data', function (event) {
        customerData.initialize(event.detail.settings);
    });

    $(document).on('submit', function (event) {
        var sections;

        if (!event.target.method.match(/post|put|delete/i)) {
            return;
        }

        sections = breeze.sections.getAffectedSections(event.target.action);

        if (!sections.length) {
            return;
        }

        customerData.invalidate(sections);
    });
})();
