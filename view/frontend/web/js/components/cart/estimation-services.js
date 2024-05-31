define([
    'mage/url',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/totals',
    'Magento_Checkout/js/model/cart/cache'
], function (urlBuilder, quote, totals, cartData) {
    'use strict';

    var states = {},
        isLoading = function (id, flag) {
            if (!states[id]) {
                states[id] = ko.observable();
            }

            states[id](flag);

            return states[id];
        };

    $.breezemap['Swissup_Breeze/js/components/cart/estimation-services'] = {
        isLoading: isLoading,

        getShippingRates: function () {
            var url = window.checkoutConfig.isCustomerLoggedIn ?
                '/carts/mine/estimate-shipping-methods'
                : `/guest-carts/${quote.getQuoteId()}/estimate-shipping-methods`;

            isLoading('shippingRates', true);

            return $.post({
                url: urlBuilder.rest(url),
                global: false,
                data: {
                    address: quote.shippingAddress()
                },
                always: () => isLoading('shippingRates', false)
            });
        },

        getTotals: function () {
            var url = window.checkoutConfig.isCustomerLoggedIn ?
                    '/carts/mine/totals-information'
                    : `/guest-carts/${quote.getQuoteId()}/totals-information`;

            isLoading('totals', true);
            totals.isLoading(true);

            return $.post({
                url: urlBuilder.rest(url),
                global: false,
                data: {
                    addressInformation: {
                        address: _.pick(quote.shippingAddress(), cartData.requiredFields),
                        shipping_carrier_code: quote.shippingMethod()?.carrier_code,
                        shipping_method_code: quote.shippingMethod()?.method_code
                    }
                },
                always: () => {
                    isLoading('totals', true);
                    totals.isLoading(false);
                }
            });
        }
    };
});
