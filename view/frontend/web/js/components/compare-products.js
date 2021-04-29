(function () {
    'use strict';

    $.view('compareProducts', {
        compareProducts: $.sections.get('compare-products')
    });

    $(document).on('breeze:mount:Magento_Catalog/js/view/compare-products', function (event, data) {
        $(data.el).compareProducts(data.settings);
    });
})();
