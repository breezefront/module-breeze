define([
    'uiComponent',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/model/cart/cache',
    'Magento_Checkout/js/model/new-customer-address',
    'Swissup_Breeze/js/components/cart/estimation-services'
], function (Component, quote, checkoutData, cartData, addressModel, estimation) {
    'use strict';

    Component.extend({
        component: 'Swissup_Breeze/js/components/estimate-shipping',
        defaults: {
            countryId: window.checkoutConfig.defaultCountryId,
            regionId: window.checkoutConfig.defaultRegionId || '',
            region: '',
            postcode: '',
            availableCountries: [],
            availableRegions: [],
            rates: cartData.get('rates') || [],
            isShippingBlockVisible: cartData.get('rates')?.length > 0,
            isDisplayShippingPriceExclTax: window.checkoutConfig.isDisplayShippingPriceExclTax,
            isDisplayShippingBothPrices: window.checkoutConfig.isDisplayShippingBothPrices,
        },

        create: function () {
            Object.entries(quote.shippingAddress() || {}).forEach(([key, value]) => {
                if (this[key] !== undefined) {
                    this[key] = value;
                }
                this.addressField(key).val(value);
            });

            this.observe([
                'countryId',
                'regionId',
                'region',
                'postcode',
                'availableCountries',
                'availableRegions',
                'rates',
                'isLoading',
                'isShippingBlockVisible',
            ]);
            this.onDirectoryDataUpdate();

            this.countryId.subscribe(this.onCountryChange.bind(this));
            this.regionId.subscribe(this.updateShippingAddress.bind(this));
            this.region.subscribe(this.updateShippingAddress.bind(this));
            this.postcode.subscribe(this.updateShippingAddress.bind(this));
            this.addressForm().on('input', this.updateShippingAddress.bind(this));

            $.sections.get('directory-data').subscribe(this.onDirectoryDataUpdate.bind(this));

            if (!cartData.get('rates') || !quote.shippingAddress()) {
                this.updateShippingAddress();
            } else {
                this.fetchTotals();
            }
        },

        addressForm: function () {
            return this.element.find('#shipping-zip-form');
        },

        addressField: function (name) {
            return this.addressForm().find(`[name="${name}"]`);
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
            var countries = $.sections.get('directory-data')() || {},
                regions = countries[this.countryId()]?.regions;

            this.availableRegions.removeAll();
            this.availableRegions.push({ label: $t('Please select a region, state or province.'), value: '' });

            if (!regions) {
                return;
            }

            Object.entries(regions).map(([id, item]) => {
                    return {
                        label: item.name,
                        value: id
                    };
                })
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((item) => this.availableRegions.push(item));
        },

        hasAvailableRegions: function () {
            return this.availableRegions().length > 1;
        },

        updateShippingAddress: _.debounce(function () {
            var countries = $.sections.get('directory-data')() || {},
                regions = countries[this.countryId()]?.regions || {},
                address = _.extend(this.addressForm().serializeJSON(), {
                    regionCode: '',
                    region_id: undefined,
                    region: this.region(),
                    postcode: this.postcode()
                });

            if (this.countryId()) {
                address.countryId = this.countryId();
                address.country_id = this.countryId();
            }

            if (this.regionId()) {
                address.regionId = this.regionId();
                address.regionCode = regions[this.regionId()]?.code;
                address.region = regions[this.regionId()]?.name;
            }

            cartData.set('address', address);
            checkoutData.setShippingAddressFromData(address);
            quote.shippingAddress(addressModel(address));

            this.isLoading(true);

            estimation.getShippingRates().then(result => {
                cartData.set('rates', result.body);
                this.isLoading(false);
                this.isShippingBlockVisible(true);
                this.rates(result.body);
                this.shippingMethodToQuote();
                this.fetchTotals();
            });
        }, 200),

        fetchTotals: function () {
            return estimation.getTotals().then(result => {
                quote.setTotals(result.body);
            });
        },

        shippingRates: function () {
            return this.rates();
        },

        shippingRateGroups: function () {
            return [...new Set(this.rates().map(rate => rate.carrier_title))];
        },

        getRatesForGroup: function (group) {
            return this.rates().filter(rate => rate.carrier_title === group);
        },

        shippingMethod: ko.computed(function () {
            var method = quote.shippingMethod();

            if (!method) {
                return null;
            }

            return method.carrier_code + '_' + method.method_code;
        }),

        selectShippingMethod: function (method) {
            checkoutData.setSelectedShippingRate(method ? method.carrier_code + '_' + method.method_code : null);
            cartData.set('shippingCarrierCode', method?.carrier_code);
            cartData.set('shippingMethodCode', method?.method_code);
            quote.shippingMethod(method);
            this.fetchTotals();
            return true;
        },

        shippingMethodToQuote: function () {
            var method = null;

            if (this.rates().length === 1) {
                method = this.rates()[0];
            } else if (this.shippingMethod() && this.rates().length > 1) {
                method = this.rates().find(rate => {
                    return rate.carrier_code + '_' + rate.method_code === this.shippingMethod();
                });
            }

            quote.shippingMethod(method);
        },

        getFormattedPrice: function (price) {
            return $.catalog.priceUtils.formatPriceLocale(price, quote.getPriceFormat());
        }
    });
});
