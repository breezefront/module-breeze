/* global breeze */
(function () {
    'use strict';

    breeze.view('compareProducts', {
        compareProducts: breeze.sections.get('compare-products')
    });

    $(document).on('breeze:mount:Magento_Catalog/js/view/compare-products', function (event) {
        $(event.detail.el).compareProducts(event.detail.settings);
    });
})();
