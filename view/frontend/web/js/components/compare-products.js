(function () {
    'use strict';

    $.view('compareProducts', {
        component: 'Magento_Catalog/js/view/compare-products',
        compareProducts: $.customerData.get('compare-products'),
    });

    $.widget('mage.compareList', {
        component: 'compareList',

        /** @inheritdoc */
        _create: function () {
            $(this.options.windowPrintSelector).on('click', function (e) {
                e.preventDefault();
                window.print();
            });
        }
    });
})();
