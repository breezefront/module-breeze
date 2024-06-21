(function () {
    'use strict';

    $.view('compareProducts', {
        component: 'Magento_Catalog/js/view/compare-products',
        compareProducts: $.customerData.get('compare-products')
    });
})();
