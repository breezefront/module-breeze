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
            rates: storage.get('cart-data')?.rates || [],
            isShippingBlockVisible: storage.get('cart-data')?.rates?.length > 0,
            isDisplayShippingPriceExclTax: window.checkoutConfig.isDisplayShippingPriceExclTax,
            isDisplayShippingBothPrices: window.checkoutConfig.isDisplayShippingBothPrices,
            shippingMethod: window.checkoutConfig.selectedShippingMethod
        },

        create: function () {
            var cartData = storage.get('cart-data') || {};

            Object.entries(cartData.address || {}).forEach(([key, value]) => {
                if (this[key] !== undefined) {
                    this[key] = value;
                }
            });

            if (cartData.shippingCarrierCode) {
                this.shippingMethod = cartData.shippingCarrierCode + '_' + cartData.shippingMethodCode;
            }

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
                'shippingMethod'
            ]);
            this.onDirectoryDataUpdate();

            this.countryId.subscribe(this.onCountryChange.bind(this));
            this.regionId.subscribe(this.updateShippingAddress.bind(this));
            this.region.subscribe(this.updateShippingAddress.bind(this));
            this.postcode.subscribe(this.updateShippingAddress.bind(this));

            $.sections.get('directory-data').subscribe(this.onDirectoryDataUpdate.bind(this));

            if (!cartData.rates) {
                this.updateShippingAddress();
            }
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
            this.availableRegions.push({ label: $t('Please select a region, state or province'), value: '' });

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
                address = {
                    regionCode: '',
                    region: this.region(),
                    postcode: ''
                };

            if (this.countryId()) {
                address.countryId = this.countryId();
            }

            if (this.regionId()) {
                address.regionId = this.regionId();
                address.regionCode = regions[this.regionId()]?.code;
                address.region = regions[this.regionId()]?.name;
            }

            this.updateCartData({
                address: address
            });

            this.fetchShippingRates().then(this.fetchTotals.bind(this));
        }, 200),

        fetchShippingRates: function () {
            var url = window.checkoutConfig.isCustomerLoggedIn ?
                '/carts/mine/estimate-shipping-methods'
                : `/guest-carts/${window.checkoutConfig.quoteData.entity_id}/estimate-shipping-methods`;

            this.isLoading(true);

            return $.post($.breeze.url.rest(url), {
                global: false,
                data: {
                    address: storage.get('cart-data').address
                },
                success: rates => {
                    this.isShippingBlockVisible(true);
                    this.rates(rates);
                    this.updateCartData({
                        rates: rates
                    });
                },
                always: () => this.isLoading(false)
            });
        },

        fetchTotals: function () {
            var url = window.checkoutConfig.isCustomerLoggedIn ?
                    '/carts/mine/totals-information'
                    : `/guest-carts/${window.checkoutConfig.quoteData.entity_id}/totals-information`,
                cartData = storage.get('cart-data') || {};

            this.isLoading(true);

            return $.post($.breeze.url.rest(url), {
                global: false,
                data: {
                    addressInformation: {
                        address: cartData.address,
                        shipping_carrier_code: cartData.shippingCarrierCode,
                        shipping_method_code: cartData.shippingMethodCode
                    }
                },
                always: () => this.isLoading(false)
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

        selectShippingMethod: function (method) {
            this.shippingMethod(method.carrier_code + '_' + method.method_code);
            this.updateCartData({
                shippingCarrierCode: method.carrier_code,
                shippingMethodCode: method.method_code,
            });
            this.fetchTotals();

            return true;
        },

        getFormattedPrice: function (price) {
            return $.catalog.priceUtils.formatPriceLocale(price, window.checkoutConfig.priceFormat);
        },

        updateCartData: function (data) {
            storage.set('cart-data', _.extend(storage.get('cart-data') || {}, data));

            if (data.address) {
                this.updateCheckoutData({
                    shippingAddressFromData: data.address
                });
            }

            if (data.shippingCarrierCode) {
                this.updateCheckoutData({
                    selectedShippingRate: this.shippingMethod()
                });
            }
        },

        updateCheckoutData: function (data) {
            storage.set('checkout-data', _.extend(storage.get('checkout-data') || {}, data));
        }
    });
})();
