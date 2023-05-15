(() => {
    'use strict';

    var storage = $.storage.ns('mage-cache-storage');

    (() => {
        var cacheKey = 'checkout-data',
            updateCheckoutData = (data) => storage.set(cacheKey, _.extend(storage.get(cacheKey) || {}, data));

        $.breezemap['Magento_Checkout/js/checkout-data'] = {
            setShippingAddressFromData: (address) => updateCheckoutData({ shippingAddressFromData: address }),
            setSelectedShippingRate: (rate) => updateCheckoutData({ selectedShippingRate: rate }),
            getShippingAddressFromData: () => storage.get(cacheKey)?.shippingAddressFromData,
            getSelectedShippingRate: () => storage.get(cacheKey)?.selectedShippingRate
        };
    })();

    (() => {
        var cacheKey = 'cart-data',
            updateCartData = (data) => storage.set(cacheKey, _.extend(storage.get(cacheKey) || {}, data));

        $.breezemap['Magento_Checkout/js/model/cart/cache'] = {
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
