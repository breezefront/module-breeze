define([
    'underscore'
], function (_) {
    'use strict';

    var productInfo = ko.observableArray([]);

    $.breezemap['Magento_Catalog/js/product/view/product-info'] = productInfo;
    $.breezemap['Magento_Catalog/js/product/view/product-ids'] = ko.observableArray([]);

    return function ($form) {
        var product = _.findWhere($form.serializeArray(), {
                name: 'product'
            });

        if (!_.isUndefined(product)) {
            productInfo().push({
                id: product.value
            });
        }

        return _.uniq(productInfo(), function (item) {
            return item.id;
        });
    };
});
