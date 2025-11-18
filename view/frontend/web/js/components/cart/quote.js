define([
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/model/cart/cache',
    'Magento_Checkout/js/model/new-customer-address'
], function (checkoutData, cartData, addressModel) {
    'use strict';

    var processTotalsData = function (data) {
            if (_.isObject(data.extension_attributes)) {
                _.each(data.extension_attributes, function (element, index) {
                    data[index] = element;
                });
            }

            return data;
        },
        billingAddress = ko.observable(null),
        paymentMethod = ko.observable(null),
        shippingAddress = ko.observable(null),
        shippingMethod = ko.observable(null),
        totals = ko.observable(processTotalsData(window.checkoutConfig.totalsData));

    if (cartData.get('totals')) {
        totals(cartData.get('totals'));
    }

    if (checkoutData.getShippingAddressFromData() || cartData.get('address')) {
        shippingAddress(addressModel(checkoutData.getShippingAddressFromData() || cartData.get('address')));
    }

    (() => {
        var rates = cartData.get('rates') || [],
            preferredRate = checkoutData.getSelectedShippingRate();

        if (rates.length === 1) {
            shippingMethod(rates[0]);
        } else if (rates.length > 1 && preferredRate) {
            shippingMethod(rates.find(method => {
                return method.carrier_code + '_' + method.method_code === preferredRate;
            }));
        }
    })();

    totals.subscribe(data => cartData.set('totals', data));

    $.breezemap['Magento_Checkout/js/model/quote'] = {
        totals,
        billingAddress,
        paymentMethod,
        shippingAddress,
        shippingMethod,
        getQuoteId: () => window.checkoutConfig?.quoteData?.entity_id,
        isVirtual: () => !!Number(window.checkoutConfig?.quoteData?.is_virtual),
        getPriceFormat: () => window.checkoutConfig?.priceFormat,
        getBasePriceFormat: () => window.checkoutConfig?.basePriceFormat,
        getItems: () => window.checkoutConfig?.quoteItemData,
        getTotals: () => totals,
        setTotals: (data) => totals(processTotalsData(data)),
        getStoreCode: () => window.checkoutConfig?.storeCode,
        isPersistent: () => !!Number(window.checkoutConfig?.quoteData?.is_persistent),
    };

    (() => {
        var quoteItems = ko.observable(totals().items);

        totals.subscribe(newValue => quoteItems(newValue.items));

        $.breezemap['Magento_Checkout/js/model/totals'] = {
            totals: totals,
            isLoading: ko.observable(false),
            getItems: () => quoteItems,
            getSegment: (code) => totals().total_segments?.find(item => item.code === code) || null
        };
    })();
});
