/* global breeze */
(function () {
    'use strict';

    breeze.widget('productValidate', {
        /** Initialize plugin */
        create: function () {
            this.element.validator();
            this.element.catalogAddToCart(this.options);
        }
    });

    $(document).on('breeze:mount:Magento_Catalog/js/validate-product', function (event, data) {
        $(data.el).productValidate(data.settings);
    });
})();
