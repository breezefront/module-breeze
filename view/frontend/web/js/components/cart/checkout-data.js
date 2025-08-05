(() => {
    'use strict';

    var storage = $.storage.ns('mage-cache-storage'),
        getMethodName = function (name, prefix, suffix) {
            prefix = prefix || '';
            suffix = suffix || '';

            return prefix + name.charAt(0).toUpperCase() + name.slice(1) + suffix;
        };

    (() => {
        var cacheKey = 'checkout-data',
            updateCheckoutData = (data) => storage.set(cacheKey, _.extend(storage.get(cacheKey) || {}, data)),
            snakeCase = (string) => string.replace(/([A-Z])/g, ($1) => '_' + $1.toLowerCase());

        $.breezemap['Magento_Checkout/js/checkout-data'] = {
            setShippingAddressFromData: (address) => {
                var data = {};

                $.each(address, (key, value) => {
                    data[snakeCase(key)] = value;
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
            },
            isChanged: function (key, value) {
                var methodName = getMethodName(key, '_is', 'Changed');

                if (this[methodName]) {
                    return this[methodName](value);
                }

                return this.get(key) !== value;
            },
            _isAddressChanged: function (address) {
                return JSON.stringify(_.pick(this.get('address'), this.requiredFields)) !==
                    JSON.stringify(_.pick(address, this.requiredFields));
            },
            _isSubtotalChanged: function (subtotal) {
                return subtotal !== parseFloat(this.get('totals').subtotal);
            },
        };
    })();
})();
