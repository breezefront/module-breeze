/* global breeze _ */
(function () {
    'use strict';

    $(document).on('breeze:mount:Magento_Catalog/js/product/view/provider', function (event) {
        var products = breeze.storage.ns('product_data_storage'),
            recentlyViewed = breeze.storage.ns('recently_viewed_product'),
            scope = event.detail.settings.data.productCurrentScope,
            scopeId = breeze.getScopeId(scope);

        _.each(event.detail.settings.data.items, function (item, key) {
            products.set(key, item);
            recentlyViewed.set(scope + '-' + scopeId + '-' + key, {
                'added_at': new Date().getTime() / 1000,
                'product_id': key,
                'scope_id': scopeId
            });
        });
    });
})();
