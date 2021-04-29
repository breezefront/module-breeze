/* global breeze _ */
(function () {
    'use strict';

    $(document).on('breeze:mount:Magento_Catalog/js/product/view/provider', function (event, data) {
        var products = $.storage.ns('product_data_storage'),
            recentlyViewed = $.storage.ns('recently_viewed_product'),
            scope = data.settings.data.productCurrentScope,
            scopeId = breeze.getScopeId(scope);

        _.each(data.settings.data.items, function (item, key) {
            products.set(key, item);
            recentlyViewed.set(scope + '-' + scopeId + '-' + key, {
                'added_at': new Date().getTime() / 1000,
                'product_id': key,
                'scope_id': scopeId
            });
        });
    });
})();
