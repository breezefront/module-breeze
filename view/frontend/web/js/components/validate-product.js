(function () {
    'use strict';

    $.widget('productValidate', {
        component: 'Magento_Catalog/js/validate-product',

        /** Initialize plugin */
        create: function () {
            this.element.validator();
            this.element.catalogAddToCart(this.options);
        }
    });
})();
