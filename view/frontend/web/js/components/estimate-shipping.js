(() => {
    'use strict';

    var storage = $.storage.ns('mage-cache-storage');

    $.view('estimateShipping', {
        component: 'Swissup_Breeze/js/components/estimate-shipping',
        defaults: {
            countryId: window.checkoutConfig.defaultCountryId,
            regionId: window.checkoutConfig.defaultRegionId || '',
            region: '',
            postcode: '',
            availableCountries: [],
            availableRegions: [],
        },

        create: function () {
            Object.entries(storage.get('cart-data')?.address || {}).forEach(([key, value]) => {
                if (this[key] !== undefined) {
                    this[key] = value;
                }
            });

            this.observe('countryId regionId region postcode availableCountries availableRegions');
            this.onDirectoryDataUpdate();

            this.countryId.subscribe(this.onCountryChange.bind(this));
            this.regionId.subscribe(this.updateShippingAddress.bind(this));
            this.region.subscribe(this.updateShippingAddress.bind(this));
            this.postcode.subscribe(this.updateShippingAddress.bind(this));

            $.sections.get('directory-data').subscribe(this.onDirectoryDataUpdate.bind(this));
        },

        onCountryChange: function () {
            this.region('');
            this.postcode('');
            this.updateAvailableRegions();
            this.updateShippingAddress();
        },

        onDirectoryDataUpdate: function () {
            this.updateAvailableCountries();
            this.updateAvailableRegions();
        },

        updateAvailableCountries: function () {
            this.availableCountries.removeAll();
            this.availableCountries.push({ label: '', value: '' });

            Object.entries($.sections.get('directory-data')()).map(([code, item]) => {
                    return {
                        value: code,
                        label: item.name || code
                    };
                })
                .filter(item => item.value !== 'data_id')
                .sort((a, b) => a.label.localeCompare(b.label)) // todo: Top destinations
                .map((item) => this.availableCountries.push(item));
        },

        updateAvailableRegions: function () {
            var countries = $.sections.get('directory-data')(),
                regions = countries[this.countryId()]?.regions;

            this.availableRegions.removeAll();

            if (!regions) {
                return;
            }

            this.availableRegions.push({ label: $t('Please select a region, state or province'), value: '' });
            Object.entries(regions).map(([id, item]) => {
                    return {
                        label: item.name,
                        value: id
                    };
                })
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((item) => this.availableRegions.push(item));
        },

        updateShippingAddress: _.debounce(function () {
            var countries = $.sections.get('directory-data')(),
                regions = countries[this.countryId()]?.regions,
                address = {
                    countryId: this.countryId(),
                    regionCode: '',
                    region: this.region(),
                    postcode: ''
                };

            if (this.regionId()) {
                address.regionId = this.regionId();
                address.regionCode = regions[this.regionId()]?.code;
                address.region = regions[this.regionId()]?.name;
            }

            this.updateCartData({
                address: address
            });

            this.fetchShippingRates().then(this.fetchTotals);
        }, 200),

        fetchShippingRates: function () {
            var url = window.checkoutConfig.isCustomerLoggedIn ?
                '/carts/mine/estimate-shipping-methods'
                : `/guest-carts/${window.checkoutConfig.quoteData.entity_id}/estimate-shipping-methods`;

            return $.post($.breeze.url.rest(url), {
                global: false,
                data: {
                    address: storage.get('cart-data').address
                }
            });
        },

        fetchTotals: function () {
            var url = window.checkoutConfig.isCustomerLoggedIn ?
                '/carts/mine/totals-information'
                : `/guest-carts/${window.checkoutConfig.quoteData.entity_id}/totals-information`;

            return $.post($.breeze.url.rest(url), {
                global: false,
                data: {
                    addressInformation: {
                        address: storage.get('cart-data').address,
                        shipping_carrier_code: '',
                        shipping_method_code: ''
                    }
                }
            });
        },

        updateCartData: function (data) {
            storage.set('cart-data', _.extend({
                // totals: null,
                address: null,
                // cartVersion: null,
                shippingMethodCode: null,
                shippingCarrierCode: null,
                // rates: null
            }, data));
        }
    });
})();
