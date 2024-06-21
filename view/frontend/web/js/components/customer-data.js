(function () {
    'use strict';

    var customerData,
        deferred = $.Deferred(),
        sectionConfig = $.sections,
        disposableSubscriptions = new WeakMap(),
        storage = $.storage.ns('mage-cache-storage'),
        storageInvalidation = $.storage.ns('mage-cache-storage-section-invalidation');

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
        if (!$.cookies.get('mage-cache-sessid')) {
            $.cookies.set('mage-cache-sessid', true, {
                domain: false
            });
            storage.removeAll();
        }
    }

    customerData = {
        data: {},

        /**
         * @param {Object} settings
         */
        initialize: function (settings) {
            this.options = settings;
            invalidateCacheBySessionTimeOut(this.options);
            invalidateCacheByCloseCookieSession();
            this.create();
            deferred.resolve();
            $(document).trigger('customerData:afterInitialize');
        },

        create: function () {
            var sectionNames;

            // store switcher
            if ($.cookies.get('section_data_clean')) {
                $.cookies.set('section_data_clean', '');

                return this.reload([], true);
            }

            // magento bugfix for deprecated/removed cookie
            if (this.options.expirableSectionNames &&
                _.isEmpty($.cookies.getJson('section_data_ids') || {})
            ) {
                return this.reload([], true);
            }

            sectionNames = this.getExpiredSectionNames();

            if (sectionNames.length > 0) {
                this.reload(sectionNames);
            }
        },

        initStorage: function () {
            // dummy method for luma compatibility
        },

        /**
         * @return {Array}
         */
        getExpiredSectionNames: function () {
            var expiredSectionNames = storageInvalidation.keys(),
                cookieSectionTimestamps = $.cookies.getJson('section_data_ids') || {},
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
            expiredSectionNames = _.intersection(expiredSectionNames, $.sections.getSectionNames());

            return _.uniq(expiredSectionNames);
        },

        get: function (name) {
            if (!this.data[name]) {
                this.data[name] = ko.observable({});
            }

            return this.data[name];
        },

        set: function (name, section) {
            this.get(name)(section);
        },

        /**
         * @param {Array} sections
         * @param {Boolean} forceNewSectionTimestamp
         */
        reload: function (sections, forceNewSectionTimestamp) {
            var params = {};

            if (!this.options) {
                return this.invalidate(sections);
            }

            sections = $.sections.filterClientSideSections(sections || []);

            if (sections.length) {
                params.sections = sections.join(',');
            }

            if (forceNewSectionTimestamp) {
                params.force_new_section_timestamp = true;
            }

            $.request.get({
                url: this.options.sectionLoadUrl,
                data: params,
                accept: 'json',
                success: function (data) {
                    var sectionDataIds = $.cookies.getJson('section_data_ids') || {};

                    $.each(data, function (sectionName, sectionData) {
                        // No need to store messages, but data_id must be
                        // in storage otherwise it will expire.
                        if (sectionName === 'messages') {
                            sectionData = {
                                data_id: sectionData.data_id,
                                messages: []
                            };
                        }

                        sectionDataIds[sectionName] = sectionData.data_id;
                        storage.set(sectionName, sectionData);
                        storageInvalidation.remove(sectionName);
                        $.customerData.set(sectionName, sectionData);
                    });

                    $(document).trigger('customer-data-reload', {
                        sections: sections,
                        response: data
                    });

                    $.cookies.setJson('section_data_ids', sectionDataIds, {
                        domain: false
                    });
                }
            });
        },

        /**
         * @param {Array} sections
         */
        invalidate: function (sections) {
            var sectionDataIds = $.cookies.getJson('section_data_ids') || {};

            sections = _.contains(sections, '*') ?
                $.sections.getSectionNames() : sections;

            $(document).trigger('customer-data-invalidate', {
                sections: sections
            });

            storage.remove(sections);

            // Invalidate section in cookie (increase version of section with 1000)
            $(sections)
                .filter(function () {
                    return !$.sections.isClientSideSection(this);
                })
                .each(function () {
                    sectionDataIds[this] += 1000;
                    storageInvalidation.set(this, true);
                });

            $.cookies.setJson('section_data_ids', sectionDataIds, {
                domain: false
            });
        },

        getInitCustomerData: function () {
            return deferred.promise();
        },

        onAjaxComplete: function (jsonResponse, settings) {
            var sections,
                redirects = ['redirect', 'backUrl'];

            if (settings.type.match(/post|put|delete/i)) {
                sections = sectionConfig.getAffectedSections(settings.url);

                if (sections && sections.length) {
                    this.invalidate(sections);

                    if (_.isObject(jsonResponse) && !_.isEmpty(_.pick(jsonResponse, redirects))) { //eslint-disable-line
                        return;
                    }
                    this.reload(sections, true);
                }
            }
        }
    };

    window.customerData = $.customerData = $.breezemap['Magento_Customer/js/customer-data'] = customerData;

    ko.extenders.disposableCustomerData = function (target, sectionName) {
        var sectionDataIds, newSectionDataIds = {};

        if (!disposableSubscriptions.has(target)) {
            disposableSubscriptions.set(target, {});
        }

        if (disposableSubscriptions.get(target)[sectionName]) {
            return target;
        }

        disposableSubscriptions.get(target)[sectionName] = target.subscribe(function () {
            setTimeout(function () {
                storage.remove(sectionName);
                sectionDataIds = $.cookieStorage.getJson('section_data_ids') || {};
                _.each(sectionDataIds, function (data, name) {
                    if (name !== sectionName) {
                        newSectionDataIds[name] = data;
                    }
                });
                $.cookieStorage.setJson('section_data_ids', newSectionDataIds, {
                    domain: false
                });
            }, 3000);
        });

        return target;
    };

    $(document).on('customerData:reload', function (event, data) {
        customerData.reload(data.sections, data.forceNewSectionTimestamp);
    });

    $(document).on('customerData:invalidate', function (event, data) {
        customerData.invalidate(data.sections);
    });

    $(document).on('breeze:load', function () {
        $.each(storage.get(), function (name, value) {
            customerData.set(name, value);
        });
        customerData.initialize(window.customerDataConfig);
        window.customerDataCmp = customerData;
    });

    $(document).on('ajaxComplete', function (event, data) {
        customerData.onAjaxComplete(data.response.body, data.settings);
    });

    $(document).on('submit', function (event) {
        var names;

        if (!event.target.method.match(/post|put|delete/i)) {
            return;
        }

        names = sectionConfig.getAffectedSections(event.target.action);

        if (!names.length) {
            return;
        }

        customerData.invalidate(names);
        $.storage.remove(names);
    });
})();
