(() => {
    'use strict';

    var address = function (data) {
        var identifier = Date.now(),
            countryId = data.country_id || data.countryId || window.checkoutConfig?.defaultCountryId,
            regionId = data.region?.region_id || data.regionId || data.region_id;

        // eslint-disable-next-line eqeqeq
        if (countryId && !regionId && countryId == window.checkoutConfig?.defaultCountryId) {
            regionId = window.checkoutConfig?.defaultRegionId || undefined;
        }

        return {
            email: data.email,
            countryId: countryId,
            regionId: regionId,
            regionCode: data.region?.region_code || data.regionCode || data.region_code,
            region: _.isObject(data.region) ? data.region?.region : data.region,
            customerId: data.customerId || data.customer_id,
            street: data.street,
            company: data.company,
            telephone: data.telephone,
            fax: data.fax,
            postcode: data.postcode,
            city: data.city,
            firstname: data.firstname,
            lastname: data.lastname,
            middlename: data.middlename,
            prefix: data.prefix,
            suffix: data.suffix,
            vatId: data.vat_id,
            customAttributes: data.custom_attributes,
            extensionAttributes: data.extension_attributes,
            country_id: countryId,
            region_id: regionId,
            region_code: data.region?.region_code || data.regionCode || data.region_code,
            getType: function () {
                return 'new-customer-address';
            },
            getKey: function () {
                return this.getType();
            },
            getCacheKey: function () {
                return this.getType() + identifier;
            },
        };
    };

    $.breezemap['Magento_Checkout/js/model/new-customer-address'] = address;
})();
