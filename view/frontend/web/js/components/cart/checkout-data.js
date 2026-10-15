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
            snakeCase = (string) => string.replace(/([A-Z])/g, ($1) => '_' + $1.toLowerCase()),
            getShippingAddressByStore = function (shippingAddressObj) {
                if (!shippingAddressObj) {
                    return null;
                }

                return shippingAddressObj[window.checkoutConfig?.storeCode];
            },
            setShippingAddressByStore = function (shippingAddressObj, data) {
                return { ...shippingAddressObj, [window.checkoutConfig?.storeCode]: data };
            };

        $.breezemap['Magento_Checkout/js/checkout-data'] = {
            setSelectedShippingAddress: (address) => updateCheckoutData({ selectedShippingAddress: address }),
            getSelectedShippingAddress: () => storage.get(cacheKey)?.selectedShippingAddress,
            setShippingAddressFromData: (address) => {
                var data = {};

                $.each(address, (key, value) => {
                    data[snakeCase(key)] = value;
                });

                updateCheckoutData({
                    shippingAddressFromData: setShippingAddressByStore(
                        storage.get(cacheKey)?.shippingAddressFromData,
                        data
                    )
                });
            },
            getShippingAddressFromData: () => getShippingAddressByStore(storage.get(cacheKey)?.shippingAddressFromData),
            setNewCustomerShippingAddress: (address) => updateCheckoutData({
                newCustomerShippingAddress: setShippingAddressByStore(
                    storage.get(cacheKey)?.newCustomerShippingAddress,
                    address
                )
            }),
            getNewCustomerShippingAddress: () => getShippingAddressByStore(storage.get(cacheKey)?.newCustomerShippingAddress),
            setSelectedShippingRate: (rate) => updateCheckoutData({ selectedShippingRate: rate }),
            getSelectedShippingRate: () => storage.get(cacheKey)?.selectedShippingRate,
            setSelectedPaymentMethod: (data) => updateCheckoutData({ selectedPaymentMethod: data }),
            getSelectedPaymentMethod: () => storage.get(cacheKey)?.selectedPaymentMethod,
            setSelectedBillingAddress: (address) => updateCheckoutData({ selectedBillingAddress: address }),
            getSelectedBillingAddress: () => storage.get(cacheKey)?.selectedBillingAddress,
            setBillingAddressFromData: (address) => updateCheckoutData({ billingAddressFromData: address }),
            getBillingAddressFromData: () => storage.get(cacheKey)?.billingAddressFromData,
            setNewCustomerBillingAddress: (address) => updateCheckoutData({ newCustomerBillingAddress: address }),
            getNewCustomerBillingAddress: () => storage.get(cacheKey)?.newCustomerBillingAddress,
            setValidatedEmailValue: (email) => updateCheckoutData({ validatedEmailValue: email }),
            getValidatedEmailValue: () => storage.get(cacheKey)?.validatedEmailValue || '',
            setInputFieldEmailValue: (email) => updateCheckoutData({ inputFieldEmailValue: email }),
            getInputFieldEmailValue: () => storage.get(cacheKey)?.inputFieldEmailValue || '',
            setCheckedEmailValue: (email) => updateCheckoutData({ checkedEmailValue: email }),
            getCheckedEmailValue: () => storage.get(cacheKey)?.checkedEmailValue || '',
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
