(() => {
    'use strict';

    var storage = $.storage.ns('mage-cache-storage');

    (() => {
        var cacheKey = 'checkout-data',
            updateCheckoutData = (data) => storage.set(cacheKey, _.extend(storage.get(cacheKey) || {}, data)),
            kebabCase = (string) => string.replace(/([A-Z])/g, ($1) => '_' + $1.toLowerCase());

        $.breezemap['Magento_Checkout/js/checkout-data'] = {
            setShippingAddressFromData: (address) => {
                var data = {};

                $.each(address, (key, value) => {
                    data[kebabCase(key)] = value;
                });

                updateCheckoutData({ shippingAddressFromData: data });
            },
            setSelectedShippingRate: (rate) => updateCheckoutData({ selectedShippingRate: rate }),
            getShippingAddressFromData: () => storage.get(cacheKey)?.shippingAddressFromData,
            getSelectedShippingRate: () => storage.get(cacheKey)?.selectedShippingRate
        };
    })();

    (() => {
        var cacheKey = 'cart-data',
            updateCartData = (data) => storage.set(cacheKey, _.extend(storage.get(cacheKey) || {}, data));

        $.breezemap['Magento_Checkout/js/model/cart/cache'] = {
            requiredFields: ['countryId', 'region', 'regionId', 'postcode'],
            set: (key, value) => updateCartData(key === cacheKey ? value : { [key]: value }),
            get: (key) => {
                var data = storage.get(cacheKey);

                if (!key || key === cacheKey) {
                    return data;
                }

                return data ? data[key] : null;
            }
        };
    })();
})();
