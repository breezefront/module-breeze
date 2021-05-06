(function () {
    'use strict';

    $.view('compareProducts', {
        component: 'Magento_Catalog/js/view/compare-products',
        compareProducts: $.sections.get('compare-products')
    });
})();
