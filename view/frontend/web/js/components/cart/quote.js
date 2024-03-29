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
        config = window.checkoutConfig || {
            items: [],
            extension_attributes: [],
            total_segments: [],
            totalsData: {},
        },
        shippingAddress = ko.observable(null),
        shippingMethod = ko.observable(null),
        totals = ko.observable(processTotalsData(config.totalsData));

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
        totals: totals,
        shippingAddress: shippingAddress,
        shippingMethod: shippingMethod,
        getQuoteId: () => config.quoteData?.entity_id,
        isVirtual: () => !!Number(config.quoteData?.is_virtual),
        getPriceFormat: () => config.priceFormat,
        getBasePriceFormat: () => config.basePriceFormat,
        getItems: () => config.quoteItemData,
        getTotals: () => totals,
        setTotals: (data) => totals(processTotalsData(data)),
        getStoreCode: () => config.storeCode
    };

    (() => {
        var quoteItems = ko.observable(totals().items);

        totals.subscribe(newValue => quoteItems(newValue.items));

        $.breezemap['Magento_Checkout/js/model/totals'] = {
            totals: totals,
            isLoading: ko.observable(false),
            getItems: () => quoteItems,
            getSegment: (code) => totals().total_segments?.find(item => item.code === code)
        };
    })();
});
